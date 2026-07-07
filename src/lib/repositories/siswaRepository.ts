import * as siswaDB from "../services/db/siswa/siswaDB";
import { mockSoal } from "./mockDb";

export const siswaRepository = {
  // --- DASHBOARD ---
  getDashboardData: async (siswaId: number = 55) => {
    // 6 adalah ID fallback untuk simulasi Siswa
    try {
      const [activeJadwal, historyData] = await Promise.all([
        siswaDB.getJadwalAktif(siswaId),
        siswaDB.getRiwayatUjian(siswaId),
      ]);

      const upcoming = activeJadwal.map((j: any) => ({
        jadwalId: j.id.toString(),
        title: j.ujian.judulUjian,
        className: j.kelas.namaKelas,
        startTime: j.waktuMulaiAktif?.toISOString() || "Unknown",
        durationMinutes: j.ujian.durasiMenit,
        type: j.tipeUjian.namaTipeUjian,
      }));

      const history = historyData.map((h: any) => ({
        attemptId: h.id.toString(),
        jadwalId: h.jadwalUjianId.toString(),
        title: h.jadwalUjian.ujian.judulUjian,
        submittedAt: h.waktuSelesai
          ? h.waktuSelesai.toISOString()
          : "Belum Selesai",
        score: h.nilaiAkhir,
        status: h.nilaiAkhir !== null ? "Dinilai" : "Menunggu Koreksi",
        feedback: h.jawabanSiswa?.[0]?.catatanKoreksi || null,
        aiSummary: h.aiLogs?.[0]?.aiStatementSummary || null,
      }));

      const gradedHistory = history.filter((h: any) => h.score !== null);
      const avgScore =
        gradedHistory.length > 0
          ? Math.round(
              gradedHistory.reduce(
                (acc: number, curr: any) => acc + (curr.score || 0),
                0,
              ) / gradedHistory.length,
            )
          : 0;

      return {
        stats: {
          active: activeJadwal.length,
          upcoming: upcoming.length,
          averageScore: avgScore,
        },
        upcoming,
        recentHistory: history.slice(0, 2),
      };
    } catch (error) {
      console.error("Error getDashboardData:", error);
      throw new Error("Gagal mengambil data dashboard siswa.");
    }
  },

  // --- KELAS ---
  getSiswaKelas: async (siswaId: number = 6) => {
    const rawKelas = await siswaDB.getKelasList(siswaId);
    return rawKelas.map((k: any) => ({
      id: k.id.toString(),
      name: k.namaKelas,
      teacherName:
        k.members.length > 0 ? k.members[0].user.name : "Belum Ditugaskan",
      studentCount: k._count?.members || 0,
    }));
  },

  getKelasDetail: async (kelasId: string) => {
    const rawKelas = await siswaDB.getKelasDetail(parseInt(kelasId));
    if (!rawKelas) return { kelas: null, exams: [] };

    const rawJadwal = await siswaDB.getJadwalByKelas(parseInt(kelasId));

    return {
      kelas: {
        id: rawKelas.id.toString(),
        name: rawKelas.namaKelas,
        teacherName:
          rawKelas.members.length > 0
            ? rawKelas.members[0].user.name
            : "Belum Ditugaskan",
        studentCount: rawKelas._count?.members || 0,
      },
      exams: rawJadwal.map((j: any) => ({
        jadwalId: j.id.toString(),
        title: j.ujian.judulUjian,
        className: rawKelas.namaKelas,
        startTime: j.waktuMulaiAktif?.toISOString() || "Unknown",
        durationMinutes: j.ujian.durasiMenit,
        type: j.tipeUjian.namaTipeUjian,
      })),
    };
  },

  // --- UJIAN LOBBY ---
  getExamLobby: async (jadwalId: string) => {
    const j = await siswaDB.getJadwalDetail(parseInt(jadwalId));
    if (!j) return null;

    return {
      jadwalId: j.id.toString(),
      title: j.ujian.judulUjian,
      className: j.kelas.namaKelas,
      startTime: j.waktuMulaiAktif?.toISOString() || "Unknown",
      durationMinutes: j.ujian.durasiMenit,
      type: j.tipeUjian.namaTipeUjian,
    };
  },

  // --- MESIN UJIAN ---
  getExamQuestions: async (jadwalId: string) => {
    const data = await siswaDB.getQuestionsForExam(parseInt(jadwalId));
    if (!data || !data.ujian) return [];

    return data.ujian.detailSoal.map((d: any) => ({
      id: d.soal.id.toString(),
      type: d.soal.type,
      text: d.soal.teksSoal,
      options: d.soal.opsiJawaban,
    }));
  },

  getNextQuestion: async (jadwalId: string, currentSoalId?: string) => {
    const data = await siswaDB.getQuestionsForExam(parseInt(jadwalId));
    if (!data || !data.ujian) return null;

    const questions = data.ujian.detailSoal.map((d: any) => d.soal);

    if (!currentSoalId) {
      return questions[0]
        ? {
            id: questions[0].id.toString(),
            type: questions[0].type,
            text: questions[0].teksSoal,
            options: questions[0].opsiJawaban,
          }
        : null;
    }

    const currentIndex = questions.findIndex(
      (q: any) => q.id.toString() === currentSoalId,
    );

    if (currentIndex === -1 || currentIndex === questions.length - 1) {
      return null;
    }

    const nextQuestion = questions[currentIndex + 1];

    return {
      id: nextQuestion.id.toString(),
      type: nextQuestion.type,
      text: nextQuestion.teksSoal,
      options: nextQuestion.opsiJawaban,
    };
  },

  // --- SUBMISSION ---
  // Parameter siswaId ditambahkan di akhir dengan nilai default agar pemanggilan (jadwalId, answers) dari frontend tidak error
  submitExamAttempt: async (
    jadwalId: string,
    answers: Record<string, string>,
    siswaId: number = 6,
  ) => {
    const sesi = await siswaDB.createSesiUjian(parseInt(jadwalId), siswaId);

    const formattedAnswers = Object.entries(answers).map(
      ([soalId, textJawaban]) => ({
        soalId: parseInt(soalId),
        jawabanSiswa: textJawaban,
      }),
    );

    await siswaDB.submitAnswers(sesi.id, formattedAnswers);
    return true;
  },

  // --- RIWAYAT ---
  getHistoryList: async (siswaId: number = 6) => {
    const rawData = await siswaDB.getRiwayatUjian(siswaId);
    return rawData.map((h: any) => ({
      attemptId: h.id.toString(),
      jadwalId: h.jadwalUjianId.toString(),
      title: h.jadwalUjian.ujian.judulUjian,
      submittedAt: h.waktuSelesai
        ? h.waktuSelesai.toISOString()
        : "Belum Selesai",
      score: h.nilaiAkhir,
      status: h.nilaiAkhir !== null ? "Dinilai" : "Menunggu Koreksi",
      feedback: h.jawabanSiswa?.[0]?.catatanKoreksi || null,
      aiSummary: h.aiLogs?.[0]?.aiStatementSummary || null,
    }));
  },

  getHistoryDetail: async (attemptId: string) => {
    const a = await siswaDB.getAttemptDetail(parseInt(attemptId));
    if (!a) return null;

    return {
      attemptId: a.id.toString(),
      jadwalId: a.jadwalUjianId.toString(),
      title: a.jadwalUjian.ujian.judulUjian,
      submittedAt: a.waktuSelesai
        ? a.waktuSelesai.toISOString()
        : "Belum Selesai",
      score: a.nilaiAkhir,
      status: a.nilaiAkhir !== null ? "Dinilai" : "Menunggu Koreksi",
      feedback: a.jawabanSiswa?.[0]?.catatanKoreksi || null,
      aiSummary: a.aiLogs?.[0]?.aiStatementSummary || null,
    };
  },
};
