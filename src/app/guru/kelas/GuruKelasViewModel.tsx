import { guruRepository } from "@/src/lib/repositories/guruRepository";
import { Kelas } from "@/src/app/types/guru";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

type KelasOrder =
  | "name_asc"
  | "name_desc"
  | "students_desc"
  | "students_asc";

type KelasStatus = "all" | "active" | "retired";

export function useKelasViewModel() {
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [orderBy, setOrderBy] = useState<KelasOrder>("name_asc");
  const [status, setStatus] = useState<KelasStatus>("active");

  const { data: session, status: sessionStatus } = useSession();

  const fetchKelas = () => {
    if (sessionStatus !== "authenticated" || !session?.user?.id) return;

    setLoading(true);

    guruRepository
      .getKelas(
        Number(session.user.sekolah_id ?? 0),
        Number(session.user.id),
        search,
        orderBy,
        status
      )
      .then((res) => {
        setKelasList(res);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchKelas();
  }, [session, sessionStatus, search, orderBy, status]);

  return {
    kelasList,
    loading,
    search,
    setSearch,
    orderBy,
    setOrderBy,
    status,
    setStatus,
    refresh: fetchKelas,
  };
}