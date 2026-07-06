import { siswaRepository } from "@/src/lib/repositories/siswaRepository";
import { ExamHistoryDetail } from "@/src/app/types/siswa";
import { useEffect, useState } from "react";

export function useHistoryDetail(attemptId: string) {
  const [detail, setDetail] = useState<ExamHistoryDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    siswaRepository.getHistoryDetail(attemptId).then(res => {
      setDetail(res);
      setLoading(false);
    });
  }, [attemptId]);

  return { detail, loading };
}