import { siswaRepository } from "@/src/lib/repositories/siswaRepository";
import { SiswaKelas } from "@/src/app/types/siswa";
import { useEffect, useState } from "react";

export function useSiswaKelas() {
  const [kelasList, setKelasList] = useState<SiswaKelas[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    siswaRepository.getSiswaKelas().then(res => {
      setKelasList(res);
      setLoading(false);
    });
  }, []);

  return { kelasList, loading };
}