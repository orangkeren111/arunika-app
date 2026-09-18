import { useEffect, useState, useRef } from "react";
import { quizRepository } from "@/src/lib/repositories/quizRepository";
import { useSession } from "next-auth/react";

interface LobbyQuestion {
  id: number;
  text: string;
  options: string[];
  correctAnswer: string;
}

export function useQuizLobbyViewModel(jadwalId: string, ujianId: number, siswaId: number) {
  const [loading, setLoading] = useState(true);
  const [activeSessions, setActiveSessions] = useState(0);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [sessionStatus, setSessionStatus] = useState<string>("WAITING");

  // Lobby mini-game states
  const [lobbyQuestions, setLobbyQuestions] = useState<LobbyQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);

  // Popup slot open state
  const [slotClaimed, setSlotClaimed] = useState(false);
  const [dismissedModal, setDismissedModal] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const [competencies, setCompetencies] = useState<any[]>([]);
  const { data: userSession } = useSession()

  useEffect(() => {
    let isMounted = true;

    const initLobby = async () => {
      try {
        const [count, session, questions] = await Promise.all([
          quizRepository.getActiveSessionsCount(ujianId),
          quizRepository.joinOrRegisterQueue(siswaId, ujianId),
          quizRepository.getLobbyQuizQuestions(ujianId),
        ]);

        const compList = await quizRepository.getCompetenciesForUjian(ujianId, Number(userSession?.user?.id), session.id);

        if (isMounted) {
          setActiveSessions(count);
          setSessionId(session.id);
          setSessionStatus(session.status);
          setLobbyQuestions(questions);
          setCompetencies(compList);

          // Check if slot can be claimed immediately on init
          if (session.status === "WAITING") {
            const claimed = await quizRepository.claimPlayingSlot(session.id);
            if (claimed && isMounted) {
              setSessionStatus("PLAYING");
              setSlotClaimed(true);
            }
          } else if (session.status === "PLAYING") {
            setSlotClaimed(true);
          }

          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to initialize lobby:", err);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initLobby();

    return () => {
      isMounted = false;
    };
  }, [ujianId, siswaId]);

  // Queue Slot Polling
  useEffect(() => {
    if (!sessionId || sessionStatus !== "WAITING" || slotClaimed) return;

    const interval = setInterval(async () => {
      // Update session activity to prevent getting kicked while waiting
      await quizRepository.updateQuizActivity(sessionId);

      // Check count
      const count = await quizRepository.getActiveSessionsCount(ujianId);
      setActiveSessions(count);

      // Attempt to claim slot
      const claimed = await quizRepository.claimPlayingSlot(sessionId);
      if (claimed) {
        setSessionStatus("PLAYING");
        setSlotClaimed(true);
        setDismissedModal(false);
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [sessionId, sessionStatus, ujianId, slotClaimed]);

  const handleSelectAnswer = (questionId: number, option: string) => {
    setUserAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleSelectCompetency = async (competencyId: number) => {
    const session = await quizRepository.joinOrRegisterQueue(siswaId, ujianId);

    // Check if slot can be claimed immediately on init
    if (session.status === "WAITING") {
      const claimed = await quizRepository.claimPlayingSlot(session.id, competencyId);
      if (claimed) {
        window.location.href = `/siswa/ujian/${jadwalId}/quiz/play?sessionId=${session.id}&competencyId=${competencyId}`;
      }
    } else if (session.status === "PLAYING") {
      await quizRepository.claimPlayingSlot(session.id, competencyId);
      window.location.href = `/siswa/ujian/${jadwalId}/quiz/play?sessionId=${session.id}&competencyId=${competencyId}`;
    }
  };

  const handleNextQuestion = () => {
    if (currentQIndex < lobbyQuestions.length - 1) {
      setCurrentQIndex((prev) => prev + 1);
    } else {
      setShowResults(true);
    }
  };

  const handleResetLobbyGame = async () => {
    const questions = await quizRepository.getLobbyQuizQuestions(ujianId);
    setLobbyQuestions(questions);
    setCurrentQIndex(0);
    setUserAnswers({});
    setShowResults(false);
  };

  const handleCheckRoomAvailability = async () => {
    if (checkingAvailability) return;
    setCheckingAvailability(true);
    try {
      if (sessionId) {
        await quizRepository.updateQuizActivity(sessionId);
      }
      const count = await quizRepository.getActiveSessionsCount(ujianId);
      setActiveSessions(count);

      if (sessionId) {
        // Attempt to claim playing slot or verify active playing status
        const claimed = await quizRepository.claimPlayingSlot(sessionId);
        if (claimed || sessionStatus === "PLAYING") {
          setSessionStatus("PLAYING");
          setSlotClaimed(true);
          setDismissedModal(false); // Force show popup modal so user can choose competency
        }
      }
    } catch (err) {
      console.error("Failed checking availability:", err);
    } finally {
      setTimeout(() => {
        setCheckingAvailability(false);
      }, 1000);
    }
  };

  const handleCloseClaimModal = () => {
    setDismissedModal(true);
  };

  return {
    loading,
    activeSessions,
    sessionId,
    sessionStatus,
    competencies,
    lobbyQuestions,
    currentQIndex,
    userAnswers,
    showResults,
    slotClaimed: slotClaimed && !dismissedModal,
    checkingAvailability,
    handleSelectAnswer,
    handleNextQuestion,
    handleResetLobbyGame,
    handleCheckRoomAvailability,
    handleCloseClaimModal,
    handleSelectCompetency
  };
}
