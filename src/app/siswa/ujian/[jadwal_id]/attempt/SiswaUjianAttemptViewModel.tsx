import { ExamQuestion } from "@/src/app/types/siswa";
import { siswaRepository } from "@/src/lib/repositories/siswaRepository";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export function useExamAttempt(jadwalId: string, maxQuestions: number = 40) {
  // State for the single active question
  const [currentQ, setCurrentQ] = useState<ExamQuestion | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0); // Tracks Question 1, 2, 3...

  // Stores answers, mapped by question ID
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const [timeLeft, setTimeLeft] = useState(90 * 60); // 90 Menit
  const [loading, setLoading] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [warnings, setWarnings] = useState(0);

  const { data: session, status } = useSession();

  // Handle tab-out (blur) warning and auto-submission
  useEffect(() => {
    if (isFinished || loading) return;

    const handleBlur = () => {
      setWarnings((prev) => {
        const nextWarnings = prev + 1;
        if (nextWarnings >= 3) {
          alert("Anda telah keluar dari halaman ujian sebanyak 3 kali. Ujian Anda otomatis selesai dan dikumpulkan.");
          handleSubmitExam();
          return 3;
        } else {
          alert(`Peringatan! Dilarang membuka tab lain atau keluar dari halaman ujian. Pelanggaran: ${nextWarnings}/3. Pada pelanggaran ke-3, ujian akan otomatis dikumpulkan.`);
          return nextWarnings;
        }
      });
    };

    window.addEventListener("blur", handleBlur);
    return () => {
      window.removeEventListener("blur", handleBlur);
    };
  }, [isFinished, loading, session]);

  // 1. Initialize Exam / Resume Exam
  useEffect(() => {
    // Wait until session is loaded to ensure we have the siswaId
    if (session?.user?.id) {
      const initExam = async () => {
        try {
          const res = await siswaRepository.getExamQuestions(
            jadwalId,
            Number(session.user.id ?? 0),
          );

          if (res && res.length > 0) {
            setCurrentQ(res[0]);
            // If resuming, you might want to fetch the actual count from the backend,
            // but for now, we start at 0 or derive from a custom endpoint if needed.
          } else {
            // No questions returned usually means the exam is already finished
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
          handleSubmitExam(); // Auto-submit when time runs out
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

      // Submit the current answer. The backend calculates ELO and returns the next question.
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
      // Passing empty answers signals the backend to force finish the session
      await siswaRepository.submitExamAttempt(
        jadwalId,
        {},
        Number(session.user.id),
      );
      setIsFinished(true);
      setCurrentQ(null);
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
    answers,
    handleAnswer,
    nextQuestion,
    handleSubmitExam,
    warnings,
    timeLeft: formatTime(timeLeft),
    isFinished: isFinished || timeLeft === 0,
    loading: loading || isSubmitting,
    // Calculate progress based on a known max questions length
    progress: Math.round((currentIndex / maxQuestions) * 100),
  };
}
