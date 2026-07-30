import { siswaRepository } from "@/src/lib/repositories/siswaRepository";
import { ExamHistoryDetail, UpcomingExam } from "@/src/app/types/siswa";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export function useSiswaDashboard() {
  const [stats, setStats] = useState<{
    active: number;
    upcoming: number;
    averageScore: number;
  } | null>(null);
  const [upcoming, setUpcoming] = useState<UpcomingExam[]>([]);
  const [recentHistory, setRecentHistory] = useState<ExamHistoryDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) return;

    siswaRepository.getDashboardData(Number(session.user.id)).then((res) => {
      setStats(res.stats);
      setUpcoming(res.upcoming);
      setRecentHistory(res.recentHistory);
      setLoading(false);
      setCurrentUser(session.user);
    });
  }, [session, status]);

  return { stats, upcoming, recentHistory, loading, currentUser };
}
