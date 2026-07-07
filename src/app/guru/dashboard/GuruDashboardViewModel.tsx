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
  const [currentUser, setCurrentUser] = useState<any>();
  const [loading, setLoading] = useState(true);
  const { data: session, status } = useSession();

  useEffect(() => {
    guruRepository
      .getDashboardStats(Number(session?.user.id ?? 0))
      .then((res) => {
        setStats(res);
        setLoading(false);
        setCurrentUser(session?.user);
      });
  }, []);

  return { stats, loading, currentUser };
}
