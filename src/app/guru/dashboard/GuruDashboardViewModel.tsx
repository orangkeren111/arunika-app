import { guruRepository } from "@/src/lib/repositories/guruRepository";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { User } from "../../types/admin";

export function useGuruDashboard() {
  const [stats, setStats] = useState<{
    activeExams: number;
    pendingEssays: number;
    recentClasses: number;
  } | null>(null);
  const [validationBooks, setValidationBooks] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>();
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();

  useEffect(() => {
    const guruId = Number(session?.user?.id ?? 1);
    Promise.all([
      guruRepository.getDashboardStats(guruId),
      guruRepository.getBooksNeedingValidation(guruId),
    ])
      .then(([statsRes, booksRes]) => {
        setStats(statsRes);
        setValidationBooks(booksRes);
        setLoading(false);
        setCurrentUser(session?.user);
      })
      .catch((err) => {
        console.error("Dashboard error:", err);
        setLoading(false);
      });
  }, [session?.user?.id]);

  return { stats, validationBooks, loading, currentUser };
}
