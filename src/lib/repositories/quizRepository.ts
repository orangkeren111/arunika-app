import * as quizDB from "../services/db/quiz/quizDB";
import * as quizAgent from "../services/quiz-agent/agent";
import { runRouterAgentEvaluation, MicroPayloadVector } from "../services/quiz-agent/routerAgent";
import { runTutorAgentChat, ChatMessageItem } from "../services/quiz-agent/tutorAgent";

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
      sessionMode: session.sessionMode,
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
    const sessionMode = status === "FINISHED" ? "MASTERED" : "FAILED";
    await quizDB.updateQuizSessionMode(sessionId, sessionMode);
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
      bloomLevel: q.bloomLevel || "C1",
      tags: q.tags || [],
      linkGambarSoal: q.linkGambarSoal || null,
    }));
  },

  fetchBatchQuestionDetails: async (questionIds: number[]) => {
    const questions = await quizDB.getQuestionsByIds(questionIds);
    return questions.map((q) => ({
      id: q.id,
      text: q.teksSoal,
      options: q.opsiJawaban as string[],
      correctAnswer: q.jawabanBenarMcq || "",
      difficulty: q.difficulty,
      bloomLevel: q.bloomLevel || "C1",
      tags: q.tags || [],
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
      sessionMode: session.sessionMode || "QUIZ_ACTIVE",
      currentLevel: session.currentLevel,
      wrongStreak: session.wrongStreak,
      history: session.history,
      lastActiveAt: session.lastActiveAt,
    };
  },

  updateQuizSessionHistory: async (sessionId: number, history: any, levelCompleted?: boolean) => {
    return await quizDB.updateQuizSessionHistory(sessionId, history, levelCompleted);
  },

  updateQuizSessionMode: async (
    sessionId: number,
    sessionMode: "QUIZ_ACTIVE" | "CHAT_REMEDIATION" | "MASTERED" | "FAILED"
  ) => {
    return await quizDB.updateQuizSessionMode(sessionId, sessionMode);
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

  runBatchEvaluation: async (
    sessionId: number,
    kompetensiBabId: number,
    vectors: MicroPayloadVector[],
    wrongStreak: number = 0
  ) => {
    const result = await runRouterAgentEvaluation(sessionId, kompetensiBabId, vectors, wrongStreak);

    let nextQuestions: any[] = [];
    if (result.nextAction === "NEXT_BATCH" && result.nextQuestionIds.length > 0) {
      nextQuestions = await quizRepository.fetchBatchQuestionDetails(result.nextQuestionIds);
    }

    return {
      ...result,
      nextQuestions,
    };
  },

  sendTutorChatMessage: async (
    sessionId: number,
    chatHistory: ChatMessageItem[],
    failedTags: string[] = [],
    contextSummary: string = ""
  ) => {
    return await runTutorAgentChat(sessionId, chatHistory, failedTags, contextSummary);
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
