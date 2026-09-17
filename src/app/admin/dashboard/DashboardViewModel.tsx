import { adminRepository } from "@/src/lib/repositories/adminRepository";
import { Stats } from "@/src/app/types/admin";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export function useDashboardViewModel() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession()

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      adminRepository.getStats(session?.user?.sekolah_id!.toString()).then(res => {
        setStats(res);
        setLoading(false);
      });
    }
  }, [session]);

  return { stats, loading };
}