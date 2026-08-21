import { guruRepository } from "@/src/lib/repositories/guruRepository";
import { Bab, Soal } from "@/src/app/types/guru";
import { useEffect, useState } from "react";
import { getKompetensiBab } from "./kompetensi/actions";

interface Kompetensi {
  id: number;
  nomerKompetensi: string;
  isiKompetensi: string;
}

export function useSoalViewModel(babId: string) {
  const [bab, setBab] = useState<Bab | null>(null);
  const [soalList, setSoalList] = useState<Soal[]>([]);
  const [kompetensiList, setKompetensiList] = useState<Kompetensi[]>([]);
  const [loading, setLoading] = useState(true);
  
  const fetchSoal = () => {
    setLoading(true);
    Promise.all([
      guruRepository.getSoalList(babId),
      getKompetensiBab(Number(babId)),
    ]).then(([res, kompRes]) => {
      setBab(res.bab);
      setSoalList(res.soalList);
      setKompetensiList(kompRes);
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
    kompetensiBabId?: string | null,
    linkGambarSoal?: string,
  ) => {
    await guruRepository.addSoal({
      babId,
      type,
      text,
      options,
      correctAnswer,
      difficulty,
      bloomLevel,
      kompetensiBabId,
      linkGambarSoal,
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

  const handleAcceptSoal = async (id: string) => {
    await guruRepository.editSoal(id, { babId, isAccepted: true, isRejected: false } as any);
    fetchSoal();
  };

  const handleRejectSoal = async (id: string) => {
    await guruRepository.editSoal(id, { babId, isAccepted: false, isRejected: true } as any);
    fetchSoal();
  };

  const handleUploadImage = async (file: File): Promise<string> => {
    return await guruRepository.uploadImage(file);
  };

  return {
    bab,
    soalList,
    kompetensiList,
    loading,
    handleAddSoal,
    handleEditSoal,
    handleDeleteSoal,
    handleGenerateQuestion,
    handleAcceptSoal,
    handleRejectSoal,
    handleUploadImage,
  };
}
