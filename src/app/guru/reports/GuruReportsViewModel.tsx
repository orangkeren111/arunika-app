import { guruRepository } from "@/src/lib/repositories/guruRepository";
import { JadwalUjian } from "@/src/app/types/guru";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Kelas } from "../../types/admin";

export function useReportsViewModel() {
  const [completedJadwal, setCompletedJadwal] = useState<JadwalUjian[]>([]);
  const [loading, setLoading] = useState(true);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);

  // --- Filter States ---
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedKelasFilter, setSelectedKelasFilter] = useState("");

  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    const guruId = Number(session.user.id);

    // Fetch kelas list for filter dropdown
    guruRepository
      .getKelas(Number(session.user.sekolah_id ?? 1), guruId)
      .then(setKelasList);

    const fetchReports = async () => {
      try {
        setLoading(true);
        const res = await guruRepository.getCompletedJadwal(guruId, {
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          kelasId: selectedKelasFilter || undefined,
        });
        setCompletedJadwal(res);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [session?.user?.id, status, startDate, endDate, selectedKelasFilter]);

  const resetFilters = () => {
    setStartDate("");
    setEndDate("");
    setSelectedKelasFilter("");
  };

  return {
    completedJadwal,
    loading,
    kelasList,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    selectedKelasFilter,
    setSelectedKelasFilter,
    resetFilters,
  };
}