"use server";

import { Content, Part } from "@google/genai";
import prisma from "../db/prisma";
import { getGoogleGenAI } from "../llm/providers";
import {
  queryQuestionsToolDeclaration,
  submitQuestionSelectionToolDeclaration,
  submitAnswerEvaluationToolDeclaration,
  executeQueryQuestionsFromBank,
  executeFallbackQuestionSelection,
} from "./tools";
import { getModelName } from "../llm/router";

const CAPTAIN_CHILI_PROMPTS = {
  selectQuestions: (competencyName: string) => `
You are Captain Chili, a super friendly, relaxed, and encouraging Capybara AI Teacher assistant.
Your main goal is to help teach the student and assess their learning progress effectively.

You need to select exactly 5 questions to diagnose and evaluate a student's understanding of the following competency:
"${competencyName}"

Instructions:
1. First, search for candidate questions using the tool "queryQuestionsFromBank". Search with different Bloom's taxonomy levels (C1 to C6) and keywords relevant to the topic.
2. Carefully review the retrieved questions. Pick 5 questions that offer a balanced progression from foundational understanding (C1-C2) to deeper application and analysis (C3-C6).
3. Once you have chosen the best 5 questions, you MUST call the tool "submitQuestionSelection" with your selected 5 question IDs.
`,

  evaluateAnswers: (answersData: string) => `
You are Captain Chili, a friendly and warm Capybara AI Teacher who loves guiding students toward mastery.
Your goal is to provide pedagogical feedback that helps the student learn from their results, feel motivated, and build confidence.

Review the student's submission for 5 quiz questions:
${answersData}

Instructions:
1. Provide short, constructive, and highly encouraging pedagogical feedback in Indonesian as Captain Chili the Capybara mentor.
2. Acknowledge what the student did well, explain concepts gently if they made mistakes, and inspire a growth mindset ("Santai tapi fokus bersama Kapten Chili!").
3. Determine conceptUnderstood: Set conceptUnderstood to true ONLY if the student demonstrated genuine understanding by correctly answering key concept and higher-difficulty questions in this batch.
4. You MUST call the tool "submitAnswerEvaluation" with your feedback and conceptUnderstood assessment.
`,
};

/**
 * Selects 5 balanced diagnostic questions for a given competency using Google GenAI SDK tool calling.
 */
export async function agentSelectQuestions(kompetensiBabId: number): Promise<number[]> {
  const { ai, reportError } = await getGoogleGenAI()
  try {
    const competency = await prisma.kompetensiBab.findUnique({
      where: { id: kompetensiBabId },
    });
    const competencyName = competency?.isiKompetensi || `Kompetensi ID ${kompetensiBabId}`;
    const prompt = CAPTAIN_CHILI_PROMPTS.selectQuestions(competencyName);

    let selectedIds: number[] = [];

    const contents: Content[] = [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ];

    const tools = [
      {
        functionDeclarations: [
          queryQuestionsToolDeclaration,
          submitQuestionSelectionToolDeclaration,
        ],
      },
    ];

    // Multi-turn agent interaction loop
    const MAX_TURNS = 6;
    for (let turn = 0; turn < MAX_TURNS; turn++) {
      const response = await ai.models.generateContent({
        model: await getModelName("quiz_agent", "GEMINI"),
        contents,
        config: {
          tools,
          systemInstruction:
            "You are Captain Chili, a pedagogical Capybara AI Teacher assistant focused on effective student learning and scaffolding.",
        },
      });

      const candidate = response.candidates?.[0];
      const modelContent = candidate?.content;

      if (!modelContent) {
        break;
      }

      // Push model's turn to conversation history
      contents.push(modelContent);

      const functionCalls = response.functionCalls;
      if (!functionCalls || functionCalls.length === 0) {
        // Model stopped calling tools
        break;
      }

      const responseParts: Part[] = [];

      for (const call of functionCalls) {
        if (call.name === "queryQuestionsFromBank") {
          const args = (call.args || {}) as { bloomLevel?: string; keyword?: string };
          const bloomLevel = args.bloomLevel || "C1";
          const keyword = args.keyword || "";

          const queryResult = await executeQueryQuestionsFromBank(
            kompetensiBabId,
            bloomLevel,
            keyword
          );

          responseParts.push({
            functionResponse: {
              name: "queryQuestionsFromBank",
              response: queryResult as unknown as Record<string, unknown>,
            },
          });
        } else if (call.name === "submitQuestionSelection") {
          const args = (call.args || {}) as { selectedIds?: number[] };
          if (Array.isArray(args.selectedIds)) {
            selectedIds = args.selectedIds.map(Number);
          }

          responseParts.push({
            functionResponse: {
              name: "submitQuestionSelection",
              response: { status: "registered", count: selectedIds.length },
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

      if (selectedIds.length === 5) {
        return selectedIds;
      }
    }

    if (selectedIds.length === 5) {
      return selectedIds;
    }

    // Fallback: direct database query if tool loop ended without 5 selected IDs
    const fallbackIds = await executeFallbackQuestionSelection(kompetensiBabId);
    if (fallbackIds.length > 0) {
      return fallbackIds;
    }

    throw new Error("No questions available for this competency");
  } catch (error) {
    console.error("Error in agentSelectQuestions:", error);
    return await executeFallbackQuestionSelection(kompetensiBabId);
  }
}

/**
 * Evaluates student quiz answers and generates pedagogical feedback from Captain Chili.
 */
export async function agentEvaluateAnswers(
  questionsWithAnswers: any[]
): Promise<{ feedback: string; conceptUnderstood: boolean }> {
  const { ai, reportError } = await getGoogleGenAI()
  const formattedData = questionsWithAnswers.map((item) => ({
    question: item.text,
    options: item.options,
    studentAnswer: item.studentAnswer,
    correctAnswer: item.correctAnswer,
    isCorrect: item.isCorrect,
    difficulty: item.difficulty || 5,
    bloomLevel: item.bloomLevel || "C1",
  }));

  const prompt = CAPTAIN_CHILI_PROMPTS.evaluateAnswers(
    JSON.stringify(formattedData, null, 2)
  );

  try {
    let evaluationResult: { feedback: string; conceptUnderstood: boolean } | null = null;

    const contents: Content[] = [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ];

    const tools = [
      {
        functionDeclarations: [submitAnswerEvaluationToolDeclaration],
      },
    ];

    const response = await ai.models.generateContent({
      model: await getModelName("quiz_agent", "GEMINI"),
      contents,
      config: {
        tools,
        systemInstruction:
          "You are Captain Chili, an encouraging Capybara AI Teacher mentor guiding students with growth-mindset feedback.",
      },
    });

    const functionCalls = response.functionCalls;
    if (functionCalls && functionCalls.length > 0) {
      const evalCall = functionCalls.find((c) => c.name === "submitAnswerEvaluation");
      if (evalCall && evalCall.args) {
        const args = evalCall.args as any;
        if (typeof args.feedback === "string" && typeof args.conceptUnderstood === "boolean") {
          evaluationResult = {
            feedback: args.feedback,
            conceptUnderstood: args.conceptUnderstood,
          };
        }
      }
    }

    if (evaluationResult) {
      return evaluationResult;
    }

    throw new Error("Agent evaluation tool call not received");
  } catch (error) {
    console.error("Error in agentEvaluateAnswers:", error);
    const correctCount = questionsWithAnswers.filter((q) => q.isCorrect).length;
    const highDifficultyCorrect = questionsWithAnswers.filter(
      (q) => q.isCorrect && (q.difficulty || 5) >= 6
    ).length;
    const isConceptUnderstood =
      correctCount >= 4 || (correctCount >= 3 && highDifficultyCorrect >= 2);

    return {
      feedback: `Halo kawan! Kamu berhasil menjawab ${correctCount} dari 5 soal dengan benar. Tetap santai dan semangat belajar bersama Kapten Chili ya! 🦫🌶️`,
      conceptUnderstood: isConceptUnderstood,
    };
  }
}
