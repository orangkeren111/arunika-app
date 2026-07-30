import { guruRepository } from "@/src/lib/repositories/guruRepository";
import { Kelas } from "@/src/app/types/guru";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export function useKelasViewModel() {
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: session, status } = useSession();

  const fetchKelas = () => {
    if (status !== "authenticated" || !session?.user?.id) return;
    setLoading(true);
    guruRepository
      .getKelas(
        Number(session.user.sekolah_id ?? 0),
        Number(session.user.id)
      )
      .then((res) => {
        setKelasList(res);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchKelas();
  }, [session, status]);

  return { kelasList, loading, refresh: fetchKelas };
}
