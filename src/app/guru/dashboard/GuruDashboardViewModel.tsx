import { guruRepository } from "@/src/lib/repositories/guruRepository";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export function useGuruDashboard() {
  const [stats, setStats] = useState<{
    activeExams: number;
    pendingEssays: number;
    recentClasses: number;
  } | null>(null);

  const [validationBooks, setValidationBooks] = useState<any[]>([]);
  const [todayExams, setTodayExams] = useState<any[]>([]);
  const [recentClasses, setRecentClasses] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>();
  const [loading, setLoading] = useState(true);

  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user?.id) return;

    const guruId = Number(session.user.id);

    setLoading(true);

    Promise.all([
      guruRepository.getDashboardStats(guruId),
      guruRepository.getBooksNeedingValidation(guruId),
      guruRepository.getTodayExams(guruId),
      guruRepository.getRecentlyModifiedClasses(guruId),
    ])
      .then(([statsRes, booksRes, examsRes, classesRes]) => {
        setStats(statsRes);
        setValidationBooks(booksRes);
        setTodayExams(examsRes);
        setRecentClasses(classesRes);
        setCurrentUser(session.user);
      })
      .catch((err) => {
        console.error("Dashboard error:", err);
      })
      .finally(() => {
        setLoading(false);
      });

  }, [session?.user?.id]);

  return {
    stats,
    validationBooks,
    todayExams,
    recentClasses,
    loading,
    currentUser,
  };
}
