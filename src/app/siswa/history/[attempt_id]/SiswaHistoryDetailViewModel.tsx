import { reportRepository } from "@/src/lib/repositories/reportRepository";
import { ReportProps } from "@/src/app/types/report";
import { useEffect, useState } from "react";

export function useStudentReportViewModel(attemptId: string) {
  const [reportData, setReportData] = useState<ReportProps>();
  useEffect(() => {
    reportRepository
      .fetchReportDataForStudent(Number(attemptId))
      .then((res) => {
        setReportData(res);
      });
  }, []);

  return { reportData };
}
