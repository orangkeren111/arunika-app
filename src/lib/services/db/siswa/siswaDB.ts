"use server";
import { StatusUjian, TipeSoal } from "@prisma/client";
import prisma from "../prisma";

export async function getJadwalAktif(siswaId: number) {
  return await prisma.jadwalUjian.findMany({
    where: {
      kelas: { members: { some: { userId: siswaId } } },
      status: { in: [StatusUjian.SCHEDULED, StatusUjian.ONGOING] },
    },
    include: {
      ujian: true,
      kelas: true,
      tipeUjian: true,
    },
    orderBy: { waktuMulaiAktif: "asc" },
  });
}

export async function getRiwayatUjian(siswaId: number) {
  return await prisma.sesiUjianSiswa.findMany({
    where: { siswaId },
    include: {
      jadwalUjian: {
        include: { ujian: true },
      },
      aiLogs: true,
    },
    orderBy: { waktuMulai: "desc" },
  });
}

// --- KELAS ---
export async function getKelasList(siswaId: number) {
  return await prisma.kelas.findMany({
    where: { members: { some: { userId: siswaId } } },
    include: {
      _count: { select: { members: { where: { user: { role: "SISWA" } } } } },
      members: {
        where: { user: { role: "GURU" } },
        include: { user: true },
      },
    },
  });
}

export async function getKelasDetail(kelasId: number) {
  return await prisma.kelas.findUnique({
    where: { id: kelasId },
    include: {
      _count: { select: { members: { where: { user: { role: "SISWA" } } } } },
      members: {
        where: { user: { role: "GURU" } },
        include: { user: true },
      },
    },
  });
}

export async function getJadwalByKelas(kelasId: number) {
  return await prisma.jadwalUjian.findMany({
    where: {
      kelasId,
      status: { in: [StatusUjian.SCHEDULED, StatusUjian.ONGOING] },
    },
    include: { ujian: true, tipeUjian: true },
  });
}

// --- UJIAN (LOBBY & QUESTIONS) ---
export async function getJadwalDetail(jadwalId: number) {
  return await prisma.jadwalUjian.findUnique({
    where: { id: jadwalId },
    include: { ujian: true, kelas: true, tipeUjian: true },
  });
}

// --- ATTEMPT (SUBMISSION) ---
export async function submitAnswers(
  attemptId: number,
  answersData: {
    soalId: number;
    soalAsliId: number;
    nomor: number;
    teksSoal: string;
    opsiJawaban: string[];
    jawabanBenarMcq: string;
    difficulty: number;
    bloomLevel?: string;
    jawabanSiswa: string;
    isCorrect?: boolean;
    nilaiPoin?: number;
    type: TipeSoal;
  }[],
) {
  // Gunakan transaksi untuk menyimpan semua jawaban dan mengakhiri ujian sekaligus
  return await prisma.$transaction([
    prisma.jawabanSiswa.createMany({
      data: answersData.map((a) => ({
        nomor: a.nomor,
        attemptId: attemptId,

        soalAsliId: a.soalAsliId,

        teksSoal: a.teksSoal,
        opsiJawaban: a.opsiJawaban,
        jawabanBenarMcq: a.jawabanBenarMcq,
        type: a.type,

        difficulty: a.difficulty,
        bloomLevel: a.bloomLevel,

        jawabanSiswa: a.jawabanSiswa,
      })),
    }),
    prisma.sesiUjianSiswa.update({
      where: { id: attemptId },
      data: { waktuSelesai: new Date() },
    }),
  ]);
}

export async function getAttemptDetail(attemptId: number) {
  return await prisma.sesiUjianSiswa.findUnique({
    where: { id: attemptId },
    include: {
      jadwalUjian: { include: { ujian: true } },
      jawabanSiswa: true,
      aiLogs: true,
    },
  });
}

// 1. Core Exam Data
export async function getQuestionsForExam(jadwalId: number) {
  return prisma.jadwalUjian.findUnique({
    where: { id: jadwalId },
    include: {
      ujian: {
        include: {
          ujianBab: {
            include: {
              bab: {
                include: {
                  soal: true, // Fetching all questions available for this exam
                },
              },
            },
          },
        },
      },
    },
  });
}

// 2. Session Management
export async function getActiveSession(jadwalId: number, siswaId: number) {
  return prisma.sesiUjianSiswa.findFirst({
    where: {
      jadwalUjianId: jadwalId,
      siswaId: siswaId,
      waktuSelesai: null, // Only get sessions that aren't finished
    },
    include: {
      jawabanSiswa: true,
    },
  });
}

export async function createSesiUjian(jadwalId: number, siswaId: number) {
  return prisma.sesiUjianSiswa.create({
    data: {
      jadwalUjianId: jadwalId,
      siswaId: siswaId,
      currentElo: 1000, // Starting ELO
    },
    include: {
      jawabanSiswa: true,
    },
  });
}

export async function updateSessionElo(sesiId: number, newElo: number) {
  return prisma.sesiUjianSiswa.update({
    where: { id: sesiId },
    data: { currentElo: newElo },
  });
}
export async function finishSession(sesiId: number, finalScore: number) {
  return prisma.sesiUjianSiswa.update({
    where: { id: sesiId },
    data: {
      waktuSelesai: new Date(),
      nilaiAkhir: finalScore,
    },
  });
}

// 3. Answer Snapshotting
export async function saveSingleAnswer(data: any) {
  return prisma.jawabanSiswa.create({
    data: data,
  });
}
export async function getListJawaban(attemptId: number) {
  const answers = await prisma.jawabanSiswa.findMany({
    where: {
      attemptId: attemptId,
    },
    include: {
      // Pull in the attempt to access the nested User (Siswa) data
      attempt: {
        include: {
          siswa: true,
          jadwalUjian: true,
        },
      },
    },
    orderBy: {
      nomor: "asc", // Order by question number as defined in the schema
    },
  });

  return answers;
}

/**
 * Retrieves the stored AI feedback for a specific exam attempt.
 */
export async function getGeneratedAIFeedback(attemptId: number) {
  // Querying the SavedResponses table based on the attemptId
  const feedback = await prisma.savedResponses.findFirst({
    where: {
      attemptId: attemptId,
    },
    orderBy: {
      createdAt: "desc", // Get the latest feedback if there are multiple
    },
  });

  if (!feedback) {
    return {
      overviewText:
        "Feedback is currently being generated. Please check back later.",
    };
  }

  return {
    // For now, mapping aiStatementSummary to overviewText.
    // If you expand SavedResponses to have specific Weakness/Recommendation fields, map them here.
    overviewText: feedback.overview,
  };
}
