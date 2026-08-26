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
      currentLevel: 1,
      wrongStreak: 0,
      lastActiveAt: new Date(),
    },
  });
}

export async function claimPlayingSlot(sessionId: number): Promise<boolean> {
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
      await tx.quizSession.update({
        where: { id: sessionId },
        data: {
          status: "PLAYING",
          startedAt: new Date(),
          lastActiveAt: new Date(),
        },
      });
      return true;
    }

    return false;
  });
}

export async function updateQuizActivity(sessionId: number) {
  return await prisma.quizSession.update({
    where: { id: sessionId },
    data: {
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

export async function getCompetenciesForUjian(ujianId: number, sessionId?: number) {
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
    const session = await prisma.quizSession.findUnique({
      where: { id: sessionId },
      select: { history: true },
    });
    if (session?.history && typeof session.history === "object" && Array.isArray((session.history as any).logs)) {
      historyLogs = (session.history as any).logs;
    } else if (Array.isArray(session?.history)) {
      historyLogs = session.history;
    }
  }

  return competencies.map((item) => {
    const finishedLog = historyLogs.find(
      (l: any) =>
        l.competencyId === item.kompetensiBab.id &&
        (l.status === "FINISHED" || l.conceptUnderstood === true)
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
      type: TipeSoal.MCQ,
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
    data.currentLevel = { increment: 1 };
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

