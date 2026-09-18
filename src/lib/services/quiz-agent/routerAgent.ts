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
import { getGoogleGenAI } from "../llm/providers";
import { getModelName } from "../llm/router";

export interface MicroPayloadVector {
  q_id: number;
  type: string;
  bloom: string;
  tag: string;
  student_answer?: string;
  reference_answer?: string;
  ok: boolean;
  ans_time_s: number;
}

export interface RouterEvaluationResult {
  nextAction: "NEXT_BATCH" | "REMEDIATE_CHAT" | "MASTERED" | "FAIL_SESSION";
  feedback: string;
  thoughtProcess: string;
  conceptUnderstood: boolean;
  failedTags: string[];
  nextQuestionIds: number[];
  gradedBatchData?: any[]; // The array updated by the AI
}

const ROUTER_SYSTEM_PROMPT = `
You are Captain Chili, the Autonomous Supervisor Router Agent for Arunika Quiz Engine.
You receive both micro-payload vectors and the full evaluation batch data (evalBatchData) containing student answers.

Your responsibilities:
1. ESSAY GRADING: If a question is of type "ESSAY", read the 'studentAnswer' and compare it to the 'correctAnswer' (reference rubric). If the student's answer captures the core concept (even if worded differently), consider it CORRECT.
2. ANALYZE: Evaluate the overall performance based on the graded accuracy.
3. ROUTE: Determine the next action.

Pedagogical Rules for Routing:
- Accuracy >= 80% (4 or 5 out of 5 correct) with success on higher Bloom levels (C3-C6) -> set nextAction to "MASTERED".
- Repeated foundational failures (accuracy < 60% with mistakes on C1-C2 levels or specific concept tags) -> set nextAction to "REMEDIATE_CHAT", list the failedTags, and set conceptUnderstood to false.
- Moderate performance (e.g. 60-79% accuracy) -> set nextAction to "NEXT_BATCH", conceptUnderstood false.
- Consecutive severe failure streak (wrongStreak >= 5) -> set nextAction to "FAIL_SESSION".

Execution Procedure:
1. ALWAYS analyze the student's errors (and evaluate essays) in your 'thoughtProcess' first.
2. Call tool "submitAnswerEvaluation" with your computed (thoughtProcess, nextAction, feedback, conceptUnderstood, failedTags) AND the 'gradedEssays' array containing the IDs of essays you determined are CORRECT.
3. If nextAction is "NEXT_BATCH", you MUST subsequently query the bank using "queryQuestionsFromBank" and submit 5 pre-selected question IDs for the upcoming batch using "submitQuestionSelection".
`;

export async function runRouterAgentEvaluation(
  sessionId: number,
  kompetensiBabId: number,
  vectors: MicroPayloadVector[],
  evalBatchData: any[],
  wrongStreak: number = 0
): Promise<RouterEvaluationResult> {
  const { ai, reportError } = await getGoogleGenAI()
  let nextAction: "NEXT_BATCH" | "REMEDIATE_CHAT" | "MASTERED" | "FAIL_SESSION" = "NEXT_BATCH";
  let feedback = "Tetap semangat dan santai bersama Kapten Chili! 🦫🌶️";
  let thoughtProcess = "Sedang mengevaluasi jawaban esai dan menganalisis hasil belajar secara mendalam...";
  let conceptUnderstood = false;
  let failedTags: string[] = [];
  let nextQuestionIds: number[] = [];
  let finalGradedBatchData = [...evalBatchData];

  try {
    const competency = await prisma.kompetensiBab.findUnique({
      where: { id: kompetensiBabId },
    });
    const competencyName = competency?.isiKompetensi || `Kompetensi ID ${kompetensiBabId}`;

    // Pass the rich evalBatchData so the LLM can read the essay text and reference answers
    const userPrompt = `
Session ID: ${sessionId}
Competency: "${competencyName}"
Wrong Streak: ${wrongStreak}

Micro-Payload Vectors (Quick Overview):
${JSON.stringify(vectors.map(v => ({ id: v.q_id, type: v.type, tag: v.tag, ok: v.ok })), null, 2)}

Full Batch Data for Grading (Pay attention to ESSAY types, compare studentAnswer to correctAnswer):
${JSON.stringify(evalBatchData.map(q => ({
      id: q.id,
      type: q.type,
      text: q.text,
      studentAnswer: q.studentAnswer,
      correctAnswer: q.correctAnswer
    })), null, 2)}
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
          if (args.thoughtProcess) thoughtProcess = args.thoughtProcess;
          if (args.nextAction) nextAction = args.nextAction;
          if (args.feedback) feedback = args.feedback;
          if (typeof args.conceptUnderstood === "boolean") conceptUnderstood = args.conceptUnderstood;
          if (Array.isArray(args.failedTags)) failedTags = args.failedTags;

          // CRITICAL: Apply the AI's essay grades back to the data array
          if (Array.isArray(args.gradedCorrectEssayIds)) {
            finalGradedBatchData = finalGradedBatchData.map(item => {
              if (item.type === "ESSAY" && args.gradedCorrectEssayIds.includes(item.id)) {
                return { ...item, isCorrect: true };
              }
              return item;
            });
          }

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

      if (nextAction === "NEXT_BATCH" && nextQuestionIds.length === 5) break;
      if (nextAction !== "NEXT_BATCH" && feedback) break;
    }
  } catch (error) {
    console.error("Error in runRouterAgentEvaluation:", error);
  }

  if (nextAction === "NEXT_BATCH" && nextQuestionIds.length < 5) {
    nextQuestionIds = await executeFallbackQuestionSelection(kompetensiBabId);
  }

  // NOTE: Database Mode updating is now handled safely by the backend quizRepository!

  return {
    nextAction,
    feedback,
    thoughtProcess,
    conceptUnderstood,
    failedTags,
    nextQuestionIds,
    gradedBatchData: finalGradedBatchData // Return the newly graded array
  };
}