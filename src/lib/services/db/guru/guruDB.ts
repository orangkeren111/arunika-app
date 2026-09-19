"use server";
import { Prisma, StatusUjian, TipeSoal } from "@prisma/client";
import prisma from "../prisma";
import fs from "fs/promises";
import path from "path";

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

export async function getBukuOptions(guruId: number) {
  return await prisma.buku.findMany({
    where: {
      guruId,
    },
    select: {
      id: true,
      judul: true,
    },
    orderBy: {
      id: "desc",
    },
  });
}

// --- BUKU ---
export async function getBukuList(
  guruId: number,
  page: number = 1,
  limit: number = 10,
  search: string = "",
  activeFilter: string = "ALL",
) {
  const skip = (page - 1) * limit;

  const where: Prisma.BukuWhereInput = {
    guruId,

    // SEARCH
    ...(search
      ? {
        judul: {
          contains: search,
          mode: "insensitive" as const,
        },
      }
      : {}),

    // FILTER
    ...(activeFilter === "NEED_VALIDATION"
      ? {
        jobs: {
          some: {
            status: {
              in: [
                "WAITING_EXTRACTION_VALIDATION",
                "WAITING_CAPTION_VALIDATION",
              ],
            },
          },
        },
      }
      : {}),

    ...(activeFilter === "PROCESSING"
      ? {
        jobs: {
          some: {
            status: {
              in: [
                "PENDING",
                "PROCESSING_PDF",
                "EXTRACTING_IMAGES",
                "CAPTIONING_IMAGES",
                "GENERATING_QUESTIONS",
              ],
            },
          },
        },
      }
      : {}),

    ...(activeFilter === "DONE"
      ? {
        OR: [
          {
            jobs: {
              some: {
                status: "DONE",
              },
            },
          },
          {
            jobs: {
              none: {},
            },
          },
        ],
      }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.buku.findMany({
      where,
      include: {
        _count: {
          select: { bab: true },
        },
        jobs: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { id: "desc" },
      skip,
      take: limit,
    }),

    prisma.buku.count({ where }),
  ]);

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
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

export async function getBukuWithBabsAndSoal(bukuId: number) {
  return await prisma.buku.findUnique({
    where: { id: bukuId },
    include: {
      bab: {
        orderBy: { id: "asc" },
        include: {
          soal: {
            orderBy: { id: "asc" },
            include: {
              kompetensiBab: true,
            },
          },
        },
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
export async function getSoalList(
  babId: number,
  bloomLevel?: string,
  type?: TipeSoal,
  tag?: string,
) {
  return await prisma.bankSoal.findMany({
    where: {
      babId,
      ...(bloomLevel ? { bloomLevel: bloomLevel } : {}),
      ...(type ? { type: type } : {}),
      ...(tag && tag.trim() !== "" ? { tags: { has: tag } } : {}),
    },
    include: {
      bab: true,
    },
    orderBy: {
      id: "asc",
    },
  });
}

export async function createSoal(data: any) {
  if (data.babId) {
    const lockStatus = await getExamLockStatusForBab(Number(data.babId));
    if (lockStatus.isLocked) {
      throw new Error(`Soal tidak dapat dibuat: ${lockStatus.message}`);
    }
  }
  return await prisma.bankSoal.create({
    data,
  });
}

export async function updateSoal(id: number, data: Prisma.BankSoalUpdateInput) {
  const soal = await prisma.bankSoal.findUnique({
    where: { id },
    select: { babId: true },
  });
  if (soal) {
    const lockStatus = await getExamLockStatusForBab(soal.babId);
    if (lockStatus.isLocked) {
      throw new Error(`Soal tidak dapat diubah: ${lockStatus.message}`);
    }
  }
  return prisma.bankSoal.update({
    where: { id },
    data,
  });
}

// --- TEMPLATES UJIAN ---
export async function getUjianTemplates(guruId: number) {
  const guru = await prisma.user.findUnique({
    where: { id: guruId },
    select: {
      sekolahId: true,
      name: true,
    },
  });

  if (!guru) {
    throw new Error("Guru tidak ditemukan");
  }

  const templates = await prisma.ujian.findMany({
    where: {
      guru: {
        sekolahId: guru.sekolahId,
      },
    },
    include: {
      guru: {
        select: {
          name: true,
        },
      },
      ujianBab: {
        include: {
          bab: {
            include: {
              _count: {
                select: {
                  soal: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return templates.map((template) => {
    const totalSoal = template.ujianBab.reduce((sum, item) => {
      return sum + (item.bab?._count?.soal || 0);
    }, 0);

    return {
      ...template,
      totalSoal,
      guruName: template.guru.name,
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
export async function getKelas(
  sekolah_id: number,
  guru_id: number,
  search?: string,
  orderBy: "name_asc" | "name_desc" | "students_desc" | "students_asc" = "name_asc",
  status: "all" | "active" | "retired" = "active"
) {
  return await prisma.kelas.findMany({
    include: {
      _count: { select: { members: true } },
      teacher: true,
    },
    where: {
      sekolahId: sekolah_id,
      teacherId: guru_id,

      ...(status === "active" ? { isRetired: false } : {}),
      ...(status === "retired" ? { isRetired: true } : {}),

      ...(search?.trim()
        ? {
          namaKelas: {
            contains: search.trim(),
            mode: "insensitive",
          },
        }
        : {}),
    },
    orderBy:
      orderBy === "name_asc"
        ? { namaKelas: "asc" }
        : orderBy === "name_desc"
          ? { namaKelas: "desc" }
          : orderBy === "students_desc"
            ? { members: { _count: "desc" } }
            : { members: { _count: "asc" } },
  });
}

export async function getTipeUjian() {
  let list = await prisma.tipeUjian.findMany({
    orderBy: { id: "asc" },
  });

  if (list.length === 0) {
    const defaultTypes = ["Kuis Harian", "Ulangan Harian", "UTS", "UAS", "Tryout", "Tugas / PR"];
    for (const nama of defaultTypes) {
      await prisma.tipeUjian.create({ data: { namaTipeUjian: nama } });
    }
    list = await prisma.tipeUjian.findMany({ orderBy: { id: "asc" } });
  }

  return list;
}

// --- JADWAL UJIAN ---
export async function getJadwal(
  guruId: number,
  filters?: { startDate?: string; endDate?: string; kelasId?: string }
) {
  return await prisma.jadwalUjian.findMany({
    where: {
      ujian: { guruId },
      ...(filters?.kelasId ? { kelasId: parseInt(filters.kelasId) } : {}),
      ...(filters?.startDate || filters?.endDate
        ? {
          waktuMulaiAktif: {
            ...(filters.startDate && { gte: new Date(`${filters.startDate}T00:00:00`) }),
            ...(filters.endDate && { lte: new Date(`${filters.endDate}T23:59:59.999`) }),
          },
        }
        : {}),
    },
    include: {
      ujian: true,
      kelas: true,
      tipeUjian: true,
      sesiSiswa: {
        select: {
          id: true,
          isChecked: true,
          aiLogs: {
            select: {
              status: true,
            },
          },
        },
      },
    },
    orderBy: {
      id: "desc",
    },
  });
}

export async function createJadwal(data: {
  ujianId: number;
  kelasId: number;
  tipeUjianId: number;
  waktuMulaiAktif: Date;
  waktuSelesaiAktif: Date;
  judulJadwal?: string;
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
        include: { siswa: true, aiLogs: true },
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
      jadwalUjian: {
        include: {
          ujian: {
            include: {
              templateKompetensi: {
                where: { isEnabled: true },
              },
            },
          },
        },
      },
      jawabanSiswa: {
        include: {
          soalAsli: {
            include: {
              kompetensiBab: true,
            },
          },
        },
      },
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
  isCorrect?: boolean,
) {
  return await prisma.jawabanSiswa.update({
    where: { id: jawabanId },
    data: {
      nilaiPoin,
      catatanKoreksi,
      isCorrect: isCorrect !== undefined ? isCorrect : nilaiPoin > 0,
    },
  });
}

export async function finishAttemptReview(attemptId: number) {
  return await prisma.sesiUjianSiswa.update({
    where: { id: attemptId },
    data: { isChecked: true },
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

export async function validateQuestionPoolRequirements(ujianId: number) {
  const ujian = await prisma.ujian.findUnique({
    where: { id: ujianId },
    include: {
      criteria: true,
      templateKompetensi: {
        where: { isEnabled: true },
        include: { kompetensiBab: true },
      },
      ujianBab: {
        include: {
          bab: true,
        },
      },
    },
  });

  if (!ujian) {
    return { isValid: false, errors: ["Ujian tidak ditemukan."], availableCount: 0, requiredCount: 0 };
  }

  const babIds = ujian.ujianBab.map((ub) => ub.babId);
  const questions = await prisma.bankSoal.findMany({
    where: {
      babId: { in: babIds },
      isAccepted: true,
      isRejected: false,
    },
  });

  const errors: string[] = [];
  const requiredTotal = ujian.jumlahSoal || 0;
  const availableTotal = questions.length;

  if (availableTotal < requiredTotal) {
    errors.push(
      `Jumlah total soal yang tersedia (${availableTotal}) kurang dari kebutuhan ujian (${requiredTotal}).`
    );
  }

  // Validate Bloom taxonomy criteria if specified
  if (ujian.criteria) {
    const c1Count = questions.filter((q) => q.bloomLevel === "C1").length;
    const c2Count = questions.filter((q) => q.bloomLevel === "C2").length;
    const c3Count = questions.filter((q) => q.bloomLevel === "C3").length;
    const c4Count = questions.filter((q) => (q.bloomLevel === "C4" || q.bloomLevel === "C5" || q.bloomLevel === "C6")).length;

    if (c1Count < (ujian.criteria.reqC1 || 0)) {
      errors.push(`Kebutuhan C1 (${ujian.criteria.reqC1}) tidak terpenuhi, tersedia: ${c1Count}.`);
    }
    if (c2Count < (ujian.criteria.reqC2 || 0)) {
      errors.push(`Kebutuhan C2 (${ujian.criteria.reqC2}) tidak terpenuhi, tersedia: ${c2Count}.`);
    }
    if (c3Count < (ujian.criteria.reqC3 || 0)) {
      errors.push(`Kebutuhan C3 (${ujian.criteria.reqC3}) tidak terpenuhi, tersedia: ${c3Count}.`);
    }
    if (c4Count < (ujian.criteria.reqC4 || 0)) {
      errors.push(`Kebutuhan C4+ (${ujian.criteria.reqC4}) tidak terpenuhi, tersedia: ${c4Count}.`);
    }
  }

  // Validate per-competency requirements if templateKompetensi configured
  for (const tk of ujian.templateKompetensi) {
    const reqCompCount = tk.jumlahSoal || 0;
    if (reqCompCount > 0) {
      const compQuestions = questions.filter(
        (q) => q.kompetensiBabId === tk.kompetensiBabId
      );
      if (compQuestions.length < reqCompCount) {
        errors.push(
          `Kompetensi "${tk.kompetensiBab.nomerKompetensi}" butuh ${reqCompCount} soal, hanya tersedia ${compQuestions.length}.`
        );
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    availableCount: availableTotal,
    requiredCount: requiredTotal,
  };
}

export async function getExamLockStatusForBab(babId: number) {
  const now = new Date();
  const activeJadwal = await prisma.jadwalUjian.findFirst({
    where: {
      ujian: {
        ujianBab: {
          some: { babId },
        },
      },
      OR: [
        { status: { in: [StatusUjian.ONGOING, StatusUjian.SCHEDULED] } },
        { waktuMulaiAktif: { lte: now } },
      ],
    },
    include: { ujian: true },
  });

  if (activeJadwal) {
    return {
      isLocked: true,
      activeExamTitle: activeJadwal.judulJadwal || activeJadwal.ujian.judulUjian,
      message: `Bab ini dikunci karena terhubung dengan Ujian aktif/terjadwal: "${activeJadwal.judulJadwal || activeJadwal.ujian.judulUjian}".`,
    };
  }

  return { isLocked: false };
}

export async function getExamLockStatusForUjian(ujianId: number) {
  const now = new Date();
  const activeJadwal = await prisma.jadwalUjian.findFirst({
    where: {
      ujianId,
      OR: [
        { status: { in: [StatusUjian.ONGOING, StatusUjian.SCHEDULED] } },
        { waktuMulaiAktif: { lte: now } },
      ],
    },
  });

  if (activeJadwal) {
    return {
      isLocked: true,
      activeJadwalTitle: activeJadwal.judulJadwal || "Ujian Aktif",
      message: `Konfigurasi Ujian dikunci karena sudah memasuki jadwal pelaksanaan (${activeJadwal.judulJadwal || "Ujian Aktif"}).`,
    };
  }

  return { isLocked: false };
}

export async function deleteSoal(id: number) {
  const soal = await prisma.bankSoal.findUnique({
    where: { id },
    select: { id: true, babId: true },
  });

  if (soal) {
    const lockStatus = await getExamLockStatusForBab(soal.babId);
    if (lockStatus.isLocked) {
      throw new Error(
        `Soal tidak dapat dihapus: ${lockStatus.message}`
      );
    }
  }

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

// --- VALIDATION STAGES ---

export async function getBooksNeedingValidation(guruId: number) {
  return await prisma.buku.findMany({
    where: {
      guruId,
      jobs: {
        some: {
          status: {
            in: ["WAITING_EXTRACTION_VALIDATION", "WAITING_CAPTION_VALIDATION"],
          },
        },
      },
    },
    include: {
      jobs: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      _count: { select: { bab: true, images: true } },
    },
    orderBy: { id: "desc" },
  });
}
export async function getTodayExams(guruId: number) {
  const now = new Date();

  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  return await prisma.jadwalUjian.findMany({
    where: {
      ujian: { guruId },
      OR: [
        {
          waktuMulaiAktif: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        {
          waktuSelesaiAktif: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        {
          AND: [
            { waktuMulaiAktif: { lte: startOfDay } },
            { waktuSelesaiAktif: { gte: endOfDay } },
          ],
        },
      ],
    },
    include: {
      ujian: true,
      kelas: {
        include: {
          _count: {
            select: {
              members: true,
            },
          },
        },
      },
    },
    orderBy: {
      id: "asc",
    },
  });
}

export async function getRecentlyModifiedClasses(guruId: number) {
  return await prisma.kelas.findMany({
    where: {
      jadwalUjian: {
        some: {
          ujian: {
            guruId,
          },
        },
      },
      teacherId: guruId
    },
    include: {
      _count: {
        select: {
          members: true,
        },
      },
    },
    take: 5
  });
}


export async function getExtractionValidationData(bukuId: number) {
  const buku = await prisma.buku.findUnique({
    where: { id: bukuId },
    include: {
      jobs: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      bab: {
        orderBy: { id: "asc" },
        include: {
          kompetensi: {
            orderBy: { nomerKompetensi: "asc" },
          },
        },
      },
      images: {
        orderBy: [{ pageNumber: "asc" }, { id: "asc" }],
      },
    },
  });

  return buku;
}

export async function confirmExtractionValidation(
  bukuId: number,
  imageKeepMap: Record<number, boolean>,
  babsKompetensi: Array<{
    babId: number;
    kompetensiList: Array<{ id?: number; nomerKompetensi: string; isiKompetensi: string }>;
  }>
) {
  return await prisma.$transaction(async (tx) => {
    // 1. Update images keep status
    for (const [imageIdStr, isKept] of Object.entries(imageKeepMap)) {
      const imageId = parseInt(imageIdStr);
      await tx.bukuImage.update({
        where: { id: imageId },
        data: { isKept },
      });
    }

    // 2. Update/create/delete competencies for each bab
    for (const item of babsKompetensi) {
      const existingKompetensi = await tx.kompetensiBab.findMany({
        where: { babId: item.babId },
      });

      const submittedIds = item.kompetensiList.filter((k) => k.id).map((k) => k.id!);
      const toDelete = existingKompetensi.filter((k) => !submittedIds.includes(k.id));

      if (toDelete.length > 0) {
        await tx.kompetensiBab.deleteMany({
          where: { id: { in: toDelete.map((k) => k.id) } },
        });
      }

      for (const k of item.kompetensiList) {
        if (k.id) {
          await tx.kompetensiBab.update({
            where: { id: k.id },
            data: {
              nomerKompetensi: k.nomerKompetensi,
              isiKompetensi: k.isiKompetensi,
            },
          });
        } else {
          await tx.kompetensiBab.create({
            data: {
              babId: item.babId,
              nomerKompetensi: k.nomerKompetensi,
              isiKompetensi: k.isiKompetensi,
            },
          });
        }
      }
    }

    // 3. Advance GenerationJob status to CAPTIONING_IMAGES
    const job = await tx.generationJob.findFirst({
      where: { bukuId, status: "WAITING_EXTRACTION_VALIDATION" },
      orderBy: { createdAt: "desc" },
    });

    if (job) {
      await tx.generationJob.update({
        where: { id: job.id },
        data: { status: "CAPTIONING_IMAGES", updatedAt: new Date() },
      });
    }

    return true;
  });
}

export async function getCaptionValidationData(bukuId: number) {
  const buku = await prisma.buku.findUnique({
    where: { id: bukuId },
    include: {
      jobs: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      bab: {
        orderBy: { id: "asc" },
      },
      images: {
        where: { isKept: true },
        orderBy: [{ pageNumber: "asc" }, { id: "asc" }],
      },
    },
  });

  return buku;
}

export async function confirmCaptionValidation(
  bukuId: number,
  updatedCaptions: Array<{ id: number; caption: string; contextText?: string; babId?: number | null }>,
  deletedImageIds: number[],
  newImages: Array<{ imagePath: string; caption: string; babId?: number | null; pageNumber?: number; contextText?: string }>
) {
  // Store file paths outside the transaction to clean up after commit
  let filesToDelete: string[] = [];

  await prisma.$transaction(async (tx) => {
    // 1. Update existing captions
    for (const item of updatedCaptions) {
      await tx.bukuImage.update({
        where: { id: item.id },
        data: {
          caption: item.caption,
          contextText: item.contextText !== undefined ? item.contextText : undefined,
          babId: item.babId !== undefined ? item.babId : undefined,
          status: "CAPTIONED",
        },
      });
    }

    // 2. Mark specified image IDs as discarded (if any passed)
    if (deletedImageIds.length > 0) {
      await tx.bukuImage.updateMany({
        where: { id: { in: deletedImageIds } },
        data: { isKept: false },
      });
    }

    // 3. Insert newly added manual images
    for (const img of newImages) {
      await tx.bukuImage.create({
        data: {
          bukuId,
          babId: img.babId || null,
          imagePath: img.imagePath,
          pageNumber: img.pageNumber || 0,
          caption: img.caption,
          contextText: img.contextText || null,
          isKept: true,
          isManualUpload: true,
          status: "CAPTIONED",
          keywords: [],
        },
      });
    }

    // 4. Advance GenerationJob status to GENERATING_QUESTIONS
    const job = await tx.generationJob.findFirst({
      where: { bukuId, status: "WAITING_CAPTION_VALIDATION" },
      orderBy: { createdAt: "desc" },
    });

    if (job) {
      await tx.generationJob.update({
        where: { id: job.id },
        data: { status: "GENERATING_QUESTIONS", updatedAt: new Date() },
      });
    }

    // 5. Query all unkept images for this book to get file paths for physical deletion
    const unkeptImages = await tx.bukuImage.findMany({
      where: { bukuId, isKept: false },
      select: { id: true, imagePath: true },
    });

    filesToDelete = unkeptImages.map((img) => {

      const cleanPath = img.imagePath.startsWith('/')
        ? img.imagePath.slice(1)
        : img.imagePath;

      return path.join(process.cwd(), 'public', cleanPath);
    });

    // 6. Delete all unkept images from database
    if (unkeptImages.length > 0) {
      await tx.bukuImage.deleteMany({
        where: { id: { in: unkeptImages.map((img) => img.id) } },
      });
    }
  });

  // 7. Delete physical files after transaction succeeds (prevents premature file deletion if DB rolls back)
  await Promise.all(
    filesToDelete.map(async (filePath) => {
      try {
        await fs.unlink(filePath);
      } catch (err) {
        // Log errors without throwing so one missing file won't break execution flow
        console.error(`Failed to delete file at ${filePath}:`, err);
      }
    })
  );

  return true;
}

export async function getSoalGenerationStatus(babId: number) {
  const [activeTasks, activeJobs] = await Promise.all([
    prisma.taskQueue.findMany({
      where: {
        type: "generate_soal",
        status: { in: ["pending", "processing"] },
      },
      select: { payload: true },
    }),
    prisma.generationJob.findMany({
      where: {
        babId,
        status: {
          in: [
            "PENDING",
            "PROCESSING_PDF",
            "EXTRACTING_IMAGES",
            "CAPTIONING_IMAGES",
            "WAITING_CAPTION_VALIDATION",
            "GENERATING_QUESTIONS",
          ],
        },
      },
    }),
  ]);

  const hasTask = activeTasks.some((t: any) => {
    const p = t.payload as any;
    return p?.babId === babId || p?.babId === String(babId) || p?.babId === Number(babId);
  });

  return { isGenerating: hasTask || activeJobs.length > 0 };
}

export async function getBookAiProcessingStatus(bukuId: number) {
  const [activeTasks, activeJobs] = await Promise.all([
    prisma.taskQueue.findMany({
      where: {
        status: { in: ["pending", "processing"] },
      },
      select: { type: true, payload: true, status: true },
    }),
    prisma.generationJob.findMany({
      where: {
        bukuId,
        status: {
          in: [
            "PENDING",
            "PROCESSING_PDF",
            "EXTRACTING_IMAGES",
            "CAPTIONING_IMAGES",
            "WAITING_CAPTION_VALIDATION",
            "GENERATING_QUESTIONS",
          ],
        },
      },
      select: { status: true, fileName: true, errorMessage: true },
    }),
  ]);

  const hasTask = activeTasks.some((t: any) => {
    const p = t.payload as any;
    return (
      p?.bukuId === bukuId ||
      p?.bukuId === String(bukuId) ||
      p?.bukuId === Number(bukuId) ||
      p?.bookId === bukuId ||
      p?.bookId === String(bukuId) ||
      p?.bookId === Number(bukuId)
    );
  });

  const isProcessing = hasTask || activeJobs.length > 0;
  let statusStage = "";
  if (activeJobs.length > 0) {
    statusStage = activeJobs[0].status;
  } else if (hasTask) {
    statusStage = "PROCESSING_TASK_QUEUE";
  }

  return {
    isProcessing,
    statusStage,
    activeJobCount: activeJobs.length,
    activeTaskCount: hasTask ? 1 : 0,
  };
}




