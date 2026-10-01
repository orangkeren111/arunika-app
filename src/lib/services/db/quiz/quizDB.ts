"use server";

import prisma from "../prisma";
import { TipeSoal } from "@prisma/client";

const AFK_LIMIT_MS = 5 * 60 * 1000; // 5 Minutes
const SESSION_MAX_MS = 15 * 60 * 1000; // 15 Minutes

export async function getActiveSessionsCount(ujianId: number): Promise<number> {
  const cutoff = new Date(Date.now() - AFK_LIMIT_MS);

  // Kick AFK players first
  await prisma.quizSession.updateMany({
    where: {
      ujianId,
      status: "PLAYING",
      lastActiveAt: { lt: cutoff },
    },
    data: {
      status: "AFK",
    },
  });

  return await prisma.quizSession.count({
    where: {
      ujianId,
      status: "PLAYING",
      lastActiveAt: { gte: cutoff },
    },
  });
}

export async function joinOrRegisterQueue(siswaId: number, ujianId: number) {
  // Cancel previous active sessions of this student for this exam
  await prisma.quizSession.updateMany({
    where: {
      siswaId,
      ujianId,
      status: { in: ["WAITING", "PLAYING"] },
    },
    data: {
      status: "FINISHED",
    },
  });

  // Create new session
  return await prisma.quizSession.create({
    data: {
      siswaId,
      ujianId,
      status: "WAITING",
      currentLevel: -99,
      wrongStreak: 0,
      lastActiveAt: new Date(),
    },
  });
}

export async function claimPlayingSlot(sessionId: number, kompetensiBabId?: number): Promise<boolean> {
  return await prisma.$transaction(async (tx) => {
    const session = await tx.quizSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) return false;

    // Check concurrency limit of 20
    const cutoff = new Date(Date.now() - AFK_LIMIT_MS);
    const activeCount = await tx.quizSession.count({
      where: {
        ujianId: session.ujianId,
        status: "PLAYING",
        lastActiveAt: { gte: cutoff },
      },
    });

    if (activeCount < 20) {
      if (kompetensiBabId) {
        await tx.quizSession.update({
          where: { id: sessionId },
          data: {
            status: "PLAYING",
            currentLevel: kompetensiBabId,
            startedAt: new Date(),
            lastActiveAt: new Date(),
          },
        });
        return true;
      }
      return true;
    }
    return false;
  });
}

export async function updateQuizActivity(sessionId: number) {
  return await prisma.quizSession.update({
    where: { id: sessionId },
    data: {
      wrongStreak: 0,
      lastActiveAt: new Date(),
    },
  });
}

export async function finishOrFailSession(
  sessionId: number,
  status: "FINISHED" | "FAILED" | "AFK",
  reason?: string,
  latestCompetencyLog?: any
) {
  const existing = await prisma.quizSession.findUnique({
    where: { id: sessionId },
    select: { history: true },
  });

  let logs: any[] = [];
  if (existing?.history) {
    if (typeof existing.history === "object" && Array.isArray((existing.history as any).logs)) {
      logs = [...(existing.history as any).logs];
    } else if (Array.isArray(existing.history)) {
      logs = [...existing.history];
    }
  }

  if (latestCompetencyLog) {
    logs.push(latestCompetencyLog);
  }

  const finalHistoryData = {
    logs,
    finalStatus: status,
    finalReason: reason || status,
    finishedAt: new Date().toISOString(),
  };

  return await prisma.quizSession.update({
    where: { id: sessionId },
    data: {
      status,
      history: finalHistoryData as any,
    },
  });
}

export async function getLobbyQuizQuestions(ujianId: number) {
  // Fetch questions in Babs associated with this Ujian
  const babs = await prisma.ujianBab.findMany({
    where: { ujianId },
    select: { babId: true },
  });
  const babIds = babs.map((b) => b.babId);

  const questions = await prisma.bankSoal.findMany({
    where: {
      babId: { in: babIds },
      type: TipeSoal.MCQ,
      isAccepted: true,
      isRejected: false,
    },
  });

  // Shuffle and pick 10
  return questions.sort(() => 0.5 - Math.random()).slice(0, 10);
}

export async function getCompetenciesForUjian(ujianId: number, siswaId: number, sessionId?: number) {
  const competencies = await prisma.ujianTemplateKompetensi.findMany({
    where: { ujianId, isEnabled: true },
    include: {
      kompetensiBab: true,
    },
    orderBy: {
      kompetensiBab: { nomerKompetensi: "asc" },
    },
  });

  let historyLogs: any[] = [];
  if (sessionId) {
    const session = await prisma.quizSession.findMany({
      where: { siswaId: siswaId, ujianId: ujianId, startedAt: { not: null } },
      orderBy: { createdAt: "desc" },
    });
    if (session && typeof session === "object" && Array.isArray((session as any).logs)) {
      historyLogs = (session as any).logs;
    } else if (Array.isArray(session)) {
      historyLogs = session;
    }
  }

  return competencies.map((item) => {
    const finishedLog = historyLogs.find(
      (l: any) =>
        l.currentLevel === item.kompetensiBabId &&
        l.sessionMode === "MASTERED"
    );
    return {
      ...item,
      isCompleted: !!finishedLog,
    };
  });
}

export async function getQuestionsForCompetency(kompetensiBabId: number) {
  return await prisma.bankSoal.findMany({
    where: {
      kompetensiBabId,
      isAccepted: true,
      isRejected: false,
    },
  });
}

export async function getQuizSessionDetail(sessionId: number) {
  return await prisma.quizSession.findUnique({
    where: { id: sessionId },
    include: {
      ujian: true,
      siswa: true,
    },
  });
}

export async function updateQuizSessionHistory(
  sessionId: number,
  competencyLog: any,
  levelCompleted?: boolean
) {
  const existing = await prisma.quizSession.findUnique({
    where: { id: sessionId },
    select: { history: true },
  });

  let logs: any[] = [];
  if (existing?.history) {
    if (typeof existing.history === "object" && Array.isArray((existing.history as any).logs)) {
      logs = [...(existing.history as any).logs];
    } else if (Array.isArray(existing.history)) {
      logs = [...existing.history];
    }
  }

  logs.push(competencyLog);

  const data: any = {
    history: {
      logs,
      updatedAt: new Date().toISOString(),
    },
    lastActiveAt: new Date(),
  };

  if (levelCompleted) {
    data.wrongStreak = 0;
  }

  return await prisma.quizSession.update({
    where: { id: sessionId },
    data,
  });
}

export async function incrementWrongStreak(sessionId: number) {
  return await prisma.quizSession.update({
    where: { id: sessionId },
    data: {
      wrongStreak: { increment: 1 },
    },
  });
}

export async function getUjianIdByJadwal(jadwalId: number) {
  const jadwal = await prisma.jadwalUjian.findUnique({
    where: { id: jadwalId },
    select: { ujianId: true },
  });
  return jadwal?.ujianId || null;
}

export async function getCompetencyById(kompetensiBabId: number) {
  return await prisma.kompetensiBab.findUnique({
    where: { id: kompetensiBabId },
  });
}

export async function updateQuizSessionMode(
  sessionId: number,
  sessionMode: "QUIZ_ACTIVE" | "CHAT_REMEDIATION" | "MASTERED" | "FAILED"
) {
  return await prisma.quizSession.update({
    where: { id: sessionId },
    data: {
      sessionMode,
      lastActiveAt: new Date(),
    },
  });
}

export async function queryQuestionsFromBankDirect(
  kompetensiBabId: number,
  bloomLevel?: string,
  tag?: string
) {
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
      opsiJawaban: true,
      jawabanBenarMcq: true,
      difficulty: true,
      bloomLevel: true,
      tags: true,
      linkGambarSoal: true,
    },
    take: 10,
  });

  // Fallback: If no match with specific filters, query any accepted questions in this competency
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
        opsiJawaban: true,
        jawabanBenarMcq: true,
        difficulty: true,
        bloomLevel: true,
        tags: true,
        linkGambarSoal: true,
      },
      take: 10,
    });
  }

  return questions;
}

export async function getQuestionsByIds(questionIds: number[]) {
  if (!questionIds || questionIds.length === 0) return [];
  return await prisma.bankSoal.findMany({
    where: {
      id: { in: questionIds },
      isAccepted: true,
      isRejected: false,
    },
  });
}


