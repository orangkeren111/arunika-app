"use client";

import React, { use, useState } from "react";
import Link from "next/link";
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
} from "lucide-react";
import { useBabViewModel } from "./GuruBukuBabViewModel";

export default function BabPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const {
    buku,
    babList,
    handleAddBab,
    handleEditBab,
    handleDeleteBab,
    handleUploadBook,
    handleViewBook,
  } = useBabViewModel(resolvedParams.id);

  // State untuk modal Bab
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedBabId, setSelectedBabId] = useState<string | null>(null);

  // State untuk modal Upload PDF
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    title: "",
  });

  const openAddModal = () => {
    setModalMode("add");
    setFormData({ title: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (bab: any) => {
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
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const submitUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFile) {
      handleUploadBook(selectedFile);
      closeUploadModal();
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
          <button
            onClick={handleViewBook}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 border border-[var(--primary)] text-[var(--primary)] px-3 py-2 rounded-lg hover:bg-[var(--primary)] hover:bg-opacity-10 transition text-sm md:text-base whitespace-nowrap"
          >
            <FileText size={18} /> Lihat PDF
          </button>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 border border-[var(--border)] text-[var(--foreground)] bg-[var(--card)] px-3 py-2 rounded-lg hover:bg-[var(--muted)] transition text-sm md:text-base whitespace-nowrap"
          >
            <Upload size={18} /> Upload PDF
          </button>
          <button
            onClick={openAddModal}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 rounded-lg hover:opacity-90 transition text-sm md:text-base"
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
