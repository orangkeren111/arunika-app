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
    //TODO
  };
  const handleDeleteBab = async (id: string) => {
    //TODO
  };
  const handleUploadBook = async (file: File) => {
    const formData = new FormData();
    formData.append("bookId", bookId.toString()); // sesuaikan tipe bookId
    formData.append("pdfFile", file);
    await guruRepository.uploadAndGenerateBookPdf(formData);
  };
  const handleViewBook = async () => {
    //TODO
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
