import { siswaRepository } from "@/src/lib/repositories/siswaRepository";
import { ExamHistoryDetail } from "@/src/app/types/siswa";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

const PAGE_SIZE = 10;

export function useSiswaHistory() {
  const [history, setHistory] = useState<ExamHistoryDetail[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const { data: session, status } = useSession();

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) return;

    setLoading(true);

    siswaRepository
      .getHistoryList(Number(session.user.id), {
        search,
        startDate,
        endDate,
        page,
        pageSize: PAGE_SIZE,
      })
      .then((res) => {
        setHistory(res.data);
        setTotalPages(res.totalPages);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [session, status, search, startDate, endDate, page]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    setPage(1);
  };

  const handleEndDateChange = (value: string) => {
    setEndDate(value);
    setPage(1);
  };

  const resetFilters = () => {
    setSearch("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  return {
    history,
    loading,

    search,
    setSearch: handleSearchChange,

    startDate,
    setStartDate: handleStartDateChange,

    endDate,
    setEndDate: handleEndDateChange,

    page,
    setPage,
    totalPages,

    resetFilters,
  };
}