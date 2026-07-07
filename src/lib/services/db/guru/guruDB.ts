"use server";
import { Prisma, StatusUjian, TipeSoal } from "@prisma/client/index-browser";
import prisma from "../prisma";

// --- DASHBOARD ---
export async function getActiveExamsCount(guruId: number) {
  return await prisma.jadwalUjian.count({
    where: {
      ujian: { guruId },
      status: { in: [StatusUjian.SCHEDULED, StatusUjian.ONGOING] },
    },
  });
}

export async function getPendingEssaysCount(guruId: number) {
  return await prisma.jawabanSiswa.count({
    where: {
      soal: { type: TipeSoal.ESSAY },
      nilaiPoin: null, // Asumsi jika poin belum ada, berarti belum dinilai
      attempt: { jadwalUjian: { ujian: { guruId } } },
    },
  });
}

export async function getRecentClassesCount(guruId: number) {
  const uniqueClasses = await prisma.jadwalUjian.findMany({
    where: { ujian: { guruId } },
    select: { kelasId: true },
    distinct: ["kelasId"],
  });
  return uniqueClasses.length;
}

// --- BUKU ---
export async function getBukuList(guruId: number) {
  return await prisma.buku.findMany({
    where: { guruId },
    include: {
      _count: { select: { bab: true } }, // Menghitung jumlah bab otomatis
    },
    orderBy: { id: "desc" },
  });
}

export async function createBuku(guruId: number, judul: string) {
  return await prisma.buku.create({
    data: { judul, guruId },
  });
}

export async function updateBuku(id: number, judul: string) {
  return await prisma.buku.update({
    where: { id },
    data: { judul },
  });
}

export async function deleteBuku(id: number) {
  return await prisma.buku.delete({
    where: { id },
  });
}

// --- BAB ---
export async function getBabList(bukuId: number) {
  return await prisma.buku.findUnique({
    where: { id: bukuId },
    include: {
      bab: {
        include: {
          _count: { select: { soal: true } },
        },
        orderBy: { id: "asc" },
      },
    },
  });
}
export async function getSoalByBab(babId: number) {
  return await prisma.bankSoal.findMany({
    where: { babId: babId },
  });
}
export async function getBabByBuku(bukuId: number) {
  return await prisma.bab.findMany({
    where: { bukuId: bukuId },
  });
}

export async function createBab(bukuId: number, judulBab: string) {
  return await prisma.bab.create({
    data: { judulBab, bukuId },
  });
}

// --- SOAL ---
export async function getSoalList(babId: number) {
  return await prisma.bankSoal.findMany({
    where: { babId },
    include: { bab: true },
    orderBy: { id: "asc" },
  });
}

export async function createSoal(data: {
  babId: number;
  teksSoal: string;
  opsiJawaban?: any;
  jawabanBenarMcq?: string;
  type: TipeSoal;
}) {
  return await prisma.bankSoal.create({
    data,
  });
}

// --- TEMPLATES UJIAN ---
export async function getUjianTemplates(guruId: number) {
  return await prisma.ujian.findMany({
    where: { guruId },
    include: {
      _count: { select: { detailSoal: true } },
    },
  });
}
export async function getUjianTemplateById(templateId: number) {
  return await prisma.ujian.findUnique({
    where: {
      id: templateId,
    },
    include: {
      detailSoal: {
        orderBy: { id: "asc" }, // Keeps question order consistent
      },
    },
  });
}

export async function upsertTemplateQuestionsSafe(
  ujianId: number,
  bankSoalIds: number[],
) {
  return await prisma.$transaction(async (tx) => {
    const ujian = await tx.ujian.findUnique({
      where: { id: ujianId },
      select: { isLocked: true },
    });

    if (!ujian) {
      throw new Error("Template ujian tidak ditemukan.");
    }

    if (ujian.isLocked) {
      throw new Error(
        "Ditolak: Ujian ini sudah aktif/berlangsung. Soal sudah terkunci permanen.",
      );
    }

    const soalAsliList = await tx.bankSoal.findMany({
      where: {
        id: { in: bankSoalIds },
      },
    });

    await tx.detailUjian.deleteMany({
      where: { ujianId: ujianId },
    });

    if (soalAsliList.length > 0) {
      await tx.detailUjian.createMany({
        data: soalAsliList.map((soal) => ({
          ujianId: ujianId,
          soalAsliId: soal.id,
          teksSoal: soal.teksSoal,
          opsiJawaban: soal.opsiJawaban
            ? (soal.opsiJawaban as Prisma.InputJsonValue)
            : Prisma.DbNull,
          jawabanBenarMcq: soal.jawabanBenarMcq,
          type: soal.type,
        })),
      });
    }

    return true;
  });
}
export async function getKelas(sekolah_id: number, guru_id: number) {
  return await prisma.kelas.findMany({
    include: {
      _count: { select: { members: true } },
      teacher: true,
    },
    where: {
      sekolahId: sekolah_id,
      teacherId: guru_id,
    },
    orderBy: { id: "asc" },
  });
}

export async function getTipeUjian() {
  return await prisma.tipeUjian.findMany({
    orderBy: { id: "desc" },
  });
}

// --- JADWAL UJIAN ---
export async function getJadwal(guruId: number) {
  return await prisma.jadwalUjian.findMany({
    where: { ujian: { guruId } },
    include: {
      ujian: true,
      kelas: true,
      tipeUjian: true,
    },
    orderBy: { id: "desc" },
  });
}

export async function createJadwal(data: {
  ujianId: number;
  kelasId: number;
  tipeUjianId: number;
  waktuMulaiAktif: Date;
  waktuSelesaiAktif: Date;
}) {
  return await prisma.jadwalUjian.create({
    data: {
      ...data,
      status: StatusUjian.SCHEDULED,
    },
  });
}

// --- REPORTS & GRADING ---
export async function getReportDetail(jadwalId: number) {
  return await prisma.jadwalUjian.findUnique({
    where: { id: jadwalId },
    include: {
      ujian: true,
      kelas: true,
      tipeUjian: true,
      sesiSiswa: {
        include: { siswa: true },
        orderBy: { nilaiAkhir: "desc" },
      },
    },
  });
}

export async function getAttemptDetail(attemptId: number) {
  return await prisma.sesiUjianSiswa.findUnique({
    where: { id: attemptId },
    include: {
      siswa: true,
      jawabanSiswa: {
        include: { soal: true },
      },
      aiLogs: true,
    },
  });
}

export async function updateAttemptScore(
  attemptId: number,
  nilaiAkhir: number,
) {
  return await prisma.sesiUjianSiswa.update({
    where: { id: attemptId },
    data: { nilaiAkhir },
    include: { siswa: true },
  });
}

export async function gradeJawabanSiswa(
  jawabanId: number,
  nilaiPoin: number,
  catatanKoreksi: string,
) {
  return await prisma.jawabanSiswa.update({
    where: { id: jawabanId },
    data: { nilaiPoin, catatanKoreksi, isCorrect: nilaiPoin > 0 },
  });
}
