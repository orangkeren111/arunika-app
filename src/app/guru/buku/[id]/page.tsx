"use client";

import React, { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  FolderOpen,
  Eye,
  Pencil,
  Trash2,
  X,
  Upload,
  FileText,
  FileSpreadsheet,
} from "lucide-react";
import { useBabViewModel } from "./GuruBukuBabViewModel";

export default function BabPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const {
    buku,
    babList,
    isProcessingAi,
    statusStage,
    handleAddBab,
    handleEditBab,
    handleDeleteBab,
    handleUploadBook,
  } = useBabViewModel(resolvedParams.id);

  // State untuk modal Bab
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedBabId, setSelectedBabId] = useState<string | null>(null);

  // State untuk modal Upload PDF
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jumlahSoal, setJumlahSoal] = useState<number>(10);

  const [formData, setFormData] = useState({
    title: "",
  });

  const openAddModal = () => {
    if (isProcessingAi) return;
    setModalMode("add");
    setFormData({ title: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (bab: any) => {
    if (isProcessingAi) return;
    setModalMode("edit");
    setSelectedBabId(bab.id);
    setFormData({
      title: bab.title || "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedBabId(null);
    setFormData({ title: "" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === "add") {
      handleAddBab(formData.title);
    } else if (modalMode === "edit" && selectedBabId) {
      handleEditBab(selectedBabId, formData.title);
    }
    closeModal();
  };

  // Handler untuk Upload PDF
  const closeUploadModal = () => {
    setIsUploadModalOpen(false);
    setSelectedFile(null);
    setJumlahSoal(10);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const submitUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFile) {
      await handleUploadBook(selectedFile, jumlahSoal);
      closeUploadModal();
      router.push("/guru/buku");
    }
  };

  if (!buku)
    return (
      <div className="p-8 text-center text-[var(--muted-foreground)]">
        Memuat buku...
      </div>
    );

  return (
    <div className="space-y-4 md:space-y-6 relative px-4 md:px-0">
      <Link
        href="/guru/buku"
        className="inline-flex items-center gap-2 text-sm md:text-base text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition mb-2"
      >
        <ArrowLeft size={16} /> Kembali ke Koleksi Buku
      </Link>

      {/* GATEKEEP BANNER WHEN AI PROCESSING */}
      {isProcessingAi && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-900 dark:text-amber-300 flex items-center justify-between gap-4 shadow-sm animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin shrink-0"></div>
            <div>
              <h4 className="font-bold text-sm">Buku Ini Sedang Diproses Oleh AI (Task Queue)</h4>
              <p className="text-xs opacity-90">
                Tahap: {statusStage || "Processing Task Queue..."}. Pengelolaan bab dan bank soal dikunci sementara hingga proses AI selesai.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold bg-amber-600/20 px-2.5 py-1 rounded-full border border-amber-600/30 shrink-0">
            Auto-Syncing
          </span>
        </div>
      )}

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="w-full lg:w-auto">
          <h1 className="text-xl md:text-2xl font-bold text-[var(--foreground)] break-words">
            {buku.title}
          </h1>
          <p className="text-sm md:text-base text-[var(--muted-foreground)] mt-1">
            Daftar bab dan bank soal di dalam buku ini.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <Link
            href={`/guru/buku/${buku.id}/export`}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 border border-green-600/30 text-green-600 bg-green-500/10 px-3 py-2 rounded-lg hover:bg-green-500/20 transition text-sm md:text-base font-semibold whitespace-nowrap"
          >
            <FileSpreadsheet size={18} /> Export Excel
          </Link>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            disabled={isProcessingAi}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 border border-[var(--border)] text-[var(--foreground)] bg-[var(--card)] px-3 py-2 rounded-lg hover:bg-[var(--muted)] transition text-sm md:text-base whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload size={18} /> Upload PDF
          </button>
          <button
            onClick={openAddModal}
            disabled={isProcessingAi}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 rounded-lg hover:opacity-90 transition text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={18} /> Tambah Bab
          </button>
        </div>
      </div>

      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
        {babList.length === 0 ? (
          <div className="p-8 text-center text-[var(--muted-foreground)] flex-grow flex items-center justify-center">
            Belum ada bab di dalam buku ini.
          </div>
        ) : (
          babList.map((bab, index) => (
            <div
              key={bab.id}
              className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[var(--muted)] hover:bg-opacity-50 transition ${index !== 0 ? "border-t border-[var(--border)]" : ""}`}
            >
              <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                <FolderOpen
                  size={20}
                  className="text-[var(--secondary)] flex-shrink-0"
                />
                <div className="min-w-0">
                  <p className="font-medium text-[var(--card-foreground)] truncate text-sm md:text-base">
                    {bab.title}
                  </p>
                  <p className="text-xs md:text-sm text-[var(--muted-foreground)]">
                    {bab.questionCount} Soal tersedia
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <Link
                  href={`/guru/buku/${buku.id}/bab/${bab.id}`}
                  className="p-2 text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--muted)] rounded-md transition flex items-center gap-2"
                  title="Lihat Soal"
                >
                  <Eye size={18} />
                  <span className="sr-only sm:not-sr-only text-sm font-medium sm:hidden lg:inline">
                    Lihat Soal
                  </span>
                </Link>
                <button
                  onClick={() => openEditModal(bab)}
                  className="p-2 text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--muted)] rounded-md transition"
                  title="Edit Bab"
                >
                  <Pencil size={18} />
                </button>
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        "Apakah Anda yakin ingin menghapus bab ini beserta seluruh soal di dalamnya?",
                      )
                    ) {
                      handleDeleteBab(bab.id);
                    }
                  }}
                  className="p-2 text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-50 rounded-md transition"
                  title="Hapus Bab"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Tambah/Edit Bab */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="bg-[var(--card)] w-full max-w-md p-5 md:p-6 rounded-xl border border-[var(--border)] shadow-lg relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition"
            >
              <X size={20} />
            </button>

            <h3 className="text-lg md:text-xl font-bold mb-6 text-[var(--foreground)] pr-6">
              {modalMode === "add" ? "Tambah Bab Baru" : "Edit Bab"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Judul Bab
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Contoh: Bab 1: Pengenalan HTML..."
                  className="w-full p-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-sm md:text-base"
                  required
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 mt-6 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-[var(--foreground)] bg-[var(--muted)] rounded-lg hover:bg-opacity-80 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] bg-[var(--primary)] rounded-lg hover:opacity-90 transition"
                >
                  {modalMode === "add" ? "Simpan Bab" : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Upload PDF */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="bg-[var(--card)] w-full max-w-md p-5 md:p-6 rounded-xl border border-[var(--border)] shadow-lg relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeUploadModal}
              className="absolute top-4 right-4 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition"
            >
              <X size={20} />
            </button>

            <h3 className="text-lg md:text-xl font-bold mb-6 text-[var(--foreground)] pr-6">
              Upload PDF Buku
            </h3>

            <form onSubmit={submitUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Pilih File PDF
                </label>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  className="w-full p-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-sm md:text-base file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[var(--primary)] file:bg-opacity-10 file:text-[var(--primary)] hover:file:bg-opacity-20 transition-all cursor-pointer"
                  required
                />
                {selectedFile && (
                  <p className="mt-3 text-sm text-[var(--muted-foreground)]">
                    File terpilih:{" "}
                    <span className="font-medium text-[var(--foreground)]">
                      {selectedFile.name}
                    </span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Jumlah Soal per Bab
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={jumlahSoal}
                  onChange={(e) => setJumlahSoal(Number(e.target.value))}
                  className="w-full p-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-sm md:text-base"
                  required
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 mt-6 pt-4">
                <button
                  type="button"
                  onClick={closeUploadModal}
                  className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-[var(--foreground)] bg-[var(--muted)] rounded-lg hover:bg-opacity-80 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!selectedFile}
                  className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] bg-[var(--primary)] rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Upload File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
