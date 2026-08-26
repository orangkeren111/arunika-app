import { siswaRepository } from "@/src/lib/repositories/siswaRepository";
import { SiswaKelas, UpcomingExam } from "@/src/app/types/siswa";
import { useEffect, useState } from "react";

export function useKelasDetail(kelasId: string, siswaId?: number) {
  const [kelas, setKelas] = useState<SiswaKelas | null>(null);
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    siswaRepository.getKelasDetail(kelasId, siswaId).then(res => {
      setKelas(res.kelas);
      setExams(res.exams);
      setLoading(false);
    });
  }, [kelasId, siswaId]);

  return { kelas, exams, loading };
}