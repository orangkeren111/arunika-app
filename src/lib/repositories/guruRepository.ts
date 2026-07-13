import { StatusUjian, TipeSoal } from "@prisma/client/index-browser";
import * as guruDB from "../services/db/guru/guruDB";
import { Bab, Kelas, Soal } from "@/src/app/types/guru";

/**
 * File ini bertugas sebagai penghubung (Middle-man).
 * ViewModel di frontend memanggil fungsi di sini, BUKAN memanggil db secara langsung.
 * Semua nama fungsi disamakan persis dengan mock data agar tidak merusak frontend.
 */

export const guruRepository = {
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
  getBukuList: async (guruId: number = 2) => {
    const rawBuku = await guruDB.getBukuList(guruId);

    return rawBuku.map((b: any) => ({
      id: b.id.toString(),
      judul: b.judul,
      title: b.judul, // Kompatibilitas properti mock frontend
      description: "",
      chapterCount: b._count?.bab || 0,
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
  getSoalList: async (babId: string) => {
    const rawSoal = await guruDB.getSoalList(parseInt(babId));
    if (!rawSoal.length) return { bab: null, soalList: [] };
    return {
      bab: {
        id: rawSoal[0].bab.id.toString(),
        judulBab: rawSoal[0].bab.judulBab,
        title: rawSoal[0].bab.judulBab,
        bookId: rawSoal[0].bab.bukuId.toString(),
        questionCount: rawSoal.length,
      },
      soalList: rawSoal.map((s: any) => ({
        id: s.id.toString(),
        babId: s.babId.toString(),
        text: s.teksSoal,
        teksSoal: s.teksSoal,
        type: s.type,
        options: s.opsiJawaban,
        correctAnswer: s.jawabanBenarMcq,
        jawabanBenarMcq: s.jawabanBenarMcq,
      })),
    };
  },

  addSoal: async (soal: any) => {
    const type = soal.type === "MCQ" ? TipeSoal.MCQ : TipeSoal.ESSAY;
    const newSoal = await guruDB.createSoal({
      babId: parseInt(soal.babId),
      teksSoal: soal.text || soal.teksSoal || "",
      type,
      opsiJawaban: soal.options || soal.opsiJawaban || null,
      jawabanBenarMcq: soal.answer || soal.jawabanBenarMcq || null,
    });

    return {
      id: newSoal.id.toString(),
      babId: newSoal.babId.toString(),
      type: newSoal.type,
      text: newSoal.teksSoal,
      options: newSoal.opsiJawaban,
      jawabanBenarMcq: newSoal.jawabanBenarMcq,
    };
  },

  // --- TEMPLATES UJIAN ---
  getTemplates: async (guruId: number = 2) => {
    const templates = await guruDB.getUjianTemplates(guruId);
    return templates.map((t: any) => ({
      id: t.id.toString(),
      title: t.judulUjian,
      judulUjian: t.judulUjian,
      durasiMenit: t.durasiMenit,
      questionCount: t._count?.detailSoal || 0,
    }));
  },

  // template
  getTemplateById: async (templateId: number) => {
    const template = await guruDB.getUjianTemplateById(templateId);

    // Handle case where template doesn't exist
    if (!template) {
      return null;
    }

    return {
      id: template.id.toString(),
      title: template.judulUjian,
      judulUjian: template.judulUjian,
      durasiMenit: template.durasiMenit,
      isLocked: template.isLocked, // Use this in UI to disable edits if true
      questionCount: template.detailSoal.length,

      // Map the snapshot questions
      questions: template.detailSoal.map((soal: any) => ({
        id: soal.id.toString(),
        babId: (soal.babId ?? 0).toString(),
        soalAsliId: soal.soalAsliId?.toString() || null,
        text: soal.teksSoal,
        opsiJawaban: soal.opsiJawaban,
        jawabanBenarMcq: soal.jawabanBenarMcq,
        type: soal.type,
      })),
    };
  },

  updateTemplateQuestions: async (
    templateId: number,
    bankSoalIds: number[],
  ) => {
    // Langsung delegasikan semua proses (termasuk validasi) ke DB layer
    await guruDB.upsertTemplateQuestionsSafe(templateId, bankSoalIds);

    return { success: true, message: "Soal ujian berhasil diperbarui." };
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

  getSoalByBab: async (selectedBab: string) => {
    const listSoal = await guruDB.getSoalByBab(Number(selectedBab));
    return (
      listSoal.map((s: any) => ({
        id: s.id.toString(),
        babId: s.babId.toString(),
        type: s.type,
        text: s.teksSoal,
        options: s.opsiJawaban ?? [],
        correctAnswer: s.jawabanBenarMcq,
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
      status: a.nilaiAkhir !== null ? "Graded" : "Pending Essay",
      feedback: a.jawabanSiswa[0]?.catatanKoreksi || "",
      aiSummary: a.aiLogs[0]?.aiStatementSummary || "",
      answers: a.jawabanSiswa.map((ans: any) => ({
        soalId: ans.soalId.toString(),
        text: ans.soal.teksSoal,
        type: ans.soal.type,
        studentAnswer: ans.jawabanSiswa,
        isCorrect: ans.isCorrect,
        point: ans.nilaiPoin,
      })),
    };
  },

  gradeAttempt: async (attemptId: string, score: number, feedback: string) => {
    // Memperbarui skor final di tabel SesiUjianSiswa
    const updated = await guruDB.updateAttemptScore(parseInt(attemptId), score);

    return {
      id: updated.id.toString(),
      jadwalId: updated.jadwalUjianId.toString(),
      studentName: updated.siswa?.name || "Siswa",
      score: updated.nilaiAkhir,
      status: "Graded",
      feedback: feedback,
      aiSummary: "Koreksi manual berhasil disimpan oleh guru.",
    };
  },
};
