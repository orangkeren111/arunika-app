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
  return await prisma.$transaction(async (tx) => {
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

    // 2. Discard/delete discarded image IDs
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

    return true;
  });
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



