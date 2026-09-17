import { useEffect, useState, useRef } from "react";
import { quizRepository } from "@/src/lib/repositories/quizRepository";
import { MicroPayloadVector } from "@/src/lib/services/quiz-agent/routerAgent";
import { ChatMessageItem } from "@/src/lib/services/quiz-agent/tutorAgent";

export interface Competency {
  id: number;
  code: string;
  name: string;
  jumlahSoal: number;
}

export interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: string;
  difficulty?: number;
  bloomLevel?: string;
  tags?: string[];
  linkGambarSoal?: string | null;
}

export type SessionState = "QUIZ" | "CHAT" | "WIN" | "FAIL";

export function useQuizPlayViewModel(
  sessionId: number,
  jadwalId: string,
  targetCompetencyId?: number | null
) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [sessionState, setSessionState] = useState<SessionState>("QUIZ");

  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [currentComp, setCurrentComp] = useState<Competency | null>(null);

  // Active batch questions
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluatedBatch, setEvaluatedBatch] = useState<any[] | null>(null);

  // Agent feedback & state
  const [agentFeedback, setAgentFeedback] = useState("");
  const [failedTags, setFailedTags] = useState<string[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessageItem[]>([]);
  const [chatSending, setChatSending] = useState(false);
  const [levelCompleted, setLevelCompleted] = useState(false);

  // Timers
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 Minutes
  const [showIdlePrompt, setShowIdlePrompt] = useState(false);
  const lastActiveRef = useRef<number>(Date.now());
  const idleTimeoutRef = useRef<any>(null);
  const questionStartTimesRef = useRef<Record<number, number>>({});

  useEffect(() => {
    const initGame = async () => {
      const detail = await quizRepository.getQuizSessionDetail(sessionId);
      if (!detail || detail.status !== "PLAYING") {
        setSessionState("FAIL");
        setLoading(false);
        return;
      }
      setSession(detail);

      const list = await quizRepository.getCompetenciesForUjian(detail.ujianId);
      setCompetencies(list);

      let activeComp: Competency | undefined;
      if (targetCompetencyId) {
        activeComp = list.find((c) => c.id === targetCompetencyId);
      }

      if (!activeComp) {
        const levelIdx = detail.currentLevel - 1;
        if (levelIdx >= list.length) {
          await quizRepository.finishOrFailSession(sessionId, "FINISHED");
          setSessionState("WIN");
          setLoading(false);
          return;
        }
        activeComp = list[levelIdx] || list[0];
      }

      setCurrentComp(activeComp);
      await loadQuestionsForCompetency(activeComp.id);
      setLoading(false);
    };

    initGame();

    const gameTimer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(gameTimer);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const trackActivity = () => {
      lastActiveRef.current = Date.now();
      quizRepository.updateQuizActivity(sessionId);
    };
    window.addEventListener("click", trackActivity);
    window.addEventListener("keydown", trackActivity);

    const afkPoll = setInterval(() => {
      const inactiveMs = Date.now() - lastActiveRef.current;
      if (inactiveMs >= 4.5 * 60 * 1000 && !showIdlePrompt) {
        setShowIdlePrompt(true);
        idleTimeoutRef.current = setTimeout(() => {
          handleAfkKick();
        }, 30000);
      }
    }, 10000);

    return () => {
      clearInterval(gameTimer);
      clearInterval(afkPoll);
      window.removeEventListener("click", trackActivity);
      window.removeEventListener("keydown", trackActivity);
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    };
  }, [sessionId]);

  const loadQuestionsForCompetency = async (compBabId: number, preselected?: Question[]) => {
    if (preselected && preselected.length === 5) {
      setActiveQuestions(preselected);
    } else {
      const selectedIds = await quizRepository.runAgentSelectQuestions(compBabId);
      const allPool = await quizRepository.getQuestionsForCompetency(compBabId);

      if (allPool.length === 0) {
        setActiveQuestions([]);
        return;
      }

      const selectedQ = allPool.filter((q) => selectedIds.includes(q.id));
      const finalBatch = selectedQ.length >= 3 ? selectedQ : allPool.sort(() => 0.5 - Math.random()).slice(0, 5);
      setActiveQuestions(finalBatch);
    }

    setCurrentQIdx(0);
    setUserAnswers({});
    setAgentFeedback("");
    setLevelCompleted(false);
    setEvaluatedBatch(null);

    // Initialize answer start timestamps for micro-payload vectors
    const now = Date.now();
    const timestamps: Record<number, number> = {};
    activeQuestions.forEach((q) => {
      timestamps[q.id] = now;
    });
    questionStartTimesRef.current = timestamps;
  };

  const handleSelectAnswer = (questionId: number, answer: string) => {
    setUserAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleNextQuestion = () => {
    if (currentQIdx < activeQuestions.length - 1) {
      setCurrentQIdx((prev) => prev + 1);
    }
  };

  const handleTimeout = async () => {
    const timeoutLog = {
      siswaId: session?.siswaId,
      ujianId: session?.ujianId,
      competencyId: currentComp?.id,
      competencyName: currentComp?.name,
      status: "NOT_FINISHED",
      reason: "TIME_EXPIRED",
      agentFeedback: agentFeedback || "Waktu sesi kuis telah habis.",
      conceptUnderstood: false,
      timestamp: new Date().toISOString(),
    };
    await quizRepository.finishOrFailSession(sessionId, "FAILED", "TIME_EXPIRED", timeoutLog);
    setSessionState("FAIL");
  };

  const handleAfkKick = async () => {
    const afkLog = {
      siswaId: session?.siswaId,
      ujianId: session?.ujianId,
      competencyId: currentComp?.id,
      competencyName: currentComp?.name,
      status: "NOT_FINISHED",
      reason: "AFK_INACTIVITY",
      agentFeedback: "Pemain tidak aktif (AFK). Sesi dihentikan.",
      conceptUnderstood: false,
      timestamp: new Date().toISOString(),
    };
    await quizRepository.finishOrFailSession(sessionId, "AFK", "AFK_INACTIVITY", afkLog);
    setSessionState("FAIL");
    setShowIdlePrompt(false);
  };

  const handleKeepPlaying = () => {
    setShowIdlePrompt(false);
    lastActiveRef.current = Date.now();
    if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    quizRepository.updateQuizActivity(sessionId);
  };

  const handleSubmitBatch = async () => {
    if (!currentComp) return;
    setEvaluating(true);

    const now = Date.now();
    // Build micro-payload vectors for routerAgent
    const vectors: MicroPayloadVector[] = activeQuestions.map((q) => {
      const studentAns = userAnswers[q.id] || "";
      const isCorrect = studentAns === q.correctAnswer;
      const startTime = questionStartTimesRef.current[q.id] || now;
      const durationS = Math.max(1, Math.round((now - startTime) / 1000));
      const firstTag = q.tags && q.tags.length > 0 ? q.tags[0] : currentComp.name;

      return {
        q_id: q.id,
        bloom: q.bloomLevel || "C1",
        tag: firstTag,
        ok: isCorrect,
        ans_time_s: durationS,
      };
    });

    const evalBatchData = activeQuestions.map((q) => ({
      id: q.id,
      text: q.text,
      options: q.options,
      linkGambarSoal: q.linkGambarSoal || null,
      studentAnswer: userAnswers[q.id] || "",
      correctAnswer: q.correctAnswer,
      isCorrect: userAnswers[q.id] === q.correctAnswer,
      difficulty: q.difficulty || 5,
      bloomLevel: q.bloomLevel || "C1",
    }));

    setEvaluatedBatch(evalBatchData);

    const wrongCount = vectors.filter((v) => !v.ok).length;
    const currentStreak = (session?.wrongStreak || 0) + wrongCount;

    // Call routerAgent via repository
    const result = await quizRepository.runBatchEvaluation(
      sessionId,
      currentComp.id,
      vectors,
      currentStreak
    );

    setAgentFeedback(result.feedback);
    setFailedTags(result.failedTags);

    const competencyLog = {
      siswaId: session?.siswaId,
      ujianId: session?.ujianId,
      competencyId: currentComp.id,
      competencyName: currentComp.name,
      status: result.conceptUnderstood ? "FINISHED" : "NOT_FINISHED",
      nextAction: result.nextAction,
      agentFeedback: result.feedback,
      failedTags: result.failedTags,
      conceptUnderstood: result.conceptUnderstood,
      evaluationBatch: evalBatchData,
      timestamp: new Date().toISOString(),
    };

    if (result.nextAction === "MASTERED") {
      setLevelCompleted(true);
      await quizRepository.updateQuizSessionHistory(sessionId, competencyLog, true);

      if (targetCompetencyId) {
        setSessionState("WIN");
        setEvaluating(false);
        return;
      }

      const nextLevel = session.currentLevel + 1;
      const finishedAll = nextLevel > competencies.length;

      if (finishedAll) {
        await quizRepository.finishOrFailSession(
          sessionId,
          "FINISHED",
          "ALL_COMPETENCIES_MASTERED",
          competencyLog
        );
        setSessionState("WIN");
      } else {
        // Mastered current level, prompt user or auto proceed to next level
        setSessionState("WIN");
      }
    } else if (result.nextAction === "REMEDIATE_CHAT") {
      await quizRepository.updateQuizSessionHistory(sessionId, competencyLog, false);
      for (let i = 0; i < wrongCount; i++) {
        await quizRepository.incrementWrongStreak(sessionId);
      }

      // Initialize chat drawer with Captain Chili's opening feedback
      const initialMessage: ChatMessageItem = {
        role: "tutor",
        text: `🦫 ${result.feedback} Mari kita bahas topik "${result.failedTags.join(", ") || currentComp.name}" bersama Kapten Chili!`,
      };
      setChatMessages([initialMessage]);
      setSessionState("CHAT");
    } else if (result.nextAction === "FAIL_SESSION") {
      await quizRepository.finishOrFailSession(
        sessionId,
        "FAILED",
        "WRONG_STREAK_EXCEEDED",
        competencyLog
      );
      setSessionState("FAIL");
    } else {
      // NEXT_BATCH
      await quizRepository.updateQuizSessionHistory(sessionId, competencyLog, false);
      if (result.nextQuestions && result.nextQuestions.length === 5) {
        await loadQuestionsForCompetency(currentComp.id, result.nextQuestions);
      } else {
        await loadQuestionsForCompetency(currentComp.id);
      }
      setSessionState("QUIZ");
    }

    setEvaluating(false);
  };

  const handleSendMessage = async (userText: string) => {
    if (!userText.trim() || chatSending) return;
    setChatSending(true);

    const updatedHistory: ChatMessageItem[] = [
      ...chatMessages,
      { role: "user", text: userText },
    ];
    setChatMessages(updatedHistory);

    const tutorResult = await quizRepository.sendTutorChatMessage(
      sessionId,
      updatedHistory,
      failedTags,
      `Competency: ${currentComp?.name || ""}`
    );

    const finalHistory: ChatMessageItem[] = [
      ...updatedHistory,
      { role: "tutor", text: tutorResult.text },
    ];
    setChatMessages(finalHistory);
    setChatSending(false);

    if (tutorResult.resumeQuiz) {
      setSessionState("QUIZ");
      if (currentComp) {
        await loadQuestionsForCompetency(currentComp.id);
      }
    }
  };

  const handleManualResumeQuiz = () => {
    setSessionState("QUIZ");
  };

  const handleProceedToNextLevel = async () => {
    if (targetCompetencyId) {
      setSessionState("WIN");
      return;
    }
    setLoading(true);
    const updatedDetail = await quizRepository.getQuizSessionDetail(sessionId);
    if (!updatedDetail) {
      setLoading(false);
      return;
    }
    setSession(updatedDetail);

    const levelIdx = updatedDetail.currentLevel - 1;
    if (levelIdx >= competencies.length) {
      setSessionState("WIN");
      setLoading(false);
      return;
    }

    const activeComp = competencies[levelIdx];
    setCurrentComp(activeComp);
    setSessionState("QUIZ");
    await loadQuestionsForCompetency(activeComp.id);
    setLoading(false);
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return {
    loading,
    session,
    sessionState,
    competencies,
    currentComp,
    activeQuestions,
    userAnswers,
    currentQIdx,
    evaluating,
    agentFeedback,
    evaluatedBatch,
    failedTags,
    chatMessages,
    chatSending,
    levelCompleted,
    timeLeft: formatTimer(timeLeft),
    showIdlePrompt,
    handleSelectAnswer,
    handleNextQuestion,
    handleSubmitBatch,
    handleSendMessage,
    handleManualResumeQuiz,
    handleProceedToNextLevel,
    handleKeepPlaying,
  };
}
