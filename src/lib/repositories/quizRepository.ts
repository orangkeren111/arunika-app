import * as quizDB from "../services/db/quiz/quizDB";
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

  claimPlayingSlot: async (sessionId: number, kompetensiBabId?: number) => {
    return await quizDB.claimPlayingSlot(sessionId, kompetensiBabId);
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

  getCompetenciesForUjian: async (ujianId: number, siswaId: number, sessionId?: number) => {
    const list = await quizDB.getCompetenciesForUjian(ujianId, siswaId, sessionId);
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
      type: q.type as "MCQ" | "ESSAY",
      text: q.teksSoal,
      options: (q.opsiJawaban as string[]) || [],
      correctAnswer: q.type === "ESSAY" ? (q.jawabanBenarEssay || "") : (q.jawabanBenarMcq || ""),
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
      type: q.type as "MCQ" | "ESSAY",
      text: q.teksSoal,
      options: (q.opsiJawaban as string[]) || [],
      correctAnswer: q.type === "ESSAY" ? (q.jawabanBenarEssay || "") : (q.jawabanBenarMcq || ""),
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
  runBatchEvaluation: async (
    sessionId: number,
    kompetensiBabId: number,
    kompetensiName: string,
    vectors: MicroPayloadVector[],
    evalBatchData: any[]
  ) => {
    const session = await quizDB.getQuizSessionDetail(sessionId);
    const currentStreak = session?.wrongStreak || 0;

    // 1. Pass BOTH vectors and evalBatchData to the router. 
    // The router needs evalBatchData to read the actual essay text and reference answers.
    const result = await runRouterAgentEvaluation(
      sessionId,
      kompetensiBabId,
      vectors,
      evalBatchData, // ADDED: So the agent can grade essays
      currentStreak
    );

    // 2. Retrieve the graded data from the agent (or fallback to original if agent fails)
    // The agent will overwrite 'isCorrect: true' for essays that are conceptually right.
    const gradedBatchData = (result as any).gradedBatchData || evalBatchData;

    // 3. NOW calculate the wrong count accurately based on the AI's grading
    const wrongCount = gradedBatchData.filter((item: any) => !item.isCorrect).length;

    let nextQuestions: any[] = [];
    if (result.nextAction === "NEXT_BATCH" && result.nextQuestionIds.length > 0) {
      nextQuestions = await quizRepository.fetchBatchQuestionDetails(result.nextQuestionIds);
    }

    const competencyLog = {
      siswaId: session?.siswaId,
      ujianId: session?.ujianId,
      competencyId: kompetensiBabId,
      competencyName: kompetensiName,
      status: result.conceptUnderstood ? "FINISHED" : "NOT_FINISHED",
      nextAction: result.nextAction,
      thoughtProcess: result.thoughtProcess,
      agentFeedback: result.feedback,
      failedTags: result.failedTags,
      conceptUnderstood: result.conceptUnderstood,
      evaluationBatch: gradedBatchData, // Save the graded version to history
      timestamp: new Date().toISOString(),
    };

    // Lock Database State based entirely on the Agent's decision
    if (result.nextAction === "MASTERED") {
      await quizDB.updateQuizSessionHistory(sessionId, competencyLog, true);
      await quizDB.updateQuizSessionMode(sessionId, "MASTERED");
    } else if (result.nextAction === "FAIL_SESSION") {
      await quizDB.finishOrFailSession(sessionId, "FAILED", "WRONG_STREAK_EXCEEDED", competencyLog);
      await quizDB.updateQuizSessionMode(sessionId, "FAILED");
    } else {
      await quizDB.updateQuizSessionHistory(sessionId, competencyLog, false);
      if (result.nextAction === "REMEDIATE_CHAT") {
        for (let i = 0; i < wrongCount; i++) {
          await quizDB.incrementWrongStreak(sessionId);
        }
        await quizDB.updateQuizSessionMode(sessionId, "CHAT_REMEDIATION");
      } else {
        await quizDB.updateQuizSessionMode(sessionId, "QUIZ_ACTIVE");
      }
    }

    return {
      ...result,
      nextQuestions,
      wrongCount,
      gradedBatchData, // Return to frontend so it can display correct/incorrect checks for essays
    };
  },

  sendTutorChatMessage: async (
    sessionId: number,
    chatHistory: ChatMessageItem[],
    failedTags: string[] = [],
    contextSummary: string = ""
  ) => {
    const result = await runTutorAgentChat(sessionId, chatHistory, failedTags, contextSummary);
    if (result.resumeQuiz) {
      await quizDB.updateQuizSessionMode(sessionId, "QUIZ_ACTIVE");
    }
    return result;
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