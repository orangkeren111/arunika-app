"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Plus, BookOpen, Pencil, Trash2, X } from "lucide-react";
import { useBukuViewModel } from "./GuruBukuViewModel";

export default function BukuPage() {
  const { bukuList, handleAddBuku, handleEditBuku, handleDeleteBuku } =
    useBukuViewModel();

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
            Kelola bank soal Anda berdasarkan buku dan bab.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 rounded-lg hover:opacity-90 transition w-full sm:w-auto"
        >
          <Plus size={18} /> Buat Buku Baru
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bukuList.map((buku) => {
          const isProcessing = buku.jobStatus ? ["PENDING", "PROCESSING_PDF", "GENERATING_QUESTIONS"].includes(buku.jobStatus) : false;
          return (
            <div
              key={buku.id}
              className={`bg-[var(--card)] p-6 rounded-xl border border-[var(--border)] transition shadow-sm flex flex-col h-full group relative ${
                isProcessing ? "opacity-60 pointer-events-none select-none border-dashed" : "hover:border-[var(--primary)]"
              }`}
            >
              {/* Header Item & Action Buttons */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-[var(--muted)] text-[var(--primary)] rounded-lg relative">
                    <BookOpen size={24} />
                    {isProcessing && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                      </span>
                    )}
                  </div>
                  {isProcessing ? (
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--card-foreground)] line-clamp-2">
                        {buku.title}
                      </h3>
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">
                        Sedang Diproses AI...
                      </span>
                    </div>
                  ) : (
                    <Link
                      href={`/guru/buku/${buku.id}`}
                      className="hover:underline"
                    >
                      <h3 className="text-lg font-semibold text-[var(--card-foreground)] line-clamp-2">
                        {buku.title}
                      </h3>
                    </Link>
                  )}
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

            <p className="text-sm text-[var(--muted-foreground)] mb-4 flex-grow line-clamp-3">
              {buku.description}
            </p>

            <div className="flex justify-between items-center text-sm font-medium pt-4 border-t border-[var(--border)]">
              <span className="text-[var(--secondary)]">
                {buku.chapterCount} Bab Materi
              </span>
              {/* {buku.mapel && (
                <span className="bg-[var(--muted)] text-[var(--muted-foreground)] px-2.5 py-1 rounded-md text-xs">
                  {buku.mapel}
                </span>
              )} */}
            </div>
          </div>
        );
      })}
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
