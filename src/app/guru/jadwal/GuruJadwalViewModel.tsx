import { guruRepository } from "@/src/lib/repositories/guruRepository";
import { JadwalUjian } from "@/src/app/types/guru";
import { useEffect, useState } from "react";

export function useJadwalViewModel() {
  const [jadwalList, setJadwalList] = useState<JadwalUjian[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJadwal = () => {
    setLoading(true);
    guruRepository.getJadwal().then(res => {
      setJadwalList(res);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchJadwal();
  }, []);

  const handleCreateJadwal = async (templateId: string, className: string, startTime: string, type: string) => {
    await guruRepository.createJadwal({ templateId, className, startTime, type });
    fetchJadwal();
  };

  return { jadwalList, loading, handleCreateJadwal };
}