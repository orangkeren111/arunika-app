import { guruRepository } from "@/src/lib/repositories/guruRepository";
import { JadwalUjian } from "@/src/app/types/guru";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export function useReportsViewModel() {
  const [completedJadwal, setCompletedJadwal] = useState<JadwalUjian[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: session, status } = useSession();

  useEffect(() => {
    guruRepository
      .getCompletedJadwal(Number(session?.user.id ?? 0))
      .then((res) => {
        setCompletedJadwal(res);
        setLoading(false);
      });
  }, []);

  return { completedJadwal, loading };
}
