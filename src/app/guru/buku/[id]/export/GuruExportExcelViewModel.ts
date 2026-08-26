import { useEffect, useState } from "react";
import { guruRepository } from "@/src/lib/repositories/guruRepository";
import * as XLSX from "xlsx";

export interface ExportSoalItem {
  id: string;
  babId: string;
  babTitle: string;
  teksSoal: string;
  type: "MCQ" | "ESSAY";
  opsiJawaban: string[] | null;
  jawabanBenarMcq: string | null;
  jawabanBenarEssay: string;
  difficulty: number;
  bloomLevel: string;
  linkGambarSoal: string;
  kompetensi: {
    nomerKompetensi: string;
    isiKompetensi: string;
  } | null;
  isAccepted: boolean;
  isRejected: boolean;
}

export interface ExportBabItem {
  id: string;
  title: string;
  judulBab: string;
  questionCount: number;
}

export function useExportExcelViewModel(bookId: string) {
  const [buku, setBuku] = useState<{ id: string; title: string } | null>(null);
  const [babList, setBabList] = useState<ExportBabItem[]>([]);
  const [soalList, setSoalList] = useState<ExportSoalItem[]>([]);
  const [selectedBabId, setSelectedBabId] = useState<string>("ALL");
  const [selectedSoalIds, setSelectedSoalIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<boolean>(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await guruRepository.getBukuExportData(bookId);
      if (data) {
        setBuku(data.buku);
        setBabList(data.babList);
        setSoalList(data.soalList as ExportSoalItem[]);
        // Default select all questions in the book
        setSelectedSoalIds(new Set(data.soalList.map((s: any) => s.id.toString())));
      }
    } catch (error) {
      console.error("Failed to fetch export data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (bookId) {
      fetchData();
    }
  }, [bookId]);

  // Questions filtered by the currently selected Bab dropdown/tab
  const filteredSoalList = selectedBabId === "ALL"
    ? soalList
    : soalList.filter((s) => s.babId === selectedBabId);

  // Questions currently staged (checked) for Excel export
  const stagedSoalList = soalList.filter((s) => selectedSoalIds.has(s.id));

  // Check if all questions in the current filtered Bab view are selected
  const isAllCurrentBabSelected =
    filteredSoalList.length > 0 &&
    filteredSoalList.every((s) => selectedSoalIds.has(s.id));

  const toggleSoalSelection = (soalId: string) => {
    setSelectedSoalIds((prev) => {
      const next = new Set(prev);
      if (next.has(soalId)) {
        next.delete(soalId);
      } else {
        next.add(soalId);
      }
      return next;
    });
  };

  const toggleSelectAllCurrentBab = () => {
    setSelectedSoalIds((prev) => {
      const next = new Set(prev);
      if (isAllCurrentBabSelected) {
        // Deselect all questions in the current filter
        filteredSoalList.forEach((s) => next.delete(s.id));
      } else {
        // Select all questions in the current filter
        filteredSoalList.forEach((s) => next.add(s.id));
      }
      return next;
    });
  };

  const selectAllInBook = () => {
    setSelectedSoalIds(new Set(soalList.map((s) => s.id)));
  };

  const clearAllSelections = () => {
    setSelectedSoalIds(new Set());
  };

  const handleExportExcel = () => {
    if (stagedSoalList.length === 0) {
      alert("Tidak ada soal yang dipilih untuk diekspor.");
      return;
    }

    const rows = stagedSoalList.map((soal, index) => {
      let optA = "", optB = "", optC = "", optD = "", optE = "";
      if (Array.isArray(soal.opsiJawaban)) {
        optA = soal.opsiJawaban[0] || "";
        optB = soal.opsiJawaban[1] || "";
        optC = soal.opsiJawaban[2] || "";
        optD = soal.opsiJawaban[3] || "";
        optE = soal.opsiJawaban[4] || "";
      }

      const kunci =
        soal.type === "MCQ"
          ? soal.jawabanBenarMcq || ""
          : soal.jawabanBenarEssay || "";

      const komp = soal.kompetensi
        ? `${soal.kompetensi.nomerKompetensi} - ${soal.kompetensi.isiKompetensi}`
        : "";

      return {
        "No": index + 1,
        "Bab": soal.babTitle,
        "Tipe Soal": soal.type === "MCQ" ? "Pilihan Ganda" : "Essay",
        "Teks Soal": soal.teksSoal,
        "Opsi A": optA,
        "Opsi B": optB,
        "Opsi C": optC,
        "Opsi D": optD,
        "Opsi E": optE,
        "Kunci Jawaban": kunci,
        "Tingkat Kesulitan": soal.difficulty || 1,
        "Tingkat Bloom": soal.bloomLevel || "C1",
        "Kompetensi": komp,
        "Link Gambar": soal.linkGambarSoal || "",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Set auto-width hints
    worksheet["!cols"] = [
      { wch: 5 },   // No
      { wch: 22 },  // Bab
      { wch: 15 },  // Tipe Soal
      { wch: 50 },  // Teks Soal
      { wch: 20 },  // Opsi A
      { wch: 20 },  // Opsi B
      { wch: 20 },  // Opsi C
      { wch: 20 },  // Opsi D
      { wch: 20 },  // Opsi E
      { wch: 25 },  // Kunci Jawaban
      { wch: 18 },  // Tingkat Kesulitan
      { wch: 15 },  // Tingkat Bloom
      { wch: 35 },  // Kompetensi
      { wch: 30 },  // Link Gambar
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bank Soal");

    const sanitizedTitle = (buku?.title || "Buku").replace(/[^a-zA-Z0-9_-]/g, "_");
    const fileName = `Bank_Soal_${sanitizedTitle}_${Date.now()}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  return {
    buku,
    babList,
    soalList,
    filteredSoalList,
    stagedSoalList,
    selectedBabId,
    setSelectedBabId,
    selectedSoalIds,
    isAllCurrentBabSelected,
    loading,
    toggleSoalSelection,
    toggleSelectAllCurrentBab,
    selectAllInBook,
    clearAllSelections,
    handleExportExcel,
  };
}
