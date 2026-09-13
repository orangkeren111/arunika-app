import { siswaRepository } from "@/src/lib/repositories/siswaRepository";
import {
  ExamHistoryDetail,
  UpcomingExam,
} from "@/src/app/types/siswa";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export function useSiswaDashboard() {
  const [stats, setStats] = useState<{
    active: number;
    upcoming: number;
    averageScore: number;
  } | null>(null);

  const [upcoming, setUpcoming] = useState<UpcomingExam[]>([]);

  const [recentHistory, setRecentHistory] = useState<
    ExamHistoryDetail[]
  >([]);

  const [performanceHistory, setPerformanceHistory] = useState<
    {
      id: string;
      title: string;
      score: number;
      label: string;
    }[]
  >([]);

  const [learningInsight, setLearningInsight] = useState<{
    averageScore: number;
    scoreTrend: number;
    totalGraded: number;
  } | null>(null);

  const [loading, setLoading] = useState(true);

  const [currentUser, setCurrentUser] = useState<any>();

  const [greeting, setGreeting] = useState("Selamat Datang");

  const { data: session, status } = useSession();

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();

      if (hour >= 5 && hour < 12) {
        setGreeting("Selamat Pagi");
      } else if (hour >= 12 && hour < 17) {
        setGreeting("Selamat Siang");
      } else {
        setGreeting("Selamat Malam");
      }
    };

    updateGreeting();

    const interval = setInterval(
      updateGreeting,
      60 * 1000,
    );

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (
      status !== "authenticated" ||
      !session?.user?.id
    ) {
      return;
    }

    setLoading(true);

    siswaRepository
      .getDashboardData(Number(session.user.id))
      .then((res) => {
        setStats(res.stats);
        setUpcoming(res.upcoming);
        setRecentHistory(res.recentHistory);
        setPerformanceHistory(
          res.performanceHistory,
        );
        setLearningInsight(
          res.learningInsight,
        );

        setCurrentUser(session.user);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [session, status]);

  return {
    stats,
    upcoming,
    recentHistory,
    performanceHistory,
    learningInsight,
    greeting,
    loading,
    currentUser,
  };
}