"use server";
import { StatusUjian, TipeSoal } from "@prisma/client/index-browser";
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

export async function getQuestionsForExam(jadwalId: number) {
  return await prisma.jadwalUjian.findUnique({
    where: { id: jadwalId },
    include: {
      ujian: {
        include: {
          detailSoal: {
            include: { soal: true },
            orderBy: { soalId: "asc" }, // Default urutan by ID
          },
        },
      },
    },
  });
}

// --- ATTEMPT (SUBMISSION) ---
export async function createSesiUjian(jadwalId: number, siswaId: number) {
  return await prisma.sesiUjianSiswa.create({
    data: {
      jadwalUjianId: jadwalId,
      siswaId: siswaId,
    },
  });
}

export async function submitAnswers(
  attemptId: number,
  answersData: {
    soalId: number;
    jawabanSiswa: string;
    isCorrect?: boolean;
    nilaiPoin?: number;
  }[],
) {
  // Gunakan transaksi untuk menyimpan semua jawaban dan mengakhiri ujian sekaligus
  return await prisma.$transaction([
    prisma.jawabanSiswa.createMany({
      data: answersData.map((a) => ({
        attemptId,
        soalId: a.soalId,
        jawabanSiswa: a.jawabanSiswa,
        isCorrect: a.isCorrect,
        nilaiPoin: a.nilaiPoin,
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
