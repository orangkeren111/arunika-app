import { TipeSoal } from "@prisma/client";
import * as siswaDB from "../services/db/siswa/siswaDB";
import * as examService from "../services/exam-dda/examService";
import { enqueueStudentReport } from "../services/report/generator";

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
  getExamQuestions: async (jadwalId: string, siswaId: number = 6) => {
    const sessionState = await examService.startExamSession(jadwalId, siswaId);

    // Return as array to maintain compatibility if frontend expects an array
    if (!sessionState.nextQuestion) return [];
    return [sessionState.nextQuestion];
  },

  /**
   * ADAPTED FOR DDA:
   * In a dynamic exam, the "Next" question is determined by submitting the previous answer.
   * This function now acts as a safe resume/fetch for the current pending question.
   */
  getNextQuestion: async (
    jadwalId: string,
    currentSoalId?: string,
    siswaId: number = 6,
  ) => {
    const sessionState = await examService.startExamSession(jadwalId, siswaId);
    return sessionState.nextQuestion;
  },

  /**
   * ADAPTED FOR REAL-TIME DDA:
   * Frontend should call this every time the user clicks "Next" or submits an answer.
   *
   * @param answers e.g., { "15": "A" } - The latest answer from the student
   * @param sesiId Optional, but highly recommended to pass from frontend state
   */
  submitExamAttempt: async (
    jadwalId: string,
    answers: Record<string, string>,
    siswaId: number = 6,
    sesiId?: number,
  ) => {
    // 1. Ensure we have the active Session ID
    let currentSesiId = sesiId;
    if (!currentSesiId) {
      const activeSession = await siswaDB.getActiveSession(
        parseInt(jadwalId),
        siswaId,
      );
      if (!activeSession) throw new Error("No active exam session found.");
      currentSesiId = activeSession.id;
    }

    const soalIds = Object.keys(answers);

    // 2. If frontend sends empty answers, treat as a forced "Finish Exam" command
    if (soalIds.length === 0) {
      await examService.finishExamSession(currentSesiId);
      enqueueStudentReport(currentSesiId);
      return { finished: true };
    }

    // 3. Extract the most recent answer (Real-Time processing)
    const latestSoalId = parseInt(soalIds[soalIds.length - 1]);
    const jawabanText = answers[latestSoalId.toString()];

    // 4. Push to DDA Engine (Auto-grades, updates ELO, finds next question)
    const result = await examService.submitSingleAnswer(
      currentSesiId,
      jadwalId,
      latestSoalId,
      jawabanText,
    );

    // 5. Return outcome to frontend
    if (result.isFinished) {
      return { finished: true, finalElo: result.newElo };
    }

    return {
      finished: false,
      newElo: result.newElo,
      nextQuestion: result.nextQuestion,
    };
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
      aiSummary: a.aiLogs?.[0]?.overview || null,
    };
  },
};
