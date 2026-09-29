import { guruRepository } from "@/src/lib/repositories/guruRepository";
import { Bab, Soal } from "@/src/app/types/guru";
import { useEffect, useState } from "react";
import { getKompetensiBab } from "../../../../../../lib/services/db/guru/kompetensiDB";
import { fetchWithRetry } from "@/src/lib/utils/retryFunction";
import { TipeSoal } from "@prisma/client";

export interface SoalImportRow {
  type: "MCQ" | "ESSAY";
  teksSoal: string;
  difficulty: number;
  bloomLevel: string;
  opsiJawaban: string[] | null;
  jawabanBenarMcq: string | null;
  jawabanBenarEssay: string | null;
  tags: string[];
  kompetensiBabId: number | null;
}

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
  const [isLockedByExam, setIsLockedByExam] = useState(false);
  const [lockMessage, setLockMessage] = useState("");

  const [selectedBloomLevel, setSelectedBloomLevel] = useState<string>("");
  const [selectedType, setSelectedType] = useState<TipeSoal | "">("");
  const [selectedTag, setSelectedTag] = useState<string>("");

  const checkGenerationStatus = async () => {
    if (!babId || isNaN(Number(babId))) return;
    try {
      const res = await guruRepository.getSoalGenerationStatus(Number(babId));
      setIsGeneratingSoal(res.isGenerating);
    } catch (err) {
      console.error("Error checking generation status:", err);
    }
  };

  const checkExamLock = async () => {
    if (!babId || isNaN(Number(babId))) return;
    try {
      const lockRes = await guruRepository.getExamLockStatusForBab(Number(babId));
      setIsLockedByExam(lockRes.isLocked);
      setLockMessage(lockRes.message || "");
    } catch (err) {
      console.error("Error checking exam lock:", err);
    }
  };

  const fetchSoal = () => {
    if (!babId || isNaN(Number(babId))) {
      return;
    }

    setLoading(true);

    Promise.all([
      fetchWithRetry(() =>
        guruRepository.getSoalList(
          babId,
          selectedBloomLevel || undefined,
          selectedType || undefined,
          selectedTag || undefined,
        )
      ),
      fetchWithRetry(() => getKompetensiBab(Number(babId))),
      fetchWithRetry(() =>
        guruRepository
          .getSoalGenerationStatus(Number(babId))
          .catch(() => ({ isGenerating: false }))
      ),
      fetchWithRetry(() =>
        guruRepository.getExamLockStatusForBab(Number(babId)).catch(() => ({ isLocked: false, message: "" }))
      ),
    ])
      .then(([res, kompRes, statusRes, lockRes]) => {
        setBab(res.bab);
        setSoalList(res.soalList);
        setKompetensiList(kompRes);
        setIsGeneratingSoal(statusRes.isGenerating);
        setIsLockedByExam(lockRes.isLocked);
        setLockMessage(lockRes.message || "");
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching soal:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSoal();
  }, [babId, selectedBloomLevel, selectedType, selectedTag]);

  const [crudError, setCrudError] = useState<string | null>(null);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);

  const showError = (message: string) => {
    setCrudError(message);
    setIsErrorModalOpen(true);
  };

  const handleGenerateQuestion = async (jumlahSoal: number = 10) => {
    try {
      if (isLockedByExam) {
        showError(lockMessage || "Soal tidak dapat digenerate karena Ujian sedang aktif/terjadwal.");
        return;
      }
      await guruRepository.retryGenerateSoal(Number(babId), jumlahSoal);
      await checkGenerationStatus();
      fetchSoal();
    } catch (err: any) {
      showError(err.message || "Gagal membuat soal dengan AI.");
    }
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
    tags?: string[],
  ) => {
    try {
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
        tags: tags || [],
      });
      fetchSoal();
    } catch (err: any) {
      showError(err.message || "Gagal menambah soal.");
    }
  };

  const handleEditSoal = async (id: string, payload: Soal) => {
    try {
      await guruRepository.editSoal(id, payload);
      fetchSoal();
    } catch (err: any) {
      showError(err.message || "Gagal memperbarui soal.");
    }
  };

  const handleDeleteSoal = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await guruRepository.deleteSoal(id);
      fetchSoal();
      return { success: true };
    } catch (err: any) {
      const errMsg = err.message || "Gagal menghapus soal.";
      showError(errMsg);
      return { success: false, error: errMsg };
    }
  };

  const handleAcceptSoal = async (id: string) => {
    try {
      await guruRepository.editSoal(id, { babId, isAccepted: true, isRejected: false } as any);
      fetchSoal();
    } catch (err: any) {
      showError(err.message || "Gagal menyetujui soal.");
    }
  };

  const handleRejectSoal = async (id: string) => {
    try {
      await guruRepository.editSoal(id, { babId, isAccepted: false, isRejected: true } as any);
      fetchSoal();
    } catch (err: any) {
      showError(err.message || "Gagal menolak soal.");
    }
  };

  const handleUploadImage = async (file: File): Promise<string> => {
    return await guruRepository.uploadImage(file);
  };
  const handleUploadExcelSoal = async (rows: SoalImportRow[]) => {
    try {
      await guruRepository.batchImportSoal(babId, rows);
      fetchSoal();
    } catch (err: any) {
      showError(err.message || "Gagal mengimpor soal dari Excel.");
    }
  };

  const handleUploadBabPdf = async (file: File, jumlahSoalMcq: number = 7, jumlahSoalEssay: number = 3, pilihanPerMcq: number = 4) => {
    if (!bab) return;
    try {
      const jumlahSoal = jumlahSoalMcq + jumlahSoalEssay;
      if (isLockedByExam) {
        showError(lockMessage || "Soal tidak dapat dibuat karena Ujian sedang aktif.");
        return;
      }
      const formData = new FormData();
      formData.append("bookId", bab.bookId);
      formData.append("babId", babId);
      formData.append("pdfFile", file);
      formData.append("jumlahSoal", jumlahSoal.toString());
      formData.append("jumlahMcq", jumlahSoalMcq.toString());
      formData.append("jumlahEssay", jumlahSoalEssay.toString());
      formData.append("pilihanPerMcq", pilihanPerMcq.toString());
      await guruRepository.uploadAndGenerateBookPdf(formData);
      await checkGenerationStatus();
    } catch (err: any) {
      showError(err.message || "Gagal memproses file PDF.");
    }
  };

  return {
    bab,
    soalList,
    kompetensiList,
    loading,
    isGeneratingSoal,
    isLockedByExam,
    lockMessage,
    crudError,
    isErrorModalOpen,
    setIsErrorModalOpen,
    closeErrorModal: () => setIsErrorModalOpen(false),
    checkGenerationStatus,
    checkExamLock,
    handleAddSoal,
    handleEditSoal,
    handleDeleteSoal,
    handleGenerateQuestion,
    handleAcceptSoal,
    handleRejectSoal,
    handleUploadImage,
    handleUploadBabPdf,
    handleUploadExcelSoal,
    selectedType,
    setSelectedType,
    selectedBloomLevel,
    setSelectedBloomLevel,
    selectedTag,
    setSelectedTag,
  };
}
