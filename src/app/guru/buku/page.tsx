"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Plus,
  BookOpen,
  Pencil,
  Trash2,
  X,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useBukuViewModel } from "./GuruBukuViewModel";

export default function BukuPage() {
  const {
    filteredBukuList,
    activeFilter,
    setActiveFilter,

    search,
    setSearch,

    page,
    setPage,
    pagination,

    handleAddBuku,
    handleEditBuku,
    handleDeleteBuku,
  } = useBukuViewModel();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedBukuId, setSelectedBukuId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
  });

  const openAddModal = () => {
    setModalMode("add");
    setFormData({ title: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (buku: any) => {
    setModalMode("edit");
    setSelectedBukuId(buku.id);
    setFormData({
      title: buku.title || "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedBukuId(null);
    setFormData({ title: "" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === "add") {
      handleAddBuku(formData.title, "");
    } else if (modalMode === "edit" && selectedBukuId) {
      handleEditBuku(selectedBukuId, { judul: formData.title, title: formData.title });
    }
    closeModal();
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            Koleksi Buku Materi
          </h1>
          <p className="text-[var(--muted-foreground)] mt-1">
            Kelola bank soal Anda berdasarkan buku, bab, dan tahapan validasi AI.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 rounded-lg hover:opacity-90 transition w-full sm:w-auto text-sm font-medium"
        >
          <Plus size={18} /> Buat Buku Baru
        </button>
      </div>

      {/* FILTER TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[var(--border)]">
        {[
          { id: "ALL", label: "Semua Buku" },
          { id: "NEED_VALIDATION", label: "⚠️ Perlu Validasi" },
          { id: "PROCESSING", label: "⏳ Proses AI" },
          { id: "DONE", label: "✅ Selesai" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${activeFilter === tab.id
              ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
              : "bg-[var(--card)] text-[var(--muted-foreground)] hover:bg-[var(--muted)] border border-[var(--border)]"
              }`}
          >
            {tab.label}
          </button>
        ))}
        {/* SEARCH */}
        <div className="relative max-w-md">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
          />

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari buku..."
            className="w-full pl-10 pr-4 py-2.5 bg-[var(--card)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBukuList.map((buku) => {
          const status = buku.jobStatus;
          const isStage1Validation = status === "WAITING_EXTRACTION_VALIDATION";
          const isStage2Validation = status === "WAITING_CAPTION_VALIDATION";
          const isNeedsValidation = isStage1Validation || isStage2Validation;
          const isProcessing = ["PENDING", "PROCESSING_PDF", "EXTRACTING_IMAGES", "CAPTIONING_IMAGES", "GENERATING_QUESTIONS"].includes(status);

          let badgeContent = null;
          if (isStage1Validation) {
            badgeContent = (
              <span className="text-[11px] bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 px-2.5 py-1 rounded-md font-bold flex items-center gap-1">
                <AlertCircle size={12} /> Validasi Stage 1: Gambar & Kompetensi
              </span>
            );
          } else if (isStage2Validation) {
            badgeContent = (
              <span className="text-[11px] bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 px-2.5 py-1 rounded-md font-bold flex items-center gap-1">
                <AlertCircle size={12} /> Validasi Stage 2: Captions AI
              </span>
            );
          } else if (isProcessing) {
            badgeContent = (
              <span className="text-[11px] bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 px-2.5 py-1 rounded-md font-bold flex items-center gap-1">
                <Clock size={12} className="animate-spin" /> Sedang Diproses AI...
              </span>
            );
          } else {
            badgeContent = (
              <span className="text-[11px] bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 px-2.5 py-1 rounded-md font-semibold flex items-center gap-1">
                <CheckCircle2 size={12} /> Siap / Selesai
              </span>
            );
          }

          return (
            <div
              key={buku.id}
              className={`bg-[var(--card)] p-6 rounded-xl border transition shadow-sm flex flex-col justify-between h-full group relative ${isNeedsValidation
                ? "border-amber-500/80 shadow-amber-500/5 ring-1 ring-amber-500/20"
                : "border-[var(--border)] hover:border-[var(--primary)]"
                }`}
            >
              <div>
                {/* Header Item & Action Buttons */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-[var(--muted)] text-[var(--primary)] rounded-lg relative">
                      <BookOpen size={24} />
                    </div>
                    <div>
                      <Link
                        href={`/guru/buku/${buku.id}`}
                        className="hover:underline"
                      >
                        <h3 className="text-lg font-semibold text-[var(--card-foreground)] line-clamp-2">
                          {buku.title}
                        </h3>
                      </Link>
                      <div className="mt-1">{badgeContent}</div>
                    </div>
                  </div>

                  <div className="flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditModal(buku)}
                      className="p-2 text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--muted)] rounded-md transition"
                      title="Edit Buku"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            "Apakah Anda yakin ingin menghapus buku ini?",
                          )
                        ) {
                          handleDeleteBuku(buku.id);
                        }
                      }}
                      className="p-2 text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-50 rounded-md transition"
                      title="Hapus Buku"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <p className="text-sm text-[var(--muted-foreground)] mb-4 flex-grow line-clamp-2">
                  {buku.description || "Buku referensi pembelajaran & bank soal AI."}
                </p>
              </div>

              <div className="space-y-3 pt-4 border-t border-[var(--border)] mt-2">
                <div className="flex justify-between items-center text-sm font-medium">
                  <span className="text-[var(--secondary)]">
                    {buku.chapterCount} Bab Materi
                  </span>
                </div>

                {/* STAGE VALIDATION ACTION BUTTON */}
                {isStage1Validation && (
                  <Link
                    href={`/guru/buku/${buku.id}/validate-extraction`}
                    className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow-sm"
                  >
                    Validasi Gambar & Kompetensi <ArrowRight size={14} />
                  </Link>
                )}

                {isStage2Validation && (
                  <Link
                    href={`/guru/buku/${buku.id}/validate-captions`}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow-sm"
                  >
                    Validasi Captions AI <ArrowRight size={14} />
                  </Link>
                )}
              </div>
            </div>
          );
        })}
        {pagination.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
            <p className="text-sm text-[var(--muted-foreground)]">
              Menampilkan{" "}
              {Math.min(
                (page - 1) * pagination.limit + 1,
                pagination.total
              )}
              {" - "}
              {Math.min(page * pagination.limit, pagination.total)}
              {" dari "}
              {pagination.total} buku
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((prev) => prev - 1)}
                disabled={page === 1}
                className="p-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--muted)] disabled:opacity-40 disabled:cursor-not-allowed transition"
                aria-label="Halaman sebelumnya"
              >
                <ChevronLeft size={18} />
              </button>

              <span className="px-4 py-2 text-sm font-medium text-[var(--foreground)]">
                Halaman {page} dari {pagination.totalPages}
              </span>

              <button
                onClick={() => setPage((prev) => prev + 1)}
                disabled={page === pagination.totalPages}
                className="p-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--muted)] disabled:opacity-40 disabled:cursor-not-allowed transition"
                aria-label="Halaman berikutnya"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Tambah/Edit Buku */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="bg-[var(--card)] w-full max-w-md p-6 rounded-xl border border-[var(--border)] shadow-lg relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-bold mb-6 text-[var(--foreground)]">
              {modalMode === "add" ? "Buat Buku Baru" : "Edit Buku"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Judul Buku
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Masukkan judul buku..."
                  className="w-full p-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-sm md:text-base"
                  required
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6 pt-4">
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
                  {modalMode === "add" ? "Simpan Buku" : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
