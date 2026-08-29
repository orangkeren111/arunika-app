import * as quizDB from "../services/db/quiz/quizDB";
import * as quizAgent from "../services/quiz-agent/agent";

export const quizRepository = {
  getActiveSessionsCount: async (ujianId: number) => {
    return await quizDB.getActiveSessionsCount(ujianId);
  },

  joinOrRegisterQueue: async (siswaId: number, ujianId: number) => {
    const session = await quizDB.joinOrRegisterQueue(siswaId, ujianId);
    return {
      id: session.id,
      siswaId: session.siswaId,
      ujianId: session.ujianId,
      status: session.status,
      currentLevel: session.currentLevel,
      wrongStreak: session.wrongStreak,
      lastActiveAt: session.lastActiveAt,
    };
  },

  claimPlayingSlot: async (sessionId: number) => {
    return await quizDB.claimPlayingSlot(sessionId);
  },

  updateQuizActivity: async (sessionId: number) => {
    return await quizDB.updateQuizActivity(sessionId);
  },

  finishOrFailSession: async (
    sessionId: number,
    status: "FINISHED" | "FAILED" | "AFK",
    reason?: string,
    latestCompetencyLog?: any
  ) => {
    return await quizDB.finishOrFailSession(sessionId, status, reason, latestCompetencyLog);
  },

  getLobbyQuizQuestions: async (ujianId: number) => {
    const questions = await quizDB.getLobbyQuizQuestions(ujianId);
    return questions.map((q) => ({
      id: q.id,
      text: q.teksSoal,
      options: q.opsiJawaban as string[],
      correctAnswer: q.jawabanBenarMcq || "",
    }));
  },

  getCompetenciesForUjian: async (ujianId: number, sessionId?: number) => {
    const list = await quizDB.getCompetenciesForUjian(ujianId, sessionId);
    return list.map((item: any) => ({
      id: item.kompetensiBab.id,
      code: item.kompetensiBab.nomerKompetensi,
      name: item.kompetensiBab.isiKompetensi,
      jumlahSoal: item.jumlahSoal,
      isCompleted: item.isCompleted,
    }));
  },

  getQuestionsForCompetency: async (kompetensiBabId: number) => {
    const questions = await quizDB.getQuestionsForCompetency(kompetensiBabId);
    return questions.map((q) => ({
      id: q.id,
      text: q.teksSoal,
      options: q.opsiJawaban as string[],
      correctAnswer: q.jawabanBenarMcq || "",
      difficulty: q.difficulty,
      bloomLevel: q.bloomLevel,
      linkGambarSoal: q.linkGambarSoal || null,
    }));
  },

  getQuizSessionDetail: async (sessionId: number) => {
    const session = await quizDB.getQuizSessionDetail(sessionId);
    if (!session) return null;
    return {
      id: session.id,
      siswaId: session.siswaId,
      siswaName: session.siswa.name,
      ujianId: session.ujianId,
      ujianTitle: session.ujian.judulUjian,
      status: session.status,
      currentLevel: session.currentLevel,
      wrongStreak: session.wrongStreak,
      history: session.history,
      lastActiveAt: session.lastActiveAt,
    };
  },

  updateQuizSessionHistory: async (sessionId: number, history: any, levelCompleted?: boolean) => {
    return await quizDB.updateQuizSessionHistory(sessionId, history, levelCompleted);
  },

  incrementWrongStreak: async (sessionId: number) => {
    return await quizDB.incrementWrongStreak(sessionId);
  },

  runAgentSelectQuestions: async (kompetensiBabId: number) => {
    return await quizAgent.agentSelectQuestions(kompetensiBabId);
  },

  runAgentEvaluateAnswers: async (questionsWithAnswers: any[]) => {
    return await quizAgent.agentEvaluateAnswers(questionsWithAnswers);
  },

  getUjianIdByJadwal: async (jadwalId: number) => {
    return await quizDB.getUjianIdByJadwal(jadwalId);
  },

  getCompetencyById: async (kompetensiBabId: number) => {
    const comp = await quizDB.getCompetencyById(kompetensiBabId);
    if (!comp) return null;
    return {
      id: comp.id,
      code: comp.nomerKompetensi,
      name: comp.isiKompetensi,
    };
  },
};
