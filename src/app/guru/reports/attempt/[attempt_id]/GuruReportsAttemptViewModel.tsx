import { guruRepository } from "@/src/lib/repositories/guruRepository";
import { AttemptReport } from "@/src/app/types/guru";
import { useEffect, useState } from "react";

export function useAttemptViewModel(attemptId: string) {
  const [attempt, setAttempt] = useState<AttemptReport | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAttempt = () => {
    setLoading(true);
    guruRepository.getAttempt(attemptId).then((res) => {
      setAttempt(res);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchAttempt();
  }, [attemptId]);

  // Updated to accept the specific answers being graded
  const handleGradeAttempt = async (
    gradedAnswers: {
      jawabanId: number;
      nilaiPoin: number;
      catatanKoreksi: string;
    }[],
  ) => {
    await guruRepository.gradeAttempt(attemptId, gradedAnswers);
    // Re-fetch the attempt to get the updated final score and status from the DB
    fetchAttempt();
  };

  return { attempt, loading, handleGradeAttempt };
}
