import { siswaRepository } from "@/src/lib/repositories/siswaRepository";
import { SiswaKelas } from "@/src/app/types/siswa";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export function useSiswaKelas() {
  const [kelasList, setKelasList] = useState<SiswaKelas[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) return;

    siswaRepository.getSiswaKelas(Number(session.user.id)).then((res) => {
      setKelasList(res);
      setLoading(false);
    });
  }, [session, status]);

  return { kelasList, loading };
}
