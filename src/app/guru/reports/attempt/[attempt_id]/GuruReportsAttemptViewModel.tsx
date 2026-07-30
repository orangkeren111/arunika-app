import { guruRepository } from "@/src/lib/repositories/guruRepository";
import { reportRepository } from "@/src/lib/repositories/reportRepository";
import { ReportProps } from "@/src/app/types/report";
import { AttemptReport } from "@/src/app/types/guru";
import { useEffect, useState } from "react";

export function useAttemptViewModel(attemptId: string) {
  const [attempt, setAttempt] = useState<AttemptReport | null>(null);
  const [reportData, setReportData] = useState<ReportProps | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAttempt = () => {
    setLoading(true);
    Promise.all([
      guruRepository.getAttempt(attemptId),
      reportRepository.fetchReportDataForStudent(Number(attemptId)).catch(() => null)
    ]).then(([res, report]) => {
      setAttempt(res);
      setReportData(report);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchAttempt();
  }, [attemptId]);

  const handleGradeAttempt = async (
    gradedAnswers: {
      jawabanId: number;
      nilaiPoin: number;
      catatanKoreksi: string;
    }[],
  ) => {
    await guruRepository.gradeAttempt(attemptId, gradedAnswers);
    fetchAttempt();
  };

  return { attempt, reportData, loading, handleGradeAttempt };
}
