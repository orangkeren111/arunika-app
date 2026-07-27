import { siswaRepository } from "@/src/lib/repositories/siswaRepository";
import { UpcomingExam } from "@/src/app/types/siswa";
import { useEffect, useState } from "react";

export function useExamLobby(jadwalId: string) {
  const [exam, setExam] = useState<UpcomingExam | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    siswaRepository.getExamLobby(jadwalId).then((res) => {
      setExam(res);
      setLoading(false);
    });
  }, [jadwalId]);

  return { exam, loading };
}
