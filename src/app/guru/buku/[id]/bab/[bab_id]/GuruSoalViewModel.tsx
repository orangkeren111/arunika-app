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
  const [isGeneratingSoal, setIsGeneratingSoal] = useState(false);
  
  const checkGenerationStatus = async () => {
    if (!babId || isNaN(Number(babId))) return;
    try {
      const res = await guruRepository.getSoalGenerationStatus(Number(babId));
      setIsGeneratingSoal(res.isGenerating);
    } catch (err) {
      console.error("Error checking generation status:", err);
    }
  };

  const fetchSoal = () => {
    if (!babId || isNaN(Number(babId))) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      guruRepository.getSoalList(babId),
      getKompetensiBab(Number(babId)),
      guruRepository.getSoalGenerationStatus(Number(babId)).catch(() => ({ isGenerating: false })),
    ])
      .then(([res, kompRes, statusRes]) => {
        setBab(res.bab);
        setSoalList(res.soalList);
        setKompetensiList(kompRes);
        setIsGeneratingSoal(statusRes.isGenerating);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching soal:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSoal();
  }, [babId]);

  const handleGenerateQuestion = async (jumlahSoal: number = 10) => {
    await guruRepository.retryGenerateSoal(Number(babId), jumlahSoal);
    await checkGenerationStatus();
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
    jawabanBenarEssay?: string,
  ) => {
    await guruRepository.addSoal({
      babId,
      type,
      text,
      options,
      correctAnswer,
      jawabanBenarEssay,
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

  const handleUploadBabPdf = async (file: File, jumlahSoal: number = 10) => {
    if (!bab) return;
    const formData = new FormData();
    formData.append("bookId", bab.bookId);
    formData.append("babId", babId);
    formData.append("pdfFile", file);
    formData.append("jumlahSoal", jumlahSoal.toString());
    await guruRepository.uploadAndGenerateBookPdf(formData);
    await checkGenerationStatus();
  };

  return {
    bab,
    soalList,
    kompetensiList,
    loading,
    isGeneratingSoal,
    checkGenerationStatus,
    handleAddSoal,
    handleEditSoal,
    handleDeleteSoal,
    handleGenerateQuestion,
    handleAcceptSoal,
    handleRejectSoal,
    handleUploadImage,
    handleUploadBabPdf,
  };
}
