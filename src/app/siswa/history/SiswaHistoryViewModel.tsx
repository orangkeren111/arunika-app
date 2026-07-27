import { siswaRepository } from "@/src/lib/repositories/siswaRepository";
import { ExamHistoryDetail } from "@/src/app/types/siswa";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export function useSiswaHistory() {
  const [history, setHistory] = useState<ExamHistoryDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: session, status } = useSession();

  useEffect(() => {
    siswaRepository
      .getHistoryList(Number(session?.user.id ?? 0))
      .then((res) => {
        setHistory(res);
        setLoading(false);
      });
  }, []);

  return { history, loading };
}
