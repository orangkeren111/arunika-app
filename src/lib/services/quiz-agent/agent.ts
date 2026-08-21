"use server";

import { generateText, jsonSchema, isStepCount } from "ai";
import { getFastTextModel, getSmartTextModel } from "../llm/providers";
import prisma from "../db/prisma";

const QUIZ_AGENT_PROMPTS = {
  selectQuestions: (competencyName: string) => `
You are an expert AI Teacher Assistant (acting as a friendly Eagle Mascot named Elang).
Your task is to select exactly 5 questions to assess a student's understanding of the following competency:
"${competencyName}"

To find questions, you must call the tool "queryQuestionsFromBank". 
Try searching with different Bloom's taxonomy levels (C1 to C6) and keywords related to the competency topic.
Once you have retrieved a pool of questions, you must select exactly 5 questions that provide a balanced mix of difficulty and Bloom's levels, and submit them by calling the tool "submitQuestionSelection" with your selected 5 question IDs.
`,

  evaluateAnswers: (answersData: string) => `
You are Elang, a friendly and encouraging Eagle Mascot who acts as an AI Teacher.
Review the student's answers for the 5 quiz questions. Provide a short, constructive, and fun feedback in Indonesian.
Act like an encouraging mentor. Also, determine if the student has demonstrated a strong understanding of this competency (e.g. got most/all answers correct with good logic).

Student Session Data:
${answersData}

You MUST call the tool "submitAnswerEvaluation" with your feedback and understanding assessment.
`
};

export async function agentSelectQuestions(kompetensiBabId: number): Promise<number[]> {
  try {
    const competency = await prisma.kompetensiBab.findUnique({
      where: { id: kompetensiBabId },
    });
    const competencyName = competency?.isiKompetensi || `Competency ID ${kompetensiBabId}`;
    const prompt = QUIZ_AGENT_PROMPTS.selectQuestions(competencyName);

    let selectedIds: number[] = [];

    const result = await generateText({
      model: getFastTextModel(),
      prompt,
      tools: {
        queryQuestionsFromBank: {
          description: "Search and retrieve questions from the bank for this competency filtering by Bloom's taxonomy level (C1-C6) and a search keyword.",
          inputSchema: jsonSchema<{ bloomLevel: string; keyword: string }>({
            type: "object",
            properties: {
              bloomLevel: {
                type: "string",
                enum: ["C1", "C2", "C3", "C4", "C5", "C6"],
                description: "Bloom's taxonomy level (C1-C6)",
              },
              keyword: {
                type: "string",
                description: "Keyword to match against the question text",
              },
            },
            required: ["bloomLevel", "keyword"],
          }),
          execute: async ({ bloomLevel, keyword }) => {
            // Primary Search: competency + bloomLevel + keyword
            let questions = await prisma.bankSoal.findMany({
              where: {
                kompetensiBabId,
                bloomLevel,
                teksSoal: { contains: keyword, mode: "insensitive" },
                isAccepted: true,
                isRejected: false,
              },
              select: {
                id: true,
                teksSoal: true,
                difficulty: true,
                bloomLevel: true,
              },
            });

            // Fallback 1: Search by competency + bloomLevel (without keyword)
            if (questions.length === 0) {
              questions = await prisma.bankSoal.findMany({
                where: {
                  kompetensiBabId,
                  bloomLevel,
                  isAccepted: true,
                  isRejected: false,
                },
                select: {
                  id: true,
                  teksSoal: true,
                  difficulty: true,
                  bloomLevel: true,
                },
              });
            }

            // Fallback 2: Search by competency + keyword (without bloomLevel)
            if (questions.length === 0) {
              questions = await prisma.bankSoal.findMany({
                where: {
                  kompetensiBabId,
                  teksSoal: { contains: keyword, mode: "insensitive" },
                  isAccepted: true,
                  isRejected: false,
                },
                select: {
                  id: true,
                  teksSoal: true,
                  difficulty: true,
                  bloomLevel: true,
                },
              });
            }

            // Fallback 3: Retrieve any questions in this competency
            if (questions.length === 0) {
              questions = await prisma.bankSoal.findMany({
                where: {
                  kompetensiBabId,
                  isAccepted: true,
                  isRejected: false,
                },
                select: {
                  id: true,
                  teksSoal: true,
                  difficulty: true,
                  bloomLevel: true,
                },
                take: 15,
              });
            }

            return {
              status: "success",
              count: questions.length,
              questions: questions.map(q => ({
                id: q.id,
                text: q.teksSoal,
                difficulty: q.difficulty,
                bloomLevel: q.bloomLevel,
              })),
            };
          },
        },
        submitQuestionSelection: {
          description: "Submit the list of exactly 5 selected question IDs.",
          inputSchema: jsonSchema<{ selectedIds: number[] }>({
            type: "object",
            properties: {
              selectedIds: {
                type: "array",
                items: { type: "number" },
                description: "Exactly 5 question IDs selected from the pool",
              },
            },
            required: ["selectedIds"],
          }),
          execute: async (args: { selectedIds: number[] }) => {
            selectedIds = args.selectedIds;
            return "Question selection registered.";
          },
        },
      },
      stopWhen: isStepCount(5), // Allow more steps for querying and selecting
    });

    // Fallback in case tool execution didn't populate selectedIds
    if (selectedIds.length === 0 && result.toolCalls && result.toolCalls.length > 0) {
      const call = result.toolCalls.find((c) => c.toolName === "submitQuestionSelection") as any;
      if (call && call.args && Array.isArray(call.args.selectedIds)) {
        selectedIds = call.args.selectedIds.map(Number);
      }
    }

    if (selectedIds.length === 5) {
      return selectedIds;
    }

    // Ultimate fallback: query directly and return any 5 questions if agent failed
    const directQuestions = await prisma.bankSoal.findMany({
      where: {
        kompetensiBabId,
        isAccepted: true,
        isRejected: false,
      },
      select: { id: true },
      take: 5,
    });
    if (directQuestions.length > 0) {
      return directQuestions.map((q) => q.id);
    }

    throw new Error("No questions available for this competency");
  } catch (error) {
    console.error("Error in agentSelectQuestions:", error);
    // Ultimate fallback empty array or generic logic
    return [];
  }
}

export async function agentEvaluateAnswers(
  questionsWithAnswers: any[]
): Promise<{ feedback: string; conceptUnderstood: boolean }> {
  const formattedData = questionsWithAnswers.map((item) => ({
    question: item.text,
    options: item.options,
    studentAnswer: item.studentAnswer,
    correctAnswer: item.correctAnswer,
    isCorrect: item.isCorrect,
    difficulty: item.difficulty || 5,
    bloomLevel: item.bloomLevel || "C1",
  }));

  const prompt = QUIZ_AGENT_PROMPTS.evaluateAnswers(JSON.stringify(formattedData, null, 2));

  try {
    let evaluationResult: { feedback: string; conceptUnderstood: boolean } | null = null;

    const result = await generateText({
      model: getSmartTextModel(),
      prompt,
      tools: {
        submitAnswerEvaluation: {
          description: "Submit evaluation feedback and concept understanding assessment for the student.",
          inputSchema: jsonSchema<{ feedback: string; conceptUnderstood: boolean }>({
            type: "object",
            properties: {
              feedback: {
                type: "string",
                description: "Constructive, friendly feedback in Indonesian written as Elang the eagle mascot.",
              },
              conceptUnderstood: {
                type: "boolean",
                description: "true ONLY if student correctly answered the relatively high-weight / high-difficulty questions in this competency batch (demonstrated mastery, not just random guessing on easy ones)",
              },
            },
            required: ["feedback", "conceptUnderstood"],
          }),
          execute: async (args: { feedback: string; conceptUnderstood: boolean }) => {
            evaluationResult = args;
            return "Evaluation saved.";
          },
        },
      },
      stopWhen: isStepCount(3),
    });

    // Fallback in case tool execution didn't populate evaluationResult
    if (!evaluationResult && result.toolCalls && result.toolCalls.length > 0) {
      const call = result.toolCalls.find((c) => c.toolName === "submitAnswerEvaluation") as any;
      if (call && call.args) {
        evaluationResult = call.args;
      }
    }

    if (evaluationResult) {
      return evaluationResult;
    }
    throw new Error("Agent failed to provide evaluation feedback");
  } catch (error) {
    console.error("Error in agentEvaluateAnswers:", error);
    const correctCount = questionsWithAnswers.filter((q) => q.isCorrect).length;
    // Weighted fallback calculation: Check if high-difficulty questions (difficulty >= 6) were answered correctly
    const highDifficultyCorrect = questionsWithAnswers.filter((q) => q.isCorrect && (q.difficulty || 5) >= 6).length;
    const isConceptUnderstood = correctCount >= 4 || (correctCount >= 3 && highDifficultyCorrect >= 2);

    return {
      feedback: `Hebat! Kamu berhasil menjawab ${correctCount} dari 5 soal dengan benar. Terus semangat belajar bersama Elang ya!`,
      conceptUnderstood: isConceptUnderstood,
    };
  }
}
