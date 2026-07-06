import { siswaRepository } from "@/src/lib/repositories/siswaRepository";
import { ExamHistoryDetail } from "@/src/app/types/siswa";
import { useEffect, useState } from "react";

export function useSiswaHistory() {
  const [history, setHistory] = useState<ExamHistoryDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    siswaRepository.getHistoryList().then(res => {
      setHistory(res);
      setLoading(false);
    });
  }, []);

  return { history, loading };
}