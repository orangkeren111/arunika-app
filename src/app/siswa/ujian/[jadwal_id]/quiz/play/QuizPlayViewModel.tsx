import { useEffect, useState, useRef } from "react";
import { quizRepository } from "@/src/lib/repositories/quizRepository";

interface Competency {
  id: number;
  code: string;
  name: string;
  jumlahSoal: number;
}

interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: string;
}

export function useQuizPlayViewModel(
  sessionId: number,
  jadwalId: string,
  targetCompetencyId?: number | null
) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [currentComp, setCurrentComp] = useState<Competency | null>(null);

  // Active batch questions
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [evaluating, setEvaluating] = useState(false);

  // Agent feedback & outcomes
  const [agentFeedback, setAgentFeedback] = useState("");
  const [levelCompleted, setLevelCompleted] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameOutcome, setGameOutcome] = useState<"WIN" | "FAIL" | "AFK" | null>(null);

  // Timers
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 Minutes (900 seconds)
  const [showIdlePrompt, setShowIdlePrompt] = useState(false);
  const lastActiveRef = useRef<number>(Date.now());
  const idleTimeoutRef = useRef<any>(null);

  useEffect(() => {
    const initGame = async () => {
      // 1. Fetch Session details
      const detail = await quizRepository.getQuizSessionDetail(sessionId);
      if (!detail || detail.status !== "PLAYING") {
        setIsGameOver(true);
        setGameOutcome((detail?.status as any) || "FAIL");
        setLoading(false);
        return;
      }
      setSession(detail);

      // 2. Fetch enabled competencies
      const list = await quizRepository.getCompetenciesForUjian(detail.ujianId);
      setCompetencies(list);

      // Resolve targeted competency or fallback to current session level
      let activeComp: Competency | undefined;
      if (targetCompetencyId) {
        activeComp = list.find((c) => c.id === targetCompetencyId);
      }

      if (!activeComp) {
        const levelIdx = detail.currentLevel - 1;
        if (levelIdx >= list.length) {
          // Already cleared all levels!
          await quizRepository.finishOrFailSession(sessionId, "FINISHED");
          setGameOutcome("WIN");
          setIsGameOver(true);
          setLoading(false);
          return;
        }
        activeComp = list[levelIdx] || list[0];
      }

      setCurrentComp(activeComp);

      // 3. Load active batch questions
      await loadQuestionsForCompetency(activeComp.id);
      setLoading(false);
    };

    initGame();

    // Start 15 minutes overall game timer
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

    // Track user activity for AFK checks
    const trackActivity = () => {
      lastActiveRef.current = Date.now();
      quizRepository.updateQuizActivity(sessionId);
    };
    window.addEventListener("click", trackActivity);
    window.addEventListener("keydown", trackActivity);

    // AFK Polling interval
    const afkPoll = setInterval(() => {
      const inactiveMs = Date.now() - lastActiveRef.current;
      if (inactiveMs >= 4.5 * 60 * 1000 && !showIdlePrompt) {
        // Show idle warning
        setShowIdlePrompt(true);

        // Give 30 seconds to respond, otherwise kick
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

  const [seenQuestionIds, setSeenQuestionIds] = useState<number[]>([]);
  const [evaluatedBatch, setEvaluatedBatch] = useState<any[] | null>(null);

  const loadQuestionsForCompetency = async (compBabId: number, currentSeen: number[] = []) => {
    const selectedIds = await quizRepository.runAgentSelectQuestions(compBabId);
    const allPool = await quizRepository.getQuestionsForCompetency(compBabId);

    if (allPool.length === 0) {
      setActiveQuestions([]);
      return;
    }

    // Prefer questions that haven't been seen yet in this competency session
    let unseenPool = allPool.filter((q) => !currentSeen.includes(q.id));
    if (unseenPool.length < 5) {
      unseenPool = allPool; // Fallback to entire pool if unseen is exhausted
    }

    const selectedQ = unseenPool.filter((q) => selectedIds.includes(q.id));
    const finalBatch = selectedQ.length >= 3 ? selectedQ : unseenPool.sort(() => 0.5 - Math.random()).slice(0, 5);

    setActiveQuestions(finalBatch);
    setSeenQuestionIds((prev) => Array.from(new Set([...prev, ...finalBatch.map((q) => q.id)])));
    setCurrentQIdx(0);
    setUserAnswers({});
    setAgentFeedback("");
    setLevelCompleted(false);
    setEvaluatedBatch(null);
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
    setGameOutcome("FAIL");
    setIsGameOver(true);
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
    setGameOutcome("AFK");
    setIsGameOver(true);
    setShowIdlePrompt(false);
  };

  const handleKeepPlaying = () => {
    setShowIdlePrompt(false);
    lastActiveRef.current = Date.now();
    if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    quizRepository.updateQuizActivity(sessionId);
  };

  const handleSubmitBatch = async () => {
    setEvaluating(true);

    const evaluationData = activeQuestions.map((q) => {
      const studentAnswer = userAnswers[q.id] || "";
      const isCorrect = studentAnswer === q.correctAnswer;
      return {
        id: q.id,
        text: q.text,
        options: q.options,
        studentAnswer,
        correctAnswer: q.correctAnswer,
        isCorrect,
        difficulty: (q as any).difficulty || 5,
        bloomLevel: (q as any).bloomLevel || "C1",
      };
    });

    // 1. Evaluate answers via Agent
    const result = await quizRepository.runAgentEvaluateAnswers(evaluationData);
    setAgentFeedback(result.feedback);
    setEvaluatedBatch(evaluationData);

    // 2. Count incorrect answers
    const wrongCount = evaluationData.filter((q) => !q.isCorrect).length;
    const currentStreak = (session?.wrongStreak || 0) + wrongCount;

    // Create structured competency log
    const competencyLog = {
      siswaId: session?.siswaId,
      ujianId: session?.ujianId,
      competencyId: currentComp?.id,
      competencyName: currentComp?.name,
      status: result.conceptUnderstood ? "FINISHED" : "NOT_FINISHED",
      reason: result.conceptUnderstood
        ? "CONCEPT_MASTERED"
        : currentStreak >= 5
        ? "WRONG_STREAK_EXCEEDED"
        : "NEEDS_MORE_PRACTICE",
      agentFeedback: result.feedback,
      conceptUnderstood: result.conceptUnderstood,
      evaluationBatch: evaluationData,
      timestamp: new Date().toISOString(),
    };

    if (result.conceptUnderstood) {
      setLevelCompleted(true);
      const nextLevel = session.currentLevel + 1;
      const finishedAll = nextLevel > competencies.length;

      await quizRepository.updateQuizSessionHistory(sessionId, competencyLog, true);

      if (finishedAll) {
        await quizRepository.finishOrFailSession(
          sessionId,
          "FINISHED",
          "ALL_COMPETENCIES_MASTERED",
          competencyLog
        );
        setGameOutcome("WIN");
        setIsGameOver(true);
      }
    } else {
      if (currentStreak >= 5) {
        await quizRepository.finishOrFailSession(
          sessionId,
          "FAILED",
          "WRONG_STREAK_EXCEEDED",
          competencyLog
        );
        setGameOutcome("FAIL");
        setIsGameOver(true);
      } else {
        // Log current attempt in history without levelling up
        await quizRepository.updateQuizSessionHistory(sessionId, competencyLog, false);
        for (let i = 0; i < wrongCount; i++) {
          await quizRepository.incrementWrongStreak(sessionId);
        }
        setSession((prev: any) => ({ ...prev, wrongStreak: currentStreak }));
      }
    }

    setEvaluating(false);
  };

  const handleRetryBatch = async () => {
    if (!currentComp) return;
    setLoading(true);
    await loadQuestionsForCompetency(currentComp.id, seenQuestionIds);
    setLoading(false);
  };

  const handleProceedToNextLevel = async () => {
    setLoading(true);
    const updatedDetail = await quizRepository.getQuizSessionDetail(sessionId);
    if (!updatedDetail) {
      setLoading(false);
      return;
    }
    setSession(updatedDetail);

    const levelIdx = updatedDetail.currentLevel - 1;
    if (levelIdx >= competencies.length) {
      setGameOutcome("WIN");
      setIsGameOver(true);
      setLoading(false);
      return;
    }

    const activeComp = competencies[levelIdx];
    setCurrentComp(activeComp);
    setSeenQuestionIds([]);
    await loadQuestionsForCompetency(activeComp.id, []);
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
    competencies,
    currentComp,
    activeQuestions,
    userAnswers,
    currentQIdx,
    evaluating,
    agentFeedback,
    evaluatedBatch,
    levelCompleted,
    isGameOver,
    gameOutcome,
    timeLeft: formatTimer(timeLeft),
    showIdlePrompt,
    handleSelectAnswer,
    handleNextQuestion,
    handleSubmitBatch,
    handleRetryBatch,
    handleProceedToNextLevel,
    handleKeepPlaying,
  };
}
