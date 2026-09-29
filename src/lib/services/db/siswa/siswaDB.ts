"use server";
import { StatusUjian, TipeSoal } from "@prisma/client";
import prisma from "../prisma";

export async function getJadwalAktif(siswaId: number) {
  return await prisma.jadwalUjian.findMany({
    where: {
      kelas: {
        members: {
          some: {
            userId: siswaId,
          },
        },
      },
      status: {
        in: [StatusUjian.SCHEDULED, StatusUjian.ONGOING],
      },
      waktuMulaiAktif: {
        lte: new Date(),
      },
      waktuSelesaiAktif: {
        gte: new Date(),
      },
    },
    include: {
      ujian: true,
      kelas: true,
      tipeUjian: true,
    },
    orderBy: {
      waktuMulaiAktif: "asc",
    },
  });
}

export async function getRiwayatUjian(
  siswaId: number,
  options?: {
    search?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
    limit?: number;
  },
) {
  const search = options?.search?.trim();

  const where = {
    siswaId,

    ...(search && {
      jadwalUjian: {
        ujian: {
          judulUjian: {
            contains: search,
            mode: "insensitive" as const,
          },
        },
      },
    }),

    ...(options?.startDate || options?.endDate
      ? {
        waktuSelesai: {
          ...(options.startDate && {
            gte: new Date(`${options.startDate}T00:00:00`),
          }),

          ...(options.endDate && {
            lte: new Date(`${options.endDate}T23:59:59.999`),
          }),
        },
      }
      : {}),
  };

  const query = {
    where,

    include: {
      jadwalUjian: {
        include: {
          ujian: true,
        },
      },
      aiLogs: true,
    },

    orderBy: {
      waktuMulai: "desc" as const,
    },
  };

  if (options?.limit) {
    const data = await prisma.sesiUjianSiswa.findMany({
      ...query,
      take: options.limit,
    });

    return {
      data,
      total: data.length,
      totalPages: 1,
    };
  }

  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 10;
  const skip = (page - 1) * pageSize;

  const [data, total] = await Promise.all([
    prisma.sesiUjianSiswa.findMany({
      ...query,
      skip,
      take: pageSize,
    }),

    prisma.sesiUjianSiswa.count({
      where,
    }),
  ]);

  return {
    data,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

// --- KELAS ---
export async function getKelasList(siswaId: number) {
  return await prisma.kelas.findMany({
    where: { members: { some: { userId: siswaId } }, isRetired: false },
    include: {
      _count: { select: { members: { where: { user: { role: "SISWA" } } } } },
      teacher: true,
    },
  });
}

export async function isStudentInKelas(kelasId: number, siswaId: number) {
  if (!siswaId || !kelasId) return false;
  const member = await prisma.kelasMember.findUnique({
    where: {
      kelasId_userId: {
        kelasId,
        userId: siswaId,
      },
    },
  });
  return !!member;
}

export async function isStudentAuthorizedForJadwal(jadwalId: number, siswaId: number) {
  if (!siswaId || !jadwalId) return false;
  const jadwal = await prisma.jadwalUjian.findUnique({
    where: { id: jadwalId },
    select: { kelasId: true },
  });
  if (!jadwal) return false;
  return await isStudentInKelas(jadwal.kelasId, siswaId);
}

export async function getKelasDetail(kelasId: number) {
  return await prisma.kelas.findUnique({
    where: { id: kelasId },
    include: {
      _count: { select: { members: { where: { user: { role: "SISWA" } } } } },
      teacher: true
    },
  });
}

export async function getJadwalByKelas(kelasId: number, siswaId?: number) {
  return await prisma.jadwalUjian.findMany({
    where: {
      kelasId,
      status: { in: [StatusUjian.SCHEDULED, StatusUjian.ONGOING] },
    },
    include: {
      ujian: {
        include: {
          quizSessions: siswaId
            ? { where: { siswaId }, orderBy: { createdAt: "desc" }, take: 1 }
            : false,
        },
      },
      tipeUjian: true,
      sesiSiswa: siswaId
        ? { where: { siswaId }, orderBy: { waktuMulai: "desc" }, take: 1 }
        : false,
    },
  });
}

// --- UJIAN (LOBBY & QUESTIONS) ---
export async function getJadwalDetail(jadwalId: number) {
  return await prisma.jadwalUjian.findUnique({
    where: { id: jadwalId },
    include: { ujian: true, kelas: true, tipeUjian: true },
  });
}


// UJIAN ATTEMPT
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
          criteria: true,
          ujianBab: {
            include: {
              bab: {
                include: {
                  soal: true,
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
  const roundedScore = Math.round(finalScore * 100) / 100;
  return prisma.sesiUjianSiswa.update({
    where: { id: sesiId },
    data: {
      waktuSelesai: new Date(),
      nilaiAkhir: roundedScore,
    },
  });
}

// 3. Answer Snapshotting
export async function saveSingleAnswer(data: any) {
  return prisma.jawabanSiswa.create({
    data: data,
  });
}

export async function logCheatingAttempt(
  sesiId: number,
  siswaId: number,
  violationType: string, // e.g., "TAB_SWITCH", "LOST_FOCUS", "COPY_ATTEMPT"
  nomorSoal: number
) {
  // 1. Fetch current logs to safely append
  const session = await prisma.sesiUjianSiswa.findUnique({
    where: { id: sesiId, siswaId: siswaId },
    select: { cheatLogs: true, cheatCount: true }
  });

  if (!session) throw new Error("Session not found");

  // 2. Safely parse existing logs (defaults to empty array if null)
  const currentLogs = Array.isArray(session.cheatLogs) ? session.cheatLogs : [];

  const newEvent = {
    timestamp: new Date().toISOString(),
    type: violationType,
    nomorSoal: nomorSoal
  };

  // 3. Update database: atomic increment and overwrite JSON with the appended array
  const updatedSession = await prisma.sesiUjianSiswa.update({
    where: { id: sesiId, siswaId: siswaId },
    data: {
      cheatCount: { increment: 1 },
      cheatLogs: [...currentLogs, newEvent]
    }
  });

  return {
    success: true,
    totalCheats: updatedSession.cheatCount
  };
}
export async function getListJawaban(attemptId: number) {
  const answers = await prisma.jawabanSiswa.findMany({
    where: {
      attemptId: attemptId,
    },
    include: {
      soalAsli: true,
      attempt: {
        include: {
          siswa: {
            include: {
              sekolah: true,
            },
          },
          jadwalUjian: {
            include: {
              kelas: {
                include: {
                  teacher: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      nomor: "asc",
    },
  });

  return answers;
}

/**
 * Retrieves the stored AI feedback for a specific exam attempt.
 */
export async function getGeneratedAIFeedback(attemptId: number) {
  const feedback = await prisma.savedResponses.findFirst({
    where: {
      attemptId: attemptId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!feedback) {
    return {
      status: "PENDING",
      overviewText: "Laporan hasil belajar sedang diproses oleh AI. Mohon tunggu...",
      weaknessText: "",
      recommendationText: "",
    };
  }

  return {
    status: feedback.status,
    overviewText: feedback.overview || "",
    weaknessText: feedback.weakness || "",
    recommendationText: feedback.recommendation || "",
  };
}

export async function checkStudentFinishedExam(jadwalId: number, siswaId: number) {
  const session = await prisma.sesiUjianSiswa.findFirst({
    where: {
      jadwalUjianId: jadwalId,
      siswaId: siswaId,
      waktuSelesai: { not: null },
    },
  });
  return !!session;
}

export async function getAttemptDetailForReport(attemptId: number) {
  return await prisma.sesiUjianSiswa.findUnique({
    where: { id: attemptId },
    include: {
      jadwalUjian: {
        include: {
          ujian: {
            include: {
              templateKompetensi: {
                where: { isEnabled: true },
                include: { kompetensiBab: true },
              },
            },
          },
        },
      },
    },
  });
}

export async function joinKelasByCode(siswaId: number, classCode: string): Promise<{ success: boolean; error?: string; className?: string }> {
  const kelas = await prisma.kelas.findFirst({
    where: {
      classCode: {
        equals: classCode.trim(),
        mode: "insensitive"
      }
    }
  });

  if (!kelas) {
    return { success: false, error: "Kelas tidak ditemukan. Periksa kembali kode kelas Anda." };
  }

  const existing = await prisma.kelasMember.findUnique({
    where: {
      kelasId_userId: {
        kelasId: kelas.id,
        userId: siswaId
      }
    }
  });

  if (existing) {
    return { success: false, error: "Anda sudah terdaftar di dalam kelas ini." };
  }

  await prisma.kelasMember.create({
    data: {
      kelasId: kelas.id,
      userId: siswaId
    }
  });

  return { success: true, className: kelas.namaKelas };
}
