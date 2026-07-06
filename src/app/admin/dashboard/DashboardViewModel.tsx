import { adminRepository } from "@/src/lib/repositories/adminRepository";
import { Stats } from "@/src/app/types/admin";
import { useEffect, useState } from "react";

export function useDashboardViewModel() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminRepository.getStats().then(res => {
      setStats(res);
      setLoading(false);
    });
  }, []);

  return { stats, loading };
}