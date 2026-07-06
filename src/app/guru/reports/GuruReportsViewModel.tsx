import { guruRepository } from "@/src/lib/repositories/guruRepository";
import { JadwalUjian } from "@/src/app/types/guru";
import { useEffect, useState } from "react";

export function useReportsViewModel() {
  const [completedJadwal, setCompletedJadwal] = useState<JadwalUjian[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    guruRepository.getCompletedJadwal().then(res => {
      setCompletedJadwal(res);
      setLoading(false);
    });
  }, []);

  return { completedJadwal, loading };
}