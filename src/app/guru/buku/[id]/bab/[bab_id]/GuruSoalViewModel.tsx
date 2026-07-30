import { guruRepository } from "@/src/lib/repositories/guruRepository";
import { Bab, Soal } from "@/src/app/types/guru";
import { useEffect, useState } from "react";

export function useSoalViewModel(babId: string) {
  const [bab, setBab] = useState<Bab | null>(null);
  const [soalList, setSoalList] = useState<Soal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSoal = () => {
    setLoading(true);
    guruRepository.getSoalList(babId).then((res) => {
      setBab(res.bab);
      setSoalList(res.soalList);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchSoal();
  }, [babId]);

  const handleGenerateQuestion = async () => {
    await guruRepository.retryGenerateSoal(Number(babId));
    fetchSoal();
  };
  const handleAddSoal = async (
    type: "MCQ" | "ESSAY",
    text: string,
    difficulty: number,
    bloomLevel: string,
    options?: string[],
    correctAnswer?: string,
  ) => {
    await guruRepository.addSoal({
      babId,
      type,
      text,
      options,
      correctAnswer,
      difficulty,
      bloomLevel,
    });
    fetchSoal();
  };

  const handleEditSoal = async (id: string, payload: Soal) => {
    await guruRepository.editSoal(id, payload);
    fetchSoal();
  };

  const handleDeleteSoal = async (id: string) => {
    await guruRepository.deleteSoal(id);
    fetchSoal();
  };

  return {
    bab,
    soalList,
    loading,
    handleAddSoal,
    handleEditSoal,
    handleDeleteSoal,
    handleGenerateQuestion,
  };
}
