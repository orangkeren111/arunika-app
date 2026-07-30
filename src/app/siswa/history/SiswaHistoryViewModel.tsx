import { siswaRepository } from "@/src/lib/repositories/siswaRepository";
import { ExamHistoryDetail } from "@/src/app/types/siswa";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export function useSiswaHistory() {
  const [history, setHistory] = useState<ExamHistoryDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) return;

    siswaRepository
      .getHistoryList(Number(session.user.id))
      .then((res) => {
        setHistory(res);
        setLoading(false);
      });
  }, [session, status]);

  return { history, loading };
}
