import { guruRepository } from "@/src/lib/repositories/guruRepository";
import { AttemptReport } from "@/src/app/types/guru";
import { useEffect, useState } from "react";

export function useAttemptViewModel(attemptId: string) {
  const [attempt, setAttempt] = useState<AttemptReport | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAttempt = () => {
    setLoading(true);
    guruRepository.getAttempt(attemptId).then(res => {
      setAttempt(res);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchAttempt();
  }, [attemptId]);

  const handleGradeAttempt = async (score: number, feedback: string) => {
    await guruRepository.gradeAttempt(attemptId, score, feedback);
    fetchAttempt();
  };

  return { attempt, loading, handleGradeAttempt };
}