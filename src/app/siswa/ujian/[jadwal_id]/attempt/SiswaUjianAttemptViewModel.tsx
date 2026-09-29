import { ExamQuestion } from "@/src/app/types/siswa";
import { siswaRepository } from "@/src/lib/repositories/siswaRepository";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type ViolationType =
  | "WINDOW_BLUR"
  | "TAB_HIDDEN"
  | "RIGHT_CLICK_ATTEMPT"
  | "COPY_ATTEMPT"
  | "PASTE_ATTEMPT"
  | "INSPECT_ELEMENT_F12"
  | "INSPECT_ELEMENT_SHORTCUT";

export function useExamAttempt(jadwalId: string) {
  // State for the single active question
  const [currentQ, setCurrentQ] = useState<ExamQuestion | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(10);

  // Stores answers, mapped by question ID
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const [timeLeft, setTimeLeft] = useState(90 * 60); // Default fallback 90 mins
  const [loading, setLoading] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [warnings, setWarnings] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");

  const { data: session, status } = useSession();
  const router = useRouter()

  // Handle tab-out (blur) warning and auto-submission
  useEffect(() => {
    if (isFinished || loading || !session) return;

    // Helper to handle both UI warnings and Backend Logging
    const recordViolation = async (violationType: ViolationType) => {
      // 1. Fire and forget to your backend (so it's saved even if they refresh)
      await siswaRepository.handleCheatViolation(
        jadwalId,
        Number(session?.user?.id) || 0,
        violationType,
        Number(currentQ?.id) || 0
      );

      // 2. Update local UI state
      setWarnings((prev) => {
        if (prev >= 3) return prev;
        const nextWarnings = prev + 1;

        if (nextWarnings >= 3) {
          setWarningMessage("Anda telah melakukan pelanggaran 3 kali. Ujian Anda otomatis selesai dan dikumpulkan.");
          setShowWarningModal(true);
          handleSubmitExam();
          return 3;
        } else {
          setWarningMessage(`Peringatan! Terdeteksi aktivitas mencurigakan (${violationType}). Pelanggaran: ${nextWarnings}/3. Pada pelanggaran ke-3, ujian akan otomatis dikumpulkan.`);
          setShowWarningModal(true);
          return nextWarnings;
        }
      });
    };

    // --- EVENT HANDLERS ---

    const handleBlur = () => recordViolation("WINDOW_BLUR");

    const handleVisibilityChange = () => {
      if (document.hidden) recordViolation("TAB_HIDDEN");
    };

    const handleContextMenu = (e: any) => {
      e.preventDefault(); // Blocks right-click menu
      recordViolation("RIGHT_CLICK_ATTEMPT");
    };

    const handleCopy = (e: any) => {
      e.preventDefault(); // Blocks copying question text
      recordViolation("COPY_ATTEMPT");
    };

    const handlePaste = (e: any) => {
      e.preventDefault(); // Blocks pasting answers (e.g., from ChatGPT)
      recordViolation("PASTE_ATTEMPT");
    };

    const handleKeyDown = (e: any) => {
      // Block F12 (Inspect Element)
      if (e.key === "F12") {
        e.preventDefault();
        recordViolation("INSPECT_ELEMENT_F12");
      }
      // Block Ctrl+Shift+I (Inspect) or Ctrl+Shift+J (Console) or Ctrl+U (View Source)
      if (e.ctrlKey && (
        (e.shiftKey && (e.key === "I" || e.key === "i" || e.key === "J" || e.key === "j")) ||
        (e.key === "U" || e.key === "u")
      )) {
        e.preventDefault();
        recordViolation("INSPECT_ELEMENT_SHORTCUT");
      }
    };

    // --- ATTACH LISTENERS ---
    window.addEventListener("blur", handleBlur);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("copy", handleCopy);
    window.addEventListener("paste", handlePaste);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      // --- CLEANUP ---
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("copy", handleCopy);
      window.removeEventListener("paste", handlePaste);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFinished, loading, session]); // Make sure session is in deps

  // 1. Initialize Exam / Resume Exam
  useEffect(() => {
    if (session?.user?.id) {
      const initExam = async () => {
        try {
          const res = await siswaRepository.getExamQuestions(
            jadwalId,
            Number(session.user.id ?? 0),
          );

          if (res && res.nextQuestion) {
            setCurrentQ(res.nextQuestion);
            setCurrentIndex(res.answeredCount || 0);
            if (res.totalQuestions) {
              setTotalQuestions(res.totalQuestions);
            }
            if (res.remainingSeconds) {
              setTimeLeft(res.remainingSeconds);
            }
            if (res.cheatCount) {
              setWarnings(res.cheatCount);
            }
          }
          else {
            setIsFinished(true);
          }
        } catch (error) {
          console.error("Failed to initialize exam:", error);
        } finally {
          setLoading(false);
        }
      };

      initExam();
    }
  }, [jadwalId, session, status]);

  // 2. Timer Management
  useEffect(() => {
    if (isFinished || loading) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isFinished, loading]);

  // 3. Local Answer State
  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  // 4. Submit Answer & Fetch Next Question (Dynamic Progression)
  const nextQuestion = async () => {
    if (!currentQ || !session?.user?.id) return;

    setIsSubmitting(true);

    try {
      const studentAnswer = answers[currentQ.id] || "";

      const response = await siswaRepository.submitExamAttempt(
        jadwalId,
        { [currentQ.id]: studentAnswer },
        Number(session.user.id),
      );

      if (response.finished) {
        setIsFinished(true);
        setCurrentQ(null);
      } else if (response.nextQuestion) {
        setCurrentQ(response.nextQuestion);
        setCurrentIndex((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Failed to submit answer:", error);
      alert("Terjadi kesalahan saat menyimpan jawaban. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Force Finish Exam Early
  const handleSubmitExam = async () => {
    if (!session?.user?.id) return;
    setIsSubmitting(true);

    try {
      const currentAnswer = currentQ ? { [currentQ.id]: answers[currentQ.id] || "" } : {};

      await siswaRepository.submitExamAttempt(
        jadwalId,
        currentAnswer,
        Number(session.user.id),
        undefined,
        true, // isFinish boolean flag sent to backend
      );
      setIsFinished(true);
      setCurrentQ(null);
      router.push(`/siswa/history`);
    } catch (error) {
      console.error("Failed to finish exam:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return {
    currentQ,
    currentIndex,
    totalQuestions,
    answers,
    handleAnswer,
    nextQuestion,
    handleSubmitExam,
    warnings,
    showWarningModal,
    warningMessage,
    dismissWarningModal: () => setShowWarningModal(false),
    timeLeft: formatTime(timeLeft),
    isFinished: isFinished || timeLeft === 0,
    loading: loading || isSubmitting,
    progress: totalQuestions > 0 ? Math.min(100, Math.round(((currentIndex + 1) / totalQuestions) * 100)) : 0,
  };
}
