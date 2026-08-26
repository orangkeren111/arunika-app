import { FunctionDeclaration, Type } from "@google/genai";
import prisma from "../db/prisma";

export interface QuestionBankItem {
  id: number;
  text: string;
  difficulty: number;
  bloomLevel: string;
}

export interface QuestionQueryResult {
  status: string;
  count: number;
  questions: QuestionBankItem[];
}

/**
 * Executes direct and fallback database queries for questions matching competency, Bloom level, and keyword.
 */
export async function executeQueryQuestionsFromBank(
  kompetensiBabId: number,
  bloomLevel: string,
  keyword: string
): Promise<QuestionQueryResult> {
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
    questions: questions.map((q) => ({
      id: q.id,
      text: q.teksSoal,
      difficulty: q.difficulty,
      bloomLevel: q.bloomLevel || "C1",
    })),
  };
}

/**
 * Direct fallback question selection if agent tool iteration does not succeed.
 */
export async function executeFallbackQuestionSelection(kompetensiBabId: number): Promise<number[]> {
  const directQuestions = await prisma.bankSoal.findMany({
    where: {
      kompetensiBabId,
      isAccepted: true,
      isRejected: false,
    },
    select: { id: true },
    take: 5,
  });

  return directQuestions.map((q) => q.id);
}

/**
 * Tool Declaration: queryQuestionsFromBank
 */
export const queryQuestionsToolDeclaration: FunctionDeclaration = {
  name: "queryQuestionsFromBank",
  description:
    "Search and retrieve questions from the bank for this competency, filtering by Bloom's taxonomy level (C1 to C6) and search keywords.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      bloomLevel: {
        type: Type.STRING,
        enum: ["C1", "C2", "C3", "C4", "C5", "C6"],
        description: "Bloom's taxonomy cognitive level (C1 to C6).",
      },
      keyword: {
        type: Type.STRING,
        description: "Keyword to search within the question body.",
      },
    },
    required: ["bloomLevel", "keyword"],
  },
};

/**
 * Tool Declaration: submitQuestionSelection
 */
export const submitQuestionSelectionToolDeclaration: FunctionDeclaration = {
  name: "submitQuestionSelection",
  description:
    "Submit the final list of exactly 5 selected question IDs that best diagnose student understanding across difficulty and Bloom's levels.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      selectedIds: {
        type: Type.ARRAY,
        items: { type: Type.NUMBER },
        description: "An array of exactly 5 question IDs selected from the question bank.",
      },
    },
    required: ["selectedIds"],
  },
};

/**
 * Tool Declaration: submitAnswerEvaluation
 */
export const submitAnswerEvaluationToolDeclaration: FunctionDeclaration = {
  name: "submitAnswerEvaluation",
  description:
    "Submit pedagogical feedback and concept mastery evaluation for the student's quiz answers.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      feedback: {
        type: Type.STRING,
        description:
          "Friendly, constructive, and encouraging pedagogical feedback in Indonesian, written as Captain Chili the Capybara mentor.",
      },
      conceptUnderstood: {
        type: Type.BOOLEAN,
        description:
          "True ONLY if the student demonstrated genuine concept mastery by correctly answering key/higher-difficulty questions in this set.",
      },
    },
    required: ["feedback", "conceptUnderstood"],
  },
};
