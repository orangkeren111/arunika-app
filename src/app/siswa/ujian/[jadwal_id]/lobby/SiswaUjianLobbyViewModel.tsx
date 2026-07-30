import { siswaRepository } from "@/src/lib/repositories/siswaRepository";
import { UpcomingExam } from "@/src/app/types/siswa";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export function useExamLobby(jadwalId: string) {
  const { data: session } = useSession();
  const [exam, setExam] = useState<UpcomingExam | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const studentId = session?.user?.id ? Number(session.user.id) : undefined;
    siswaRepository.getExamLobby(jadwalId, studentId).then((res) => {
      setExam(res);
      setLoading(false);
    });
  }, [jadwalId, session]);

  return { exam, loading };
}
