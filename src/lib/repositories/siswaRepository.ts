import { TipeSoal } from "@prisma/client";
import * as siswaDB from "../services/db/siswa/siswaDB";
import * as examService from "../services/exam-dda/examService";

export const siswaRepository = {
  // --- DASHBOARD ---
  getDashboardData: async (siswaId: number = 55) => {
    try {
      const [activeJadwal, historyResult] = await Promise.all([
        siswaDB.getJadwalAktif(siswaId),

        siswaDB.getRiwayatUjian(siswaId, {
          page: 1,
          pageSize: 1000,
        }),
      ]);

      const upcoming = activeJadwal.map((j: any) => ({
        jadwalId: j.id.toString(),
        title: j.judulJadwal || j.ujian.judulUjian,
        className: j.kelas.namaKelas,
        startTime: j.waktuMulaiAktif?.toISOString() || "Unknown",
        durationMinutes: j.ujian.durasiMenit,
        type: j.tipeUjian.namaTipeUjian,
      }));

      const history = historyResult.data.map((h: any) => {
        const isFinished = h.waktuSelesai !== null;
        const isGraded = h.nilaiAkhir !== null && h.isChecked;

        let status = "Menunggu Koreksi";

        if (!isFinished) {
          status = "Belum Selesai";
        } else if (isGraded) {
          status = "Dinilai";
        }

        return {
          attemptId: h.id.toString(),
          jadwalId: h.jadwalUjianId.toString(),

          title: h.jadwalUjian.judulJadwal || h.jadwalUjian.ujian.judulUjian,

          submittedAt: h.waktuSelesai
            ? h.waktuSelesai.toISOString()
            : null,

          score:
            h.nilaiAkhir !== null
              ? Number(h.nilaiAkhir)
              : null,

          status,

          feedback:
            h.jawabanSiswa?.[0]?.catatanKoreksi || null,

          aiSummary:
            h.aiLogs?.[0]?.aiStatementSummary || null,
        };
      });

      const gradedHistory = history.filter(
        (h: any) => h.score !== null,
      );

      const avgScore =
        gradedHistory.length > 0
          ? Math.round(
            gradedHistory.reduce(
              (acc: number, curr: any) =>
                acc + curr.score,
              0,
            ) / gradedHistory.length,
          )
          : 0;

      const recentScores = gradedHistory
        .slice(0, 5)
        .map((h: any) => h.score);

      let scoreTrend = 0;

      if (recentScores.length >= 2) {
        const newest = recentScores[0];
        const previousAverage =
          recentScores.slice(1).reduce(
            (sum: number, score: number) => sum + score,
            0,
          ) / (recentScores.length - 1);

        scoreTrend = Math.round(newest - previousAverage);
      }

      const performanceHistory = gradedHistory
        .slice(0, 5)
        .reverse()
        .map((h: any, index: number) => ({
          id: h.attemptId,
          title: h.title,
          score: h.score,
          label: `U${index + 1}`,
        }));

      return {
        stats: {
          active: upcoming.length,
          upcoming: upcoming.length,
          averageScore: avgScore,
        },

        upcoming,

        recentHistory: history.slice(0, 6),

        performanceHistory,

        learningInsight: {
          averageScore: avgScore,
          scoreTrend,
          totalGraded: gradedHistory.length,
        },
      };
    } catch (error) {
      console.error("Error getDashboardData:", error);

      throw new Error(
        "Gagal mengambil data dashboard siswa.",
      );
    }
  },

  // --- KELAS ---
  getSiswaKelas: async (siswaId: number = 6) => {
    const rawKelas = await siswaDB.getKelasList(siswaId);
    return rawKelas.map((k: any) => ({
      id: k.id.toString(),
      name: k.namaKelas,
      teacherName:
        k.teacher?.name || "Belum Ditugaskan",
      studentCount: k._count?.members || 0,
    }));
  },
  checkStudentInKelas: async (kelasId: string | number, siswaId?: number) => {
    if (!siswaId) return false;
    return await siswaDB.isStudentInKelas(Number(kelasId), siswaId);
  },

  checkStudentAuthorizedForJadwal: async (jadwalId: string | number, siswaId?: number) => {
    if (!siswaId) return false;
    return await siswaDB.isStudentAuthorizedForJadwal(Number(jadwalId), siswaId);
  },

  getKelasDetail: async (kelasId: string, siswaId?: number) => {
    const rawKelas = await siswaDB.getKelasDetail(parseInt(kelasId));
    if (!rawKelas) return { kelas: null, exams: [] };

    const rawJadwal = await siswaDB.getJadwalByKelas(parseInt(kelasId), siswaId);

    return {
      kelas: {
        id: rawKelas.id.toString(),
        name: rawKelas.namaKelas,
        teacherName: rawKelas.teacher?.name || "Belum Ditugaskan",
        studentCount: rawKelas._count?.members || 0,
      },
      exams: rawJadwal.map((j: any) => {
        const attempt = j.sesiSiswa?.[0];
        const quizSession = j.ujian?.quizSessions?.[0];
        const isFinished = !!attempt?.waktuSelesai || quizSession?.status === "FINISHED";

        return {
          jadwalId: j.id.toString(),
          title: j.ujian.judulUjian,
          className: rawKelas.namaKelas,
          startTime: j.waktuMulaiAktif?.toISOString() || "Unknown",
          durationMinutes: j.ujian.durasiMenit,
          type: j.tipeUjian.namaTipeUjian,
          attemptId: attempt?.id ? attempt.id.toString() : null,
          sessionId: quizSession?.id ? quizSession.id.toString() : null,
          isFinished,
        };
      }),
    };
  },

  // --- UJIAN LOBBY ---
  getExamLobby: async (jadwalId: string, siswaId?: number) => {
    const j = await siswaDB.getJadwalDetail(parseInt(jadwalId));
    if (!j) return null;

    let isFinishedByUser = false;
    if (siswaId) {
      isFinishedByUser = await siswaDB.checkStudentFinishedExam(j.id, siswaId);
    }

    const now = new Date();
    const isOngoing = j.status === "ONGOING";
    const isEnded = j.waktuSelesaiAktif ? now > new Date(j.waktuSelesaiAktif) : false;

    return {
      jadwalId: j.id.toString(),
      title: j.ujian.judulUjian,
      className: j.kelas.namaKelas,
      startTime: j.waktuMulaiAktif?.toISOString() || "Unknown",
      durationMinutes: j.ujian.durasiMenit,
      type: j.tipeUjian.namaTipeUjian,
      isOngoing,
      isEnded,
      isFinishedByUser,
      status: j.status,
    };
  },

  // --- MESIN UJIAN ---
  getExamQuestions: async (jadwalId: string, siswaId: number = 6) => {
    const sessionState = await examService.startExamSession(jadwalId, siswaId);

    return {
      nextQuestion: sessionState.nextQuestion,
      answeredCount: sessionState.answeredCount,
      totalQuestions: sessionState.totalQuestions,
      durationMinutes: sessionState.durationMinutes,
    };
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
    isFinish: boolean = false,
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

    // 2. If an answer was sent (even when finishing), process & grade it first
    if (soalIds.length > 0) {
      const latestSoalId = parseInt(soalIds[soalIds.length - 1]);
      const jawabanText = answers[latestSoalId.toString()];
      const result = await examService.submitSingleAnswer(
        currentSesiId,
        jadwalId,
        latestSoalId,
        jawabanText,
      );

      if (result.isFinished) {
        return { finished: true, finalElo: result.newElo };
      }
    }

    // 3. If frontend sends empty answers OR isFinish is true, finish exam session
    if (soalIds.length === 0 || isFinish) {
      const sessionState = await examService.startExamSession(jadwalId, siswaId);
      if (!sessionState.nextQuestion || isFinish) {
        await examService.finishExamSession(currentSesiId);
        return { finished: true };
      }
      return {
        finished: false,
        newElo: sessionState.currentElo,
        nextQuestion: sessionState.nextQuestion,
      };
    }

    const sessionState = await examService.startExamSession(jadwalId, siswaId);
    return {
      finished: false,
      newElo: sessionState.currentElo,
      nextQuestion: sessionState.nextQuestion,
    };
  },

  // --- RIWAYAT ---
  getHistoryList: async (
    siswaId: number = 6,
    options?: {
      search?: string;
      startDate?: string;
      endDate?: string;
      page?: number;
      pageSize?: number;
    }
  ) => {
    const rawData = await siswaDB.getRiwayatUjian(siswaId, options);

    return {
      data: rawData.data.map((h: any) => ({
        attemptId: h.id.toString(),

        jadwalId: h.jadwalUjianId.toString(),

        title: h.jadwalUjian.judulJadwal || h.jadwalUjian.ujian.judulUjian,

        submittedAt: h.waktuSelesai
          ? h.waktuSelesai.toISOString()
          : "Belum Selesai",

        score: h.nilaiAkhir,

        status:
          h.nilaiAkhir !== null && h.isChecked
            ? "Dinilai"
            : "Menunggu Koreksi",

        feedback: h.jawabanSiswa?.[0]?.catatanKoreksi || null,

        aiSummary:
          h.aiLogs?.[0]?.aiStatementSummary || null,
      })),

      total: rawData.total,
      totalPages: rawData.totalPages,
    };
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

  joinKelasByCode: async (siswaId: number, classCode: string) => {
    return await siswaDB.joinKelasByCode(siswaId, classCode);
  },
};
