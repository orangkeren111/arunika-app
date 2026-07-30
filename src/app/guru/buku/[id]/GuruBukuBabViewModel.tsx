import { guruRepository } from "@/src/lib/repositories/guruRepository";
import { Bab, Buku } from "@/src/app/types/guru";
import { useEffect, useState } from "react";

export function useBabViewModel(bookId: string) {
  const [buku, setBuku] = useState<Buku | null>(null);
  const [babList, setBabList] = useState<Bab[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBab = () => {
    setLoading(true);
    guruRepository.getBabList(bookId).then((res) => {
      setBuku(res.buku);
      setBabList(res.babList);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchBab();
  }, [bookId]);

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
  };

  const handleViewBook = async () => {
    const url = await guruRepository.getBukuPdfUrl(bookId);
    if (url) {
      window.open(url, "_blank");
    } else {
      alert("PDF file not found. Please upload a PDF first.");
    }
  };

  return {
    buku,
    babList,
    loading,
    handleAddBab,
    handleEditBab,
    handleDeleteBab,
    handleUploadBook,
    handleViewBook,
  };
}
