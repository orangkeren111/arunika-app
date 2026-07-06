import { ExamQuestion } from "@/src/app/types/siswa";
import { siswaRepository } from "@/src/lib/repositories/siswaRepository";
import { useEffect, useState } from "react";

export function useExamAttempt(jadwalId: string) {
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(90 * 60); // 90 Menit
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    siswaRepository.getExamQuestions(jadwalId).then((res) => {
      setQuestions(res);
      setLoading(false);
    });
  }, [jadwalId]);

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
  };

  const prevQuestion = () => {
    if (currentIndex > 0) setCurrentIndex((prev) => prev - 1);
  };

  const handleSubmitExam = async () => {
    return siswaRepository.submitExamAttempt(jadwalId, answers);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return {
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
