"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { adminPaymentRepository } from "@/src/lib/repositories/adminPaymentRepository";

export function useAdminPaymentHistoryViewModel() {
  const { data: session, status } = useSession();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    const sekolahId = (session?.user as any)?.sekolahId || (session?.user as any)?.sekolah_id;
    if (status !== "authenticated" || !sekolahId) return;
    setLoading(true);
    try {
      const result = await adminPaymentRepository.getPaymentHistory(sekolahId.toString());
      setData(result);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Gagal memuat riwayat pembayaran.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [session, status]);

  return {
    data,
    loading,
    error,
    refresh: fetchHistory,
  };
}
