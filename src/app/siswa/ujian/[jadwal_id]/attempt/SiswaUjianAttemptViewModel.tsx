import { ExamQuestion } from "@/src/app/types/siswa";
import { siswaRepository } from "@/src/lib/repositories/siswaRepository";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export function useExamAttempt(jadwalId: string) {
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(90 * 60); // 90 Menit
  const [loading, setLoading] = useState(true);
  const [currentQ, setCurrentQ] = useState<ExamQuestion | null>(null);
  const { data: session, status } = useSession();

  useEffect(() => {
    siswaRepository.getExamQuestions(jadwalId).then((res) => {
      console.log(res);

      setQuestions(res);
      setCurrentQ(questions[currentIndex]);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1)
      setCurrentIndex((prev) => prev + 1);
    setCurrentQ(questions[currentIndex]);
  };

  const prevQuestion = () => {
    if (currentIndex > 0) setCurrentIndex((prev) => prev - 1);
    setCurrentQ(questions[currentIndex]);
  };

  const handleSubmitExam = async () => {
    return siswaRepository.submitExamAttempt(
      jadwalId,
      answers,
      Number(session?.user.id ?? 0),
    );
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
    questions,
    currentIndex,
    setCurrentIndex,
    answers,
    handleAnswer,
    nextQuestion,
    prevQuestion,
    handleSubmitExam,
    timeLeft: formatTime(timeLeft),
    isFinished: timeLeft === 0,
    loading,
    progress:
      questions.length > 0
        ? Math.round((Object.keys(answers).length / questions.length) * 100)
        : 0,
  };
}
