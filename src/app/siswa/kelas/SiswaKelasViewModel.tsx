import { siswaRepository } from "@/src/lib/repositories/siswaRepository";
import { SiswaKelas } from "@/src/app/types/siswa";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export function useSiswaKelas() {
  const [kelasList, setKelasList] = useState<SiswaKelas[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: session, status } = useSession();

  useEffect(() => {
    siswaRepository.getSiswaKelas(Number(session?.user.id ?? 0)).then((res) => {
      setKelasList(res);
      setLoading(false);
    });
  }, []);

  return { kelasList, loading };
}
