import { FunctionDeclaration, Type } from "@google/genai";
import prisma from "../db/prisma";

export interface QuestionBankItem {
  id: number;
  text: string;
  difficulty: number;
  bloomLevel: string;
  tags?: string[];
}

export interface QuestionQueryResult {
  status: string;
  count: number;
  questions: QuestionBankItem[];
}

/**
 * Executes direct and fallback database queries for questions matching competency, Bloom level, and tag/keyword.
 */
export async function executeQueryQuestionsFromBank(
  kompetensiBabId: number,
  bloomLevel?: string,
  tag?: string
): Promise<QuestionQueryResult> {
  const whereClause: any = {
    kompetensiBabId,
    isAccepted: true,
    isRejected: false,
  };

  if (bloomLevel) {
    whereClause.bloomLevel = bloomLevel;
  }

  if (tag && tag.trim() !== "") {
    whereClause.OR = [
      { tags: { has: tag } },
      { teksSoal: { contains: tag, mode: "insensitive" } },
    ];
  }

  let questions = await prisma.bankSoal.findMany({
    where: whereClause,
    select: {
      id: true,
      teksSoal: true,
      difficulty: true,
      bloomLevel: true,
      tags: true,
    },
    take: 10,
  });

  // Fallback 1: Search by competency & bloomLevel
  if (questions.length === 0 && bloomLevel) {
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
        tags: true,
      },
      take: 10,
    });
  }

  // Fallback 2: Retrieve any questions in this competency
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
        tags: true,
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
      tags: q.tags || [],
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
    "Search and retrieve questions from the bank for this competency, filtering by Bloom's taxonomy level (C1 to C6) and tag/keyword.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      bloomLevel: {
        type: Type.STRING,
        enum: ["C1", "C2", "C3", "C4", "C5", "C6"],
        description: "Bloom's taxonomy cognitive level (C1 to C6).",
      },
      tag: {
        type: Type.STRING,
        description: "Topic tag or keyword to filter questions.",
      },
    },
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
    "Submit pedagogical feedback, nextAction decision, concept evaluation, and your detailed internal thought process. Also submit IDs of any essay answers you determined are conceptually correct.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      thoughtProcess: {
        type: Type.STRING,
        description:
          "Your internal pedagogical reasoning. Analyze the student's errors, grade their essays by comparing studentAnswer to correctAnswer, identify knowledge gaps, and explain WHY you are choosing the nextAction. This will be shown to the student.",
      },
      nextAction: {
        type: Type.STRING,
        enum: ["NEXT_BATCH", "REMEDIATE_CHAT", "MASTERED", "FAIL_SESSION"],
        description: "The autonomous next decision for the session.",
      },
      feedback: {
        type: Type.STRING,
        description:
          "Warm, constructive, 1-2 sentence pedagogical feedback in Indonesian as Captain Chili the Capybara mentor.",
      },
      conceptUnderstood: {
        type: Type.BOOLEAN,
        description: "True ONLY if the student demonstrated genuine concept mastery.",
      },
      failedTags: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Array of tags/topics where the student showed misconceptions or errors.",
      },
      gradedCorrectEssayIds: {
        type: Type.ARRAY,
        items: { type: Type.NUMBER },
        description: "Array of Question IDs for ESSAY questions where you determined the student's answer was conceptually correct based on the reference answer.",
      }
    },
    required: ["thoughtProcess", "nextAction", "feedback", "conceptUnderstood"],
  },
};

/**
 * Tool Declaration: finishRemediationAndResumeQuiz
 */
export const finishRemediationAndResumeQuizToolDeclaration: FunctionDeclaration = {
  name: "finishRemediationAndResumeQuiz",
  description:
    "Tool called by tutorAgent ONLY when the student demonstrates clear concept understanding to close chat and trigger the next quiz batch.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      summary: {
        type: Type.STRING,
        description: "Brief recap of the remediated concept and student understanding.",
      },
      readyToResume: {
        type: Type.BOOLEAN,
        description: "Set to true to return the student to the active quiz batch.",
      },
    },
    required: ["readyToResume"],
  },
};