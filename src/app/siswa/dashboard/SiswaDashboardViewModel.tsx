import { siswaRepository } from "@/src/lib/repositories/siswaRepository";
import { ExamHistoryDetail, UpcomingExam } from "@/src/app/types/siswa";
import { useEffect, useState } from "react";

export function useSiswaDashboard() {
  const [stats, setStats] = useState<{
    active: number;
    upcoming: number;
    averageScore: number;
  } | null>(null);
  const [upcoming, setUpcoming] = useState<UpcomingExam[]>([]);
  const [recentHistory, setRecentHistory] = useState<ExamHistoryDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    siswaRepository.getDashboardData().then((res) => {
      setStats(res.stats);
      setUpcoming(res.upcoming);
      setRecentHistory(res.recentHistory);
      setLoading(false);
    });
  }, []);

  return { stats, upcoming, recentHistory, loading };
}
