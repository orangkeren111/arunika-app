"use client";

import { useState, useEffect, useRef } from "react";
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
  type?: "MCQ" | "ESSAY";
  text: string;
  options: string[];
  correctAnswer: string;
  difficulty?: number;
  bloomLevel?: string;
  tags?: string[];
  linkGambarSoal?: string | null;
}

export type SessionState = "QUIZ" | "CHAT" | "WIN" | "FAIL";
export type ReviewStep = "THOUGHTS" | "RESULTS";

export function useQuizPlayViewModel(
  sessionId: number,
  jadwalId: string,
  targetCompetencyId?: number | null
) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [sessionState, setSessionState] = useState<SessionState>("QUIZ");

  const [currentComp, setCurrentComp] = useState<Competency | null>(null);

  // Active batch questions
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluatedBatch, setEvaluatedBatch] = useState<any[] | null>(null);

  // Agent review workflow
  const [reviewStep, setReviewStep] = useState<ReviewStep>("THOUGHTS");
  const [pendingPostReviewAction, setPendingPostReviewAction] = useState<{
    nextAction: "NEXT_BATCH" | "REMEDIATE_CHAT" | "MASTERED" | "FAIL_SESSION";
    thoughtProcess: string;
    nextQuestions?: any[];
    wrongCount: number;
  } | null>(null);

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

      let activeComp: Competency | null = null;

      if (targetCompetencyId) {
        // Fetch specific competency if target is provided
        const compInfo = await quizRepository.getCompetencyById(targetCompetencyId);
        if (compInfo) {
          activeComp = { ...compInfo, jumlahSoal: 5 }; // Fallback jumlahSoal if needed
        }
      } else {
        // Fetch the competency based on the user's current level in the session
        const compInfo = await quizRepository.getCompetencyById(detail.currentLevel);
        if (compInfo) {
          activeComp = { ...compInfo, jumlahSoal: 5 };
        }
      }

      if (!activeComp) {
        // If no active comp could be resolved, the student might have finished all levels
        await quizRepository.finishOrFailSession(sessionId, "FINISHED");
        setSessionState("WIN");
        setLoading(false);
        return;
      }

      setCurrentComp(activeComp);
      await loadQuestionsForCompetency(activeComp.id);

      // Sync UI if the user reloads the page during a specific phase
      if (detail.sessionMode === "CHAT_REMEDIATION") {
        setSessionState("CHAT");
      } else if (detail.sessionMode === "MASTERED") {
        setSessionState("WIN");
      } else if (detail.sessionMode === "FAILED") {
        setSessionState("FAIL");
      }

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
      const allPool = await quizRepository.getQuestionsForCompetency(compBabId);
      if (allPool.length === 0) {
        setActiveQuestions([]);
        return;
      }
      const finalBatch = allPool.sort(() => 0.5 - Math.random()).slice(0, 5);
      setActiveQuestions(finalBatch);
    }

    setCurrentQIdx(0);
    setUserAnswers({});
    setAgentFeedback("");
    setLevelCompleted(false);
    setEvaluatedBatch(null);
    setPendingPostReviewAction(null);
    setReviewStep("THOUGHTS");

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
    await quizRepository.finishOrFailSession(sessionId, "FAILED", "TIME_EXPIRED");
    setSessionState("FAIL");
  };

  const handleAfkKick = async () => {
    await quizRepository.finishOrFailSession(sessionId, "AFK", "AFK_INACTIVITY");
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

    // Pass ALL data to the Router Agent, including raw text for Essay evaluation
    const vectors: MicroPayloadVector[] = activeQuestions.map((q) => {
      const studentAns = (userAnswers[q.id] || "").trim();

      // MCQ is still auto-graded by frontend to save LLM tokens. 
      // ESSAY is marked as 'false' initially; the Agent will evaluate and override this.
      const isCorrect = q.type === "ESSAY" ? false : studentAns === q.correctAnswer;

      const startTime = questionStartTimesRef.current[q.id] || now;
      const durationS = Math.max(1, Math.round((now - startTime) / 1000));
      const firstTag = q.tags && q.tags.length > 0 ? q.tags[0] : currentComp.name;

      return {
        q_id: q.id,
        type: q.type || "MCQ",
        bloom: q.bloomLevel || "C1",
        tag: firstTag,
        student_answer: studentAns,
        reference_answer: q.correctAnswer,
        ok: isCorrect, // Agent will recalculate this if type === 'ESSAY'
        ans_time_s: durationS,
      } as any; // Type asserted as 'any' here temporarily. Update your MicroPayloadVector interface on the backend!
    });

    const evalBatchData = activeQuestions.map((q) => {
      const studentAns = (userAnswers[q.id] || "").trim();
      return {
        ...q,
        studentAnswer: studentAns,
        isCorrect: false, // Will be updated by Agent's response
        correctAnswer: q.correctAnswer,
        difficulty: q.difficulty || 5,
        bloomLevel: q.bloomLevel || "C1",
      };
    });


    // Backend takes full control of state mutation AND Essay Grading
    const result = await quizRepository.runBatchEvaluation(
      sessionId,
      currentComp.id,
      currentComp.name,
      vectors,
      evalBatchData
    );

    // Merge the Agent's final graded array (which includes essay grades) back into the UI
    if (result.gradedBatchData) {
      setEvaluatedBatch(result.gradedBatchData);
    } else {
      // Fallback if backend doesn't return the graded array
      setEvaluatedBatch(evalBatchData);
    }

    setAgentFeedback(result.feedback);
    setFailedTags(result.failedTags);
    setReviewStep("THOUGHTS");

    setPendingPostReviewAction({
      nextAction: result.nextAction,
      thoughtProcess: result.thoughtProcess,
      nextQuestions: result.nextQuestions,
      wrongCount: result.wrongCount,
    });

    setEvaluating(false);
  };

  const handleContinueAfterReview = async () => {
    if (!pendingPostReviewAction || !currentComp) return;
    const { nextQuestions } = pendingPostReviewAction;

    // FETCH ABSOLUTE TRUTH FROM BACKEND
    const updatedSession = await quizRepository.getQuizSessionDetail(sessionId);
    if (!updatedSession) return;

    setSession(updatedSession);
    setPendingPostReviewAction(null);
    setReviewStep("THOUGHTS");

    // Route UI purely based on DB sessionMode updated by the Router Agent
    if (updatedSession.sessionMode === "MASTERED") {
      setLevelCompleted(true);
      setSessionState("WIN");
    } else if (updatedSession.sessionMode === "CHAT_REMEDIATION") {
      const initialMessage: ChatMessageItem = {
        role: "tutor",
        text: `🦫 ${agentFeedback} Mari kita bahas topik "${failedTags.join(", ") || currentComp.name}" bersama Kapten Chili!`,
      };
      setChatMessages([initialMessage]);
      setSessionState("CHAT");
    } else if (updatedSession.sessionMode === "FAILED") {
      setSessionState("FAIL");
    } else {
      // QUIZ_ACTIVE / NEXT_BATCH
      if (nextQuestions && nextQuestions.length === 5) {
        await loadQuestionsForCompetency(currentComp.id, nextQuestions);
      } else {
        await loadQuestionsForCompetency(currentComp.id);
      }
      setSessionState("QUIZ");
    }
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

    // Tutor Agent has absolute authority to release the student
    if (tutorResult.resumeQuiz) {
      setSessionState("QUIZ");
      if (currentComp) {
        await loadQuestionsForCompetency(currentComp.id);
      }
    }
  };

  const handleProceedToNextLevel = async () => {
    // Note: Because the frontend no longer calculates 'next level', 
    // this logic should ideally be handled by returning to a lobby 
    // or relying on a backend route to advance the session.
    // For now, if they click proceed, we'll route them to WIN or back to lobby.
    setSessionState("WIN");
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
    reviewStep,
    setReviewStep,
    timeLeft: formatTimer(timeLeft),
    showIdlePrompt,
    handleSelectAnswer,
    handleNextQuestion,
    handleSubmitBatch,
    handleSendMessage,
    handleProceedToNextLevel,
    handleKeepPlaying,
    handleContinueAfterReview,
    pendingPostReviewAction,
  };
}
