"use server";

import { Content, Part } from "@google/genai";
import prisma from "../db/prisma";
import {
  queryQuestionsToolDeclaration,
  submitQuestionSelectionToolDeclaration,
  submitAnswerEvaluationToolDeclaration,
  executeQueryQuestionsFromBank,
  executeFallbackQuestionSelection,
} from "./tools";
import { updateQuizSessionMode } from "../db/quiz/quizDB";
import { getGoogleGenAI } from "../llm/providers";
import { getModelName } from "../llm/router";

export interface MicroPayloadVector {
  q_id: number;
  bloom: string;
  tag: string;
  ok: boolean;
  ans_time_s: number;
}

export interface RouterEvaluationResult {
  nextAction: "NEXT_BATCH" | "REMEDIATE_CHAT" | "MASTERED" | "FAIL_SESSION";
  feedback: string;
  conceptUnderstood: boolean;
  failedTags: string[];
  nextQuestionIds: number[];
}

const ROUTER_SYSTEM_PROMPT = `
You are Captain Chili, the Autonomous Supervisor Router Agent for Arunika Quiz Engine.
Your responsibility is to analyze student performance micro-payload vectors: [{ q_id, bloom, tag, ok, ans_time_s }].

Pedagogical Rules for Evaluation:
1. Accuracy >= 80% (4 or 5 out of 5 correct) with success on higher Bloom levels (C3-C6) -> set nextAction to "MASTERED".
2. Repeated foundational failures (accuracy < 60% with mistakes on C1-C2 levels or specific concept tags) -> set nextAction to "REMEDIATE_CHAT", list the failedTags, and set conceptUnderstood to false.
3. Moderate performance (e.g. 60-79% accuracy, or minor mistakes without fundamental gap) -> set nextAction to "NEXT_BATCH", conceptUnderstood false.
4. Consecutive severe failure streak (wrongStreak >= 5) -> set nextAction to "FAIL_SESSION".

Execution Procedure:
- Call tool "submitAnswerEvaluation" with your computed (nextAction, feedback, conceptUnderstood, failedTags).
- If nextAction is "NEXT_BATCH", you MUST subsequently query the bank using "queryQuestionsFromBank" and submit 5 pre-selected question IDs for the upcoming batch using "submitQuestionSelection".
`;

export async function runRouterAgentEvaluation(
  sessionId: number,
  kompetensiBabId: number,
  vectors: MicroPayloadVector[],
  wrongStreak: number = 0
): Promise<RouterEvaluationResult> {
  const { ai, reportError } = await getGoogleGenAI()
  let nextAction: "NEXT_BATCH" | "REMEDIATE_CHAT" | "MASTERED" | "FAIL_SESSION" = "NEXT_BATCH";
  let feedback = "Tetap semangat dan santai bersama Kapten Chili! 🦫🌶️";
  let conceptUnderstood = false;
  let failedTags: string[] = [];
  let nextQuestionIds: number[] = [];

  // Local fallback heuristic calculation
  const totalCount = vectors.length || 1;
  const correctCount = vectors.filter((v) => v.ok).length;
  const accuracy = correctCount / totalCount;

  // Extract failed tags
  const failedVectors = vectors.filter((v) => !v.ok);
  failedTags = Array.from(new Set(failedVectors.map((v) => v.tag).filter(Boolean)));

  // Fallback defaults in case LLM tool call isn't triggered
  if (accuracy >= 0.8) {
    nextAction = "MASTERED";
    conceptUnderstood = true;
  } else if (accuracy < 0.6 || failedVectors.some((v) => v.bloom === "C1" || v.bloom === "C2")) {
    if (wrongStreak >= 4) {
      nextAction = "FAIL_SESSION";
    } else {
      nextAction = "REMEDIATE_CHAT";
    }
  } else {
    nextAction = "NEXT_BATCH";
  }

  try {
    const competency = await prisma.kompetensiBab.findUnique({
      where: { id: kompetensiBabId },
    });
    const competencyName = competency?.isiKompetensi || `Kompetensi ID ${kompetensiBabId}`;

    const userPrompt = `
Session ID: ${sessionId}
Competency: "${competencyName}"
Wrong Streak: ${wrongStreak}
Micro-Payload Vectors:
${JSON.stringify(vectors, null, 2)}
`;

    const contents: Content[] = [
      {
        role: "user",
        parts: [{ text: userPrompt }],
      },
    ];

    const tools = [
      {
        functionDeclarations: [
          submitAnswerEvaluationToolDeclaration,
          queryQuestionsToolDeclaration,
          submitQuestionSelectionToolDeclaration,
        ],
      },
    ];

    const MAX_TURNS = 5;
    for (let turn = 0; turn < MAX_TURNS; turn++) {
      const response = await ai.models.generateContent({
        model: await getModelName("quiz_agent", "GEMINI"),
        contents,
        config: {
          tools,
          systemInstruction: ROUTER_SYSTEM_PROMPT,
        },
      });

      const candidate = response.candidates?.[0];
      const modelContent = candidate?.content;

      if (!modelContent) break;
      contents.push(modelContent);

      const functionCalls = response.functionCalls;
      if (!functionCalls || functionCalls.length === 0) break;

      const responseParts: Part[] = [];

      for (const call of functionCalls) {
        if (call.name === "submitAnswerEvaluation") {
          const args = (call.args || {}) as any;
          if (args.nextAction) nextAction = args.nextAction;
          if (args.feedback) feedback = args.feedback;
          if (typeof args.conceptUnderstood === "boolean") conceptUnderstood = args.conceptUnderstood;
          if (Array.isArray(args.failedTags)) failedTags = args.failedTags;

          responseParts.push({
            functionResponse: {
              name: "submitAnswerEvaluation",
              response: { status: "acknowledged", nextAction },
            },
          });
        } else if (call.name === "queryQuestionsFromBank") {
          const args = (call.args || {}) as any;
          const queryRes = await executeQueryQuestionsFromBank(
            kompetensiBabId,
            args.bloomLevel,
            args.tag
          );

          responseParts.push({
            functionResponse: {
              name: "queryQuestionsFromBank",
              response: queryRes as unknown as Record<string, unknown>,
            },
          });
        } else if (call.name === "submitQuestionSelection") {
          const args = (call.args || {}) as any;
          if (Array.isArray(args.selectedIds)) {
            nextQuestionIds = args.selectedIds.map(Number);
          }

          responseParts.push({
            functionResponse: {
              name: "submitQuestionSelection",
              response: { status: "registered", count: nextQuestionIds.length },
            },
          });
        }
      }

      if (responseParts.length > 0) {
        contents.push({
          role: "user",
          parts: responseParts,
        });
      }

      // If nextAction is NEXT_BATCH and we already have 5 nextQuestionIds, break early
      if (nextAction === "NEXT_BATCH" && nextQuestionIds.length === 5) {
        break;
      }
      // If nextAction is not NEXT_BATCH and evaluation has been submitted, break early
      if (nextAction !== "NEXT_BATCH" && feedback) {
        break;
      }
    }
  } catch (error) {
    console.error("Error in runRouterAgentEvaluation:", error);
  }

  // If nextAction === "NEXT_BATCH" but LLM didn't select 5 question IDs, fallback query
  if (nextAction === "NEXT_BATCH" && nextQuestionIds.length < 5) {
    nextQuestionIds = await executeFallbackQuestionSelection(kompetensiBabId);
  }

  // Update sessionMode in database based on nextAction decision
  let dbSessionMode: "QUIZ_ACTIVE" | "CHAT_REMEDIATION" | "MASTERED" | "FAILED" = "QUIZ_ACTIVE";
  if (nextAction === "REMEDIATE_CHAT") dbSessionMode = "CHAT_REMEDIATION";
  else if (nextAction === "MASTERED") dbSessionMode = "MASTERED";
  else if (nextAction === "FAIL_SESSION") dbSessionMode = "FAILED";

  await updateQuizSessionMode(sessionId, dbSessionMode);

  return {
    nextAction,
    feedback,
    conceptUnderstood,
    failedTags,
    nextQuestionIds,
  };
}
