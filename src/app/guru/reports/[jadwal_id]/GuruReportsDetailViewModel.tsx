import { guruRepository } from "@/src/lib/repositories/guruRepository";
import { AttemptReport, JadwalUjian } from "@/src/app/types/guru";
import { useEffect, useState } from "react";

export function useReportDetailViewModel(jadwalId: string) {
  const [jadwal, setJadwal] = useState<JadwalUjian | null>(null);
  const [attempts, setAttempts] = useState<AttemptReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    guruRepository.getReportDetail(jadwalId).then(res => {
      setJadwal(res.jadwal);
      setAttempts(res.attempts);
      setLoading(false);
    });
  }, [jadwalId]);

  return { jadwal, attempts, loading };
}