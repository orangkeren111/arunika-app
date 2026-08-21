"use server";
import { Prisma, StatusUjian, TipeSoal } from "@prisma/client";
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
      soalAsli: { type: TipeSoal.ESSAY },
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
      _count: { select: { bab: true } },
      jobs: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
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
export async function getBabDetail(babId: number) {
  return await prisma.bab.findFirst({
    where: { id: babId },
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

export async function createSoal(data: any) {
  return await prisma.bankSoal.create({
    data,
  });
}
export async function updateSoal(id: number, data: Prisma.BankSoalUpdateInput) {
  return prisma.bankSoal.update({
    where: { id },
    data,
  });
}

// --- TEMPLATES UJIAN ---
export async function getUjianTemplates(guruId: number) {
  const templates = await prisma.ujian.findMany({
    where: { guruId },
    include: {
      ujianBab: {
        include: {
          bab: {
            include: {
              // Ganti 'bankSoal' dengan nama relasi yang sesuai di schema.prisma kamu (misal: 'soal' atau 'questions')
              _count: { select: { soal: true } },
            },
          },
        },
      },
    },
  });

  // Mapping data untuk menambahkan properti totalSoal
  return templates.map((template) => {
    // Menjumlahkan count soal dari setiap bab yang terhubung
    const totalSoal = template.ujianBab.reduce((sum, item) => {
      return sum + (item.bab?._count?.soal || 0);
    }, 0);

    return {
      ...template,
      totalSoal, // Sekarang kamu punya total soal per template ujian di sini
    };
  });
}
export async function getUjianTemplateById(templateId: number) {
  return await prisma.ujian.findUnique({
    where: {
      id: templateId,
    },
    include: {
      templateKompetensi: {
        include: {
          kompetensiBab: true,
        },
      },
      ujianBab: {
        include: {
          bab: {
            include: {
              soal: {
                orderBy: {
                  id: "asc",
                },
              },
            },
          },
        },
        orderBy: {
          babId: "asc",
        },
      },
      criteria: true,
    },
  });
}
export async function createTemplate(
  data: Prisma.UjianCreateInput,
  babIds: number[],
  templateKompetensi: { kompetensiBabId: number; jumlahSoal: number; totalPoint: number; isEnabled: boolean }[]
) {
  // 1. Create main Ujian record
  const newUjian = await prisma.ujian.create({
    data: {
      ...data,
      isAdaptive: data.isAdaptive !== undefined ? data.isAdaptive : true,
      templateKompetensi: {
        create: templateKompetensi.map((tk) => ({
          kompetensiBabId: tk.kompetensiBabId,
          jumlahSoal: tk.jumlahSoal,
          totalPoint: tk.totalPoint,
          isEnabled: tk.isEnabled,
        })),
      },
    },
  });

  // 2. If there are babs to link, insert them into the junction table
  if (babIds.length > 0) {
    await prisma.ujianBab.createMany({
      data: babIds.map((babId) => ({
        ujianId: newUjian.id,
        babId: babId,
      })),
      skipDuplicates: true,
    });
  }

  return await prisma.ujian.findUnique({
    where: { id: newUjian.id },
    include: { templateKompetensi: true },
  });
}

export async function upsertTemplateBabSafe(
  ujianId: number,
  data: Prisma.UjianUpdateInput,
  babIds: number[],
  templateKompetensi: { kompetensiBabId: number; jumlahSoal: number; totalPoint: number; isEnabled: boolean }[]
) {
  return await prisma.$transaction(async (tx) => {
    const ujian = await tx.ujian.update({
      data: {
        ...data,
        templateKompetensi: {
          deleteMany: {}, // clean old ones
          create: templateKompetensi.map((tk) => ({
            kompetensiBabId: tk.kompetensiBabId,
            jumlahSoal: tk.jumlahSoal,
            totalPoint: tk.totalPoint,
            isEnabled: tk.isEnabled,
          })),
        },
      },
      where: {
        id: ujianId,
      },
    });

    if (!ujian) {
      throw new Error("Template ujian tidak ditemukan.");
    }

    if (ujian.isLocked) {
      throw new Error(
        "Ditolak: Ujian ini sudah aktif/berlangsung. Bab sudah terkunci permanen.",
      );
    }

    await tx.ujianBab.deleteMany({
      where: { ujianId },
    });

    if (babIds.length > 0) {
      await tx.ujianBab.createMany({
        data: babIds.map((babId) => ({
          ujianId,
          babId,
        })),
        skipDuplicates: true,
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
      jawabanSiswa: true,
      aiLogs: true,
    },
  });
}

export async function updateAttemptScore(
  attemptId: number,
  nilaiAkhir: number,
) {
  const roundedScore = Math.round(nilaiAkhir * 100) / 100;
  return await prisma.sesiUjianSiswa.update({
    where: { id: attemptId },
    data: { nilaiAkhir: roundedScore },
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

export async function updateBab(id: number, judulBab: string) {
  return await prisma.bab.update({
    where: { id },
    data: { judulBab },
  });
}

export async function deleteBab(id: number) {
  return await prisma.bab.delete({
    where: { id },
  });
}

export async function deleteSoal(id: number) {
  return await prisma.bankSoal.delete({
    where: { id },
  });
}

export async function getBukuPdf(bukuId: number) {
  return await prisma.generationJob.findFirst({
    where: { bukuId, status: "DONE" },
    orderBy: { createdAt: "desc" },
  });
}

export async function getKelasDetail(kelasId: number) {
  return await prisma.kelas.findUnique({
    where: { id: kelasId },
    include: {
      teacher: true,
      members: {
        include: {
          user: true,
        },
      },
      _count: {
        select: { members: true },
      },
    },
  });
}

export async function getExamsByKelas(kelasId: number) {
  return await prisma.jadwalUjian.findMany({
    where: { kelasId },
    include: {
      ujian: true,
      tipeUjian: true,
    },
    orderBy: { id: "desc" },
  });
}

export async function updateJadwalStatus(jadwalId: number, status: StatusUjian) {
  return await prisma.jadwalUjian.update({
    where: { id: jadwalId },
    data: { status },
  });
}

export async function getStudentHistoryInClass(siswaId: number, kelasId: number) {
  return await prisma.sesiUjianSiswa.findMany({
    where: {
      siswaId,
      jadwalUjian: {
        kelasId,
      },
    },
    include: {
      jadwalUjian: {
        include: {
          ujian: true,
        },
      },
    },
    orderBy: { waktuMulai: "desc" },
  });
}

export async function getClassGradesReport(kelasId: number) {
  return await prisma.jadwalUjian.findMany({
    where: { kelasId },
    include: {
      ujian: true,
      sesiSiswa: {
        include: {
          siswa: true,
        },
      },
    },
    orderBy: { id: "asc" },
  });
}

export async function getKompetensiBab(babId: number) {
  return await prisma.kompetensiBab.findMany({
    where: { babId },
    orderBy: { nomerKompetensi: "asc" },
  });
}

export async function upsertKompetensiBab(payload: {
  id?: number;
  babId: number;
  nomerKompetensi: string;
  isiKompetensi: string;
  kompetensiPelajaranId?: number;
}) {
  if (payload.id) {
    return await prisma.kompetensiBab.update({
      where: { id: payload.id },
      data: {
        nomerKompetensi: payload.nomerKompetensi,
        isiKompetensi: payload.isiKompetensi,
        kompetensiPelajaranId: payload.kompetensiPelajaranId || null,
      },
    });
  } else {
    return await prisma.kompetensiBab.create({
      data: {
        babId: payload.babId,
        nomerKompetensi: payload.nomerKompetensi,
        isiKompetensi: payload.isiKompetensi,
        kompetensiPelajaranId: payload.kompetensiPelajaranId || null,
      },
    });
  }
}

export async function deleteKompetensiBab(id: number) {
  return await prisma.kompetensiBab.delete({
    where: { id },
  });
}

export async function getAvailablePelajaranBooks() {
  const result = await prisma.kompetensiPelajaran.groupBy({
    by: ["namaBuku"],
    orderBy: { namaBuku: "asc" },
  });
  return result.map((r) => r.namaBuku);
}

export async function getAvailablePelajaranChapters(bookName: string) {
  const result = await prisma.kompetensiPelajaran.groupBy({
    by: ["namaBab"],
    where: { namaBuku: bookName },
    orderBy: { namaBab: "asc" },
  });
  return result.map((r) => r.namaBab);
}

export async function getKompetensiPelajaran(bookName: string, chapterName: string) {
  return await prisma.kompetensiPelajaran.findMany({
    where: {
      namaBuku: bookName,
      namaBab: chapterName,
    },
    orderBy: { nomerKompetensi: "asc" },
  });
}

export async function linkKompetensiPelajaranToBab(
  babId: number,
  competencyPelajaranIds: number[]
) {
  const sourceCompetencies = await prisma.kompetensiPelajaran.findMany({
    where: { id: { in: competencyPelajaranIds } },
  });

  for (const comp of sourceCompetencies) {
    await prisma.kompetensiBab.create({
      data: {
        babId,
        nomerKompetensi: comp.nomerKompetensi,
        isiKompetensi: comp.isiKompetensi,
        kompetensiPelajaranId: comp.id,
      },
    });
  }
}

export async function getKompetensiForBabs(babIds: number[]) {
  return await prisma.kompetensiBab.findMany({
    where: { babId: { in: babIds } },
    orderBy: { nomerKompetensi: "asc" },
  });
}

export async function getAvailableSoalCounts(babIds: number[]) {
  const result = await prisma.bankSoal.groupBy({
    by: ["kompetensiBabId"],
    where: { 
      babId: { in: babIds },
      isAccepted: true,
      isRejected: false,
    },
    _count: { id: true },
  });
  
  return result.map((r) => ({
    kompetensiBabId: r.kompetensiBabId,
    count: r._count.id,
  }));
}

