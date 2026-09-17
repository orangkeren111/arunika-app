import { guruRepository } from "@/src/lib/repositories/guruRepository";
import { Bab, Buku } from "@/src/app/types/guru";
import { useEffect, useState } from "react";

export function useBabViewModel(bookId: string) {
  const [buku, setBuku] = useState<Buku | null>(null);
  const [babList, setBabList] = useState<Bab[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessingAi, setIsProcessingAi] = useState(false);
  const [statusStage, setStatusStage] = useState<string>("");

  const checkAiStatus = async () => {
    if (!bookId || isNaN(Number(bookId))) return false;
    try {
      const statusRes = await guruRepository.getBookAiProcessingStatus(Number(bookId));
      setIsProcessingAi(statusRes.isProcessing);
      setStatusStage(statusRes.statusStage);
      return statusRes.isProcessing;
    } catch (err) {
      console.error("Error checking book AI status:", err);
      return false;
    }
  };

  const fetchBab = () => {
    setLoading(true);
    Promise.all([
      guruRepository.getBabList(bookId),
      checkAiStatus(),
    ]).then(([res]) => {
      setBuku(res.buku);
      setBabList(res.babList);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchBab();
  }, [bookId]);

  // Polling interval while AI task is active
  useEffect(() => {
    if (!isProcessingAi) return;

    const pollTimer = setInterval(async () => {
      const stillProcessing = await checkAiStatus();
      if (!stillProcessing) {
        fetchBab();
      }
    }, 4000);

    return () => clearInterval(pollTimer);
  }, [isProcessingAi, bookId]);

  const handleAddBab = async (title: string) => {
    await guruRepository.addBab({ bookId, title });
    fetchBab();
  };
  const handleEditBab = async (id: string, title: string) => {
    await guruRepository.updateBab(id, title);
    fetchBab();
  };

  const handleDeleteBab = async (id: string) => {
    await guruRepository.deleteBab(id);
    fetchBab();
  };

  const handleUploadBook = async (file: File, jumlahSoal: number = 10) => {
    const formData = new FormData();
    formData.append("bookId", bookId.toString());
    formData.append("pdfFile", file);
    formData.append("jumlahSoal", jumlahSoal.toString());
    await guruRepository.uploadAndGenerateBookPdf(formData);
    await checkAiStatus();
  };

  return {
    buku,
    babList,
    loading,
    isProcessingAi,
    statusStage,
    checkAiStatus,
    handleAddBab,
    handleEditBab,
    handleDeleteBab,
    handleUploadBook,
  };
}
