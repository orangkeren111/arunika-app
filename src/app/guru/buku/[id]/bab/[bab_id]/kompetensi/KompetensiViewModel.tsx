import { useState } from "react";
import { guruRepository } from "@/src/lib/repositories/guruRepository";

interface Kompetensi {
  id: number;
  nomerKompetensi: string;
  isiKompetensi: string;
}

export function useKompetensiViewModel(
  babId: number,
  initialCompetencies: Kompetensi[]
) {
  const [competencies, setCompetencies] = useState<Kompetensi[]>(initialCompetencies);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // CRUD Form State
  const [nomerKomp, setNomerKomp] = useState("");
  const [isiKomp, setIsiKomp] = useState("");

  // Linking Tool State
  const [isLinkingOpen, setIsLinkingOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState("");
  const [availableChapters, setAvailableChapters] = useState<string[]>([]);
  const [selectedChapter, setSelectedChapter] = useState("");
  const [previewCompetencies, setPreviewCompetencies] = useState<any[]>([]);
  const [selectedKompIds, setSelectedKompIds] = useState<number[]>([]);
  const [linkingLoading, setLinkingLoading] = useState(false);

  // Handlers for CRUD
  const openAddForm = () => {
    setEditingId(null);
    setNomerKomp("");
    setIsiKomp("");
    setIsFormOpen(true);
  };

  const openEditForm = (komp: Kompetensi) => {
    setEditingId(komp.id);
    setNomerKomp(komp.nomerKompetensi);
    setIsiKomp(komp.isiKompetensi);
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomerKomp || !isiKomp) return;

    await guruRepository.upsertKompetensiBab({
      id: editingId || undefined,
      babId,
      nomerKompetensi: nomerKomp,
      isiKompetensi: isiKomp,
    });

    window.location.reload();
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus kompetensi ini?")) {
      await guruRepository.deleteKompetensiBab(id);
      window.location.reload();
    }
  };

  // Handlers for Linking
  const handleBookChange = async (book: string) => {
    setSelectedBook(book);
    setSelectedChapter("");
    setPreviewCompetencies([]);
    if (book) {
      const chapters = await guruRepository.getAvailablePelajaranChapters(book);
      setAvailableChapters(chapters);
    } else {
      setAvailableChapters([]);
    }
  };

  const handleChapterChange = async (chapter: string) => {
    setSelectedChapter(chapter);
    if (chapter && selectedBook) {
      const list = await guruRepository.getKompetensiPelajaran(selectedBook, chapter);
      setPreviewCompetencies(list);
      setSelectedKompIds(list.map((c) => c.id)); // Select all by default
    } else {
      setPreviewCompetencies([]);
    }
  };

  const toggleSelectKomp = (id: number) => {
    if (selectedKompIds.includes(id)) {
      setSelectedKompIds(selectedKompIds.filter((x) => x !== id));
    } else {
      setSelectedKompIds([...selectedKompIds, id]);
    }
  };

  const handleExecuteLink = async () => {
    if (selectedKompIds.length === 0) return;
    setLinkingLoading(true);
    await guruRepository.linkKompetensiPelajaranToBab(babId, selectedKompIds);
    setLinkingLoading(false);
    setIsLinkingOpen(false);
    window.location.reload();
  };

  return {
    competencies,
    isFormOpen,
    setIsFormOpen,
    editingId,
    nomerKomp,
    setNomerKomp,
    isiKomp,
    setIsiKomp,
    isLinkingOpen,
    setIsLinkingOpen,
    selectedBook,
    availableChapters,
    selectedChapter,
    previewCompetencies,
    selectedKompIds,
    linkingLoading,
    openAddForm,
    openEditForm,
    handleSave,
    handleDelete,
    handleBookChange,
    handleChapterChange,
    toggleSelectKomp,
    handleExecuteLink,
  };
}
