import { StatusUjian, TipeSoal } from "@prisma/client";
import * as guruDB from "../services/db/guru/guruDB";
import { initiatePdfExtraction } from "../services/process-book/initiate-extractor";
import { Bab, Kelas, Soal, UjianTemplate } from "@/src/app/types/guru";
import { generateQuestionsWithGroq, enqueueGenerateQuestions } from "../services/process-book/generate-questions";

export const guruRepository = {
  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Gagal mengunggah gambar");
    const data = await res.json();
    return data.url;
  },
  // --- DASHBOARD ---
  getDashboardStats: async (guruId: number = 2) => {
    try {
      const [activeExams, pendingEssays, recentClasses] = await Promise.all([
        guruDB.getActiveExamsCount(guruId),
        guruDB.getPendingEssaysCount(guruId),
        guruDB.getRecentClassesCount(guruId),
      ]);

      return {
        activeExams,
        pendingEssays,
        recentClasses,
      };
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      throw new Error("Gagal mengambil statistik dashboard.");
    }
  },

  // --- BUKU ---
  getBukuList: async (guruId: number = 1) => {
    const rawBuku = await guruDB.getBukuList(guruId);

    return rawBuku.map((b: any) => ({
      id: b.id.toString(),
      judul: b.judul,
      title: b.judul, // Kompatibilitas properti mock frontend
      description: "",
      chapterCount: b._count?.bab || 0,
      jobStatus: b.jobs?.[0]?.status || null,
    }));
  },

  addBuku: async (buku: any, guruId: number = 2) => {
    const newBuku = await guruDB.createBuku(
      guruId,
      buku.judul || buku.title || "Buku Baru",
    );
    return {
      id: newBuku.id.toString(),
      judul: newBuku.judul,
      title: newBuku.judul,
      chapterCount: 0,
    };
  },

  updateBuku: async (id: string, data: any) => {
    const updated = await guruDB.updateBuku(
      parseInt(id),
      data.judul || data.title,
    );
    return {
      id: updated.id.toString(),
      judul: updated.judul,
      title: updated.judul,
    };
  },

  deleteBuku: async (id: string) => {
    await guruDB.deleteBuku(parseInt(id));
    return true;
  },

  // --- BAB ---
  getBabList: async (bookId: string) => {
    const rawBab = await guruDB.getBabList(parseInt(bookId));
    if (!rawBab) return { buku: null, babList: [] };

    return {
      buku: {
        id: rawBab.id.toString(),
        judul: rawBab.judul,
        title: rawBab.judul,
        description: "",
        chapterCount: rawBab.bab.length,
      },
      babList: rawBab.bab.map((bab: any) => ({
        id: bab.id.toString(),
        bookId: bab.bukuId.toString(),
        judulBab: bab.judulBab,
        title: bab.judulBab, // Kompatibilitas frontend
        questionCount: bab._count?.soal || 0,
      })),
    };
  },

  getBukuExportData: async (bookId: string) => {
    const rawData = await guruDB.getBukuWithBabsAndSoal(parseInt(bookId));
    if (!rawData) return null;

    const babs = rawData.bab.map((b: any) => ({
      id: b.id.toString(),
      title: b.judulBab,
      judulBab: b.judulBab,
      questionCount: b.soal.length,
    }));

    const allSoal: any[] = [];
    for (const b of rawData.bab) {
      for (const s of b.soal) {
        allSoal.push({
          id: s.id.toString(),
          babId: b.id.toString(),
          babTitle: b.judulBab,
          teksSoal: s.teksSoal,
          type: s.type,
          opsiJawaban: s.opsiJawaban,
          jawabanBenarMcq: s.jawabanBenarMcq,
          jawabanBenarEssay: s.jawabanBenarEssay || "",
          difficulty: s.difficulty,
          bloomLevel: s.bloomLevel,
          linkGambarSoal: s.linkGambarSoal || "",
          kompetensi: s.kompetensiBab ? {
            nomerKompetensi: s.kompetensiBab.nomerKompetensi,
            isiKompetensi: s.kompetensiBab.isiKompetensi,
          } : null,
          isAccepted: s.isAccepted,
          isRejected: s.isRejected,
        });
      }
    }

    return {
      buku: {
        id: rawData.id.toString(),
        title: rawData.judul,
        judul: rawData.judul,
      },
      babList: babs,
      soalList: allSoal,
    };
  },

  addBab: async (bab: any) => {
    const newBab = await guruDB.createBab(
      parseInt(bab.bookId),
      bab.judulBab || bab.title || "Bab Baru",
    );
    return {
      id: newBab.id.toString(),
      bookId: newBab.bukuId.toString(),
      judulBab: newBab.judulBab,
      title: newBab.judulBab,
      questionCount: 0,
    };
  },

  // --- SOAL ---
  getSoalList: async (
    babId: string,
  ): Promise<{ bab: Bab | null; soalList: Soal[] }> => {
    const rawSoal = await guruDB.getSoalList(parseInt(babId));
    const rawBab = await guruDB.getBabDetail(parseInt(babId));
    if (!rawBab) return { bab: null, soalList: [] };
    return {
      bab: {
        id: rawBab.id.toString(),
        title: rawBab.judulBab,
        bookId: rawBab.bukuId.toString(),
        questionCount: rawSoal.length,
      },
      soalList:
        rawSoal.map((s: any) => ({
          id: s.id.toString(),
          babId: s.babId.toString(),
          text: s.teksSoal,
          teksSoal: s.teksSoal,
          type: s.type,
          options: s.opsiJawaban,
          correctAnswer: s.jawabanBenarMcq,
          jawabanBenarMcq: s.jawabanBenarMcq,
          jawabanBenarEssay: s.jawabanBenarEssay || "",
          difficulty: s.difficulty,
          bloomLevel: s.bloomLevel,
          kompetensiBabId: s.kompetensiBabId?.toString() || null,
          linkGambarSoal: s.linkGambarSoal || "",
          isAccepted: s.isAccepted,
          isRejected: s.isRejected,
        })) ?? [],
    };
  },

  addSoal: async (soal: any) => {
    const type = soal.type === "MCQ" ? TipeSoal.MCQ : TipeSoal.ESSAY;
    const newSoal = await guruDB.createSoal({
      babId: parseInt(soal.babId),
      teksSoal: soal.text || soal.teksSoal || "",
      type,
      opsiJawaban: soal.options || soal.opsiJawaban || null,
      jawabanBenarMcq: soal.correctAnswer || soal.jawabanBenarMcq || null,
      jawabanBenarEssay: soal.jawabanBenarEssay || null,
      difficulty: soal.difficulty || null,
      bloomLevel: soal.bloomLevel || null,
      kompetensiBabId: soal.kompetensiBabId ? Number(soal.kompetensiBabId) : null,
      linkGambarSoal: soal.linkGambarSoal || null,
      isAccepted: soal.isAccepted !== undefined ? soal.isAccepted : true,
      isRejected: soal.isRejected !== undefined ? soal.isRejected : false,
    });

    return {
      id: newSoal.id.toString(),
      babId: newSoal.babId.toString(),
      type: newSoal.type,
      text: newSoal.teksSoal,
      options: newSoal.opsiJawaban,
      jawabanBenarMcq: newSoal.jawabanBenarMcq,
      jawabanBenarEssay: newSoal.jawabanBenarEssay,
    };
  },

  editSoal: async (idSoal: string, soal: any) => {
    const babIdNum = soal.babId ? parseInt(soal.babId) : 0;

    const updatedSoal = await guruDB.updateSoal(parseInt(idSoal), {
      ...(babIdNum > 0 ? { bab: { connect: { id: babIdNum } } } : {}),
      teksSoal: soal.text || soal.teksSoal || undefined,
      type: soal.type ? (soal.type === "MCQ" ? TipeSoal.MCQ : TipeSoal.ESSAY) : undefined,
      opsiJawaban: soal.options !== undefined ? soal.options : (soal.opsiJawaban !== undefined ? soal.opsiJawaban : undefined),
      jawabanBenarMcq: soal.correctAnswer !== undefined ? soal.correctAnswer : (soal.jawabanBenarMcq !== undefined ? soal.jawabanBenarMcq : undefined),
      jawabanBenarEssay: soal.jawabanBenarEssay !== undefined ? (soal.jawabanBenarEssay || null) : undefined,
      difficulty: soal.difficulty !== undefined ? Number(soal.difficulty) : undefined,
      bloomLevel: soal.bloomLevel !== undefined ? soal.bloomLevel : undefined,
      kompetensiBab: soal.kompetensiBabId !== undefined ? (
        soal.kompetensiBabId ? { connect: { id: Number(soal.kompetensiBabId) } } : { disconnect: true }
      ) : undefined,
      linkGambarSoal: soal.linkGambarSoal !== undefined ? (soal.linkGambarSoal || null) : undefined,
      isAccepted: soal.isAccepted !== undefined ? soal.isAccepted : undefined,
      isRejected: soal.isRejected !== undefined ? soal.isRejected : undefined,
    });

    return {
      id: updatedSoal.id.toString(),
      babId: updatedSoal.babId.toString(),
      type: updatedSoal.type,
      text: updatedSoal.teksSoal,
      options: updatedSoal.opsiJawaban,
      jawabanBenarMcq: updatedSoal.jawabanBenarMcq,
      jawabanBenarEssay: updatedSoal.jawabanBenarEssay,
      difficulty: updatedSoal.difficulty,
      bloomLevel: updatedSoal.bloomLevel,
    };
  },

  // --- TEMPLATES UJIAN ---
  getTemplates: async (guruId: number = 2) => {
    const templates = await guruDB.getUjianTemplates(guruId);
    return (
      templates.map((t: any) => ({
        id: t.id.toString(),
        title: t.judulUjian,
        judulUjian: t.judulUjian,
        durasiMenit: t.durasiMenit,
        questionCount: t.totalSoal || 0,
      })) ?? []
    );
  },

  // template
  getTemplateById: async (templateId: number) => {
    const template = await guruDB.getUjianTemplateById(templateId);

    if (!template) {
      return null;
    }

    return {
      id: template.id.toString(),
      title: template.judulUjian,
      judulUjian: template.judulUjian,
      durasiMenit: template.durasiMenit,
      isAdaptive: template.isAdaptive,
      isLocked: template.isLocked,
      templateKompetensi: template.templateKompetensi?.map((tk: any) => ({
        id: tk.id,
        kompetensiBabId: tk.kompetensiBabId,
        jumlahSoal: tk.jumlahSoal,
        totalPoint: tk.totalPoint,
        isEnabled: tk.isEnabled,
        nomerKompetensi: tk.kompetensiBab?.nomerKompetensi,
        isiKompetensi: tk.kompetensiBab?.isiKompetensi,
      })) || [],

      questionCount: template.ujianBab.reduce(
        (count, ub) => count + ub.bab.soal.length,
        0,
      ),

      babs: template.ujianBab.map((ub) => ({
        id: ub.bab.id.toString(),
        title: ub.bab.judulBab,

        questions: ub.bab.soal.map((soal: any) => ({
          id: soal.id.toString(),
          text: soal.teksSoal,
          opsiJawaban: soal.opsiJawaban,
          jawabanBenarMcq: soal.jawabanBenarMcq,
          type: soal.type,
          difficulty: soal.difficulty,
          bloomLevel: soal.bloomLevel,
        })),
      })),
    };
  },

  createTemplate: async (
    ujian: any,
    guruId: number,
    babIds: number[],
  ) => {
    await guruDB.createTemplate(
      {
        judulUjian: ujian.title,
        jumlahSoal: ujian.questionCount,
        durasiMenit: ujian.durasiMenit,
        isAdaptive: ujian.isAdaptive !== undefined ? ujian.isAdaptive : true,
        guru: {
          connect: {
            id: guruId,
          },
        },
      },
      babIds,
      ujian.templateKompetensi || []
    );

    return { success: true, message: "Soal ujian berhasil diperbarui." };
  },

  updateTemplateQuestions: async (
    templateId: number,
    ujian: any,
    guruId: number,
    babIds: number[],
  ) => {
    await guruDB.upsertTemplateBabSafe(
      templateId,
      {
        judulUjian: ujian.title,
        jumlahSoal: ujian.questionCount,
        durasiMenit: ujian.durasiMenit,
        isAdaptive: ujian.isAdaptive !== undefined ? ujian.isAdaptive : true,
        guru: {
          connect: {
            id: guruId,
          },
        },
      },
      babIds,
      ujian.templateKompetensi || []
    );

    return { success: true, message: "Soal ujian berhasil diperbarui." };
  },

  uploadAndGenerateBookPdf: async (formData: FormData) => {
    return await initiatePdfExtraction(formData);
  },
  retryGenerateSoal: async (babId: number) => {
    return await enqueueGenerateQuestions(babId);
  },

  getKelas: async (sekolah_id: number, guru_id: number): Promise<Kelas[]> => {
    const kelasList = await guruDB.getKelas(sekolah_id, guru_id);
    return kelasList.map((k) => ({
      id: k.id,
      name: k.namaKelas,
      sekolahId: k.sekolahId,
      teacherId: k.teacherId,
      teacherName: k.teacher.name,
      studentCount: k._count.members,
    })) as unknown as Kelas[];
  },

  getTipeUjian: async () => {
    const tipeUjian = await guruDB.getTipeUjian();
    return tipeUjian.map((t) => ({
      id: t.id.toString(),
      namaTipeUjian: t.namaTipeUjian,
    }));
  },

  // --- JADWAL ---
  getJadwal: async (guruId: number = 2) => {
    const rawJadwal = await guruDB.getJadwal(guruId);
    return rawJadwal.map((j: any) => ({
      id: j.id.toString(),
      templateId: j.ujianId.toString(),
      className: j.kelas.namaKelas,
      startTime: j.waktuMulaiAktif?.toISOString() || "",
      status:
        j.status === "SCHEDULED"
          ? "Upcoming"
          : j.status === "ONGOING"
            ? "Active"
            : j.status === "COMPLETED"
              ? "Completed"
              : "Draft",
      type: j.tipeUjian?.namaTipeUjian || "Ujian",
    }));
  },

  getSoalByBab: async (selectedBab: string): Promise<Soal[]> => {
    const listSoal = await guruDB.getSoalByBab(Number(selectedBab));
    return (
      listSoal.map((s: any) => ({
        id: s.id.toString(),
        babId: s.babId.toString(),
        type: s.type,
        text: s.teksSoal,
        options: s.opsiJawaban ?? [],
        correctAnswer: s.jawabanBenarMcq,
        difficulty: s.difficulty,
        bloomLevel: s.bloomLevel,
      })) ?? []
    );
  },

  getBabByBuku: async (selectedBuku: string) => {
    const listBab = await guruDB.getBabByBuku(Number(selectedBuku));
    return listBab.map((b: any) => ({
      id: b.id.toString(),
      bookId: b.bukuId.toString(),
      title: b.judulBab,
      questionCount: 0,
    }));
  },

  createJadwal: async (jadwal: any) => {
    const newJadwal = await guruDB.createJadwal({
      ujianId: parseInt(jadwal.templateId),
      kelasId: parseInt(jadwal.kelasId),
      tipeUjianId: parseInt(jadwal.tipeUjianId || 1), // Fallback to TipeUjian ID 1
      waktuMulaiAktif: jadwal.startTime
        ? new Date(jadwal.startTime)
        : new Date(),
      waktuSelesaiAktif: jadwal.endTime
        ? new Date(jadwal.endTime)
        : new Date(Date.now() + 90 * 60000),
    });
    return {
      id: newJadwal.id.toString(),
      status: "Upcoming",
      ...jadwal,
    };
  },

  // --- REPORTS ---
  getCompletedJadwal: async (guruId: number = 2) => {
    const rawJadwal = await guruDB.getJadwal(guruId);
    return rawJadwal
      .filter((j: any) => j.status === StatusUjian.COMPLETED)
      .map((j: any) => ({
        id: j.id.toString(),
        templateId: j.ujianId.toString(),
        className: j.kelas.namaKelas,
        startTime: j.waktuMulaiAktif?.toISOString() || "",
        status: "Completed",
        type: j.tipeUjian?.namaTipeUjian || "Ujian",
      }));
  },

  getReportDetail: async (jadwalId: string) => {
    const detail = await guruDB.getReportDetail(parseInt(jadwalId));
    if (!detail) throw new Error("Jadwal tidak ditemukan");

    return {
      jadwal: {
        id: detail.id.toString(),
        templateId: detail.ujian.id.toString(),
        className: detail.kelas.namaKelas,
        startTime: detail.waktuMulaiAktif?.toISOString() || "",
        status: "Completed",
        type: detail.tipeUjian.namaTipeUjian || "Ujian",
      },
      attempts: detail.sesiSiswa.map((sesi: any) => ({
        id: sesi.id.toString(),
        jadwalId: sesi.jadwalUjianId.toString(),
        studentName: sesi.siswa.name,
        score: sesi.nilaiAkhir,
        status: sesi.nilaiAkhir !== null ? "Graded" : "Pending Essay",
      })),
    };
  },

  getAttempt: async (attemptId: string) => {
    const a = await guruDB.getAttemptDetail(parseInt(attemptId));
    if (!a) return null;

    return {
      id: a.id.toString(),
      jadwalId: a.jadwalUjianId.toString(),
      studentName: a.siswa.name,
      score: a.nilaiAkhir,
      isChecked: a.isChecked,
      status: a.isChecked ? "Checked" : (a.nilaiAkhir !== null ? "Graded" : "Pending Essay"),
      aiSummary: a.aiLogs[0]?.overview || "",
      answers: a.jawabanSiswa.map((ans: any) => ({
        jawabanId: ans.id.toString(),
        text: ans.teksSoal,
        type: ans.type,
        studentAnswer: ans.jawabanSiswa,
        isCorrect: ans.isCorrect,
        point: ans.nilaiPoin,
        feedback: ans.catatanKoreksi || "",
        aiResponse: ans.aiResponse || "",
        jawabanBenarEssay: ans.jawabanBenarEssay || ans.soalAsli?.jawabanBenarEssay || "",
      })),
    };
  },

  gradeAttempt: async (
    attemptId: string,
    gradedAnswers: {
      jawabanId: number;
      nilaiPoin: number;
      catatanKoreksi: string;
      isCorrect?: boolean;
    }[],
  ) => {
    const attemptIdNum = parseInt(attemptId);

    // 1. Update each graded essay answer individually
    for (const answer of gradedAnswers) {
      await guruDB.gradeJawabanSiswa(
        answer.jawabanId,
        answer.nilaiPoin,
        answer.catatanKoreksi,
        answer.isCorrect,
      );
    }

    // 2. Fetch ALL answers for this attempt to calculate the accurate final score
    const allAnswers = await guruDB.getAttemptDetail(attemptIdNum);

    const newTotalScore =
      allAnswers?.jawabanSiswa.reduce(
        (sum, ans) => sum + (ans.nilaiPoin || 0),
        0,
      ) ?? 0;

    // 3. Update the final score on the attempt record
    const updated = await guruDB.updateAttemptScore(
      attemptIdNum,
      newTotalScore,
    );

    // 4. Return the DTO expected by the frontend
    const primaryFeedback = gradedAnswers[0]?.catatanKoreksi || "";

    return {
      id: updated.id.toString(),
      jadwalId: updated.jadwalUjianId.toString(),
      studentName: updated.siswa?.name || "Siswa",
      score: updated.nilaiAkhir,
      status: updated.isChecked ? "Checked" : "Graded",
      feedback: primaryFeedback,
      aiSummary: "Koreksi manual berhasil disimpan oleh guru.",
    };
  },

  finishAttempt: async (attemptId: string) => {
    return await guruDB.finishAttemptReview(parseInt(attemptId));
  },

  updateBab: async (id: string, title: string) => {
    const updated = await guruDB.updateBab(parseInt(id), title);
    return {
      id: updated.id.toString(),
      bookId: updated.bukuId.toString(),
      judulBab: updated.judulBab,
      title: updated.judulBab,
    };
  },

  deleteBab: async (id: string) => {
    await guruDB.deleteBab(parseInt(id));
    return true;
  },

  deleteSoal: async (id: string) => {
    await guruDB.deleteSoal(parseInt(id));
    return true;
  },

  getBukuPdfUrl: async (bukuId: string) => {
    const job = await guruDB.getBukuPdf(parseInt(bukuId));
    return job?.fileUrl || null;
  },

  getKelasDetail: async (kelasId: string) => {
    const data = await guruDB.getKelasDetail(parseInt(kelasId));
    if (!data) return null;
    return {
      id: data.id,
      name: data.namaKelas,
      classCode: data.classCode,
      studentCount: data._count.members,
      teacherName: data.teacher.name,
      students: data.members
        .map((m) => m.user)
        .filter((u) => u.role === "SISWA")
        .map((u) => ({
          id: u.id.toString(),
          name: u.name,
          email: u.email,
        })),
    };
  },

  getExamsByKelas: async (kelasId: string) => {
    const raw = await guruDB.getExamsByKelas(parseInt(kelasId));
    return raw.map((j) => ({
      id: j.id.toString(),
      templateId: j.ujianId.toString(),
      title: j.ujian.judulUjian,
      startTime: j.waktuMulaiAktif?.toISOString() || "",
      endTime: j.waktuSelesaiAktif?.toISOString() || "",
      durationMinutes: j.ujian.durasiMenit,
      status: j.status,
      type: j.tipeUjian.namaTipeUjian,
    }));
  },

  updateJadwalStatus: async (jadwalId: string, status: StatusUjian) => {
    return await guruDB.updateJadwalStatus(parseInt(jadwalId), status);
  },

  getStudentHistoryInClass: async (siswaId: string, kelasId: string) => {
    const raw = await guruDB.getStudentHistoryInClass(parseInt(siswaId), parseInt(kelasId));
    return raw.map((s) => ({
      attemptId: s.id.toString(),
      title: s.jadwalUjian.ujian.judulUjian,
      score: s.nilaiAkhir,
      submittedAt: s.waktuSelesai?.toISOString() || "Belum Selesai",
    }));
  },

  getClassGradesReport: async (kelasId: string) => {
    const raw = await guruDB.getClassGradesReport(parseInt(kelasId));
    return raw.map((j) => ({
      jadwalId: j.id.toString(),
      examTitle: j.ujian.judulUjian,
      grades: j.sesiSiswa.map((s) => ({
        siswaId: s.siswaId.toString(),
        siswaName: s.siswa.name,
        score: s.nilaiAkhir,
      })),
    }));
  },

  getKompetensiBab: async (babId: number) => {
    return await guruDB.getKompetensiBab(babId);
  },

  upsertKompetensiBab: async (payload: {
    id?: number;
    babId: number;
    nomerKompetensi: string;
    isiKompetensi: string;
    kompetensiPelajaranId?: number;
  }) => {
    return await guruDB.upsertKompetensiBab(payload);
  },

  deleteKompetensiBab: async (id: number) => {
    return await guruDB.deleteKompetensiBab(id);
  },

  getAvailablePelajaranBooks: async () => {
    return await guruDB.getAvailablePelajaranBooks();
  },

  getAvailablePelajaranChapters: async (bookName: string) => {
    return await guruDB.getAvailablePelajaranChapters(bookName);
  },

  getKompetensiPelajaran: async (bookName: string, chapterName: string) => {
    return await guruDB.getKompetensiPelajaran(bookName, chapterName);
  },

  linkKompetensiPelajaranToBab: async (babId: number, competencyPelajaranIds: number[]) => {
    return await guruDB.linkKompetensiPelajaranToBab(babId, competencyPelajaranIds);
  },

  getKompetensiForBabs: async (babIds: number[]) => {
    return await guruDB.getKompetensiForBabs(babIds);
  },

  getAvailableSoalCounts: async (babIds: number[]) => {
    return await guruDB.getAvailableSoalCounts(babIds);
  },
};
