"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Plus, Edit2, Trash2, Users, X } from "lucide-react";
import { useKelasViewModel } from "./KelasViewModel";

export default function KelasPage() {
  // Asumsi: ViewModel sekarang mengembalikan array `teachers`
  const { kelas, teachers, handleDelete, handleAdd, handleEdit } =
    useKelasViewModel();

  // State untuk mengelola Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // State untuk form
  const [formData, setFormData] = useState({
    name: "",
    teacherId: "",
    isActive: true,
  });

  // Handler untuk membuka modal Tambah Kelas
  const openAddModal = () => {
    setModalMode("add");
    setSelectedId(null);
    setFormData({ name: "", teacherId: "", isActive: true });
    setIsModalOpen(true);
  };

  // Handler untuk membuka modal Edit Kelas
  const openEditModal = (k: any) => {
    setModalMode("edit");
    setSelectedId(k.id);
    setFormData({
      name: k.name,
      teacherId: k.teacherId || "",
      isActive: k.isActive !== false, // Default true jika tidak ada data
    });
    setIsModalOpen(true);
  };

  // Handler saat form disubmit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === "add") {
      handleAdd(formData.name, parseInt(formData.teacherId));
    } else if (modalMode === "edit" && selectedId) {
      handleEdit(parseInt(selectedId), {
        ...formData,
        teacherId: parseInt(formData.teacherId),
      });
    }
    setIsModalOpen(false);
  };

  // Handler untuk delete dengan konfirmasi
  const confirmDelete = (id: number) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus kelas ini?")) {
      handleDelete(id);
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            Daftar Kelas
          </h1>
          <p className="text-[var(--muted-foreground)] mt-1">
            Kelola kelas, rombongan belajar, dan penugasan.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 rounded-lg hover:opacity-90 transition"
        >
          <Plus size={18} /> Tambah Kelas
        </button>
      </div>

      {/* Grid Kelas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kelas.map((k) => (
          <div
            key={k.id}
            className="bg-[var(--card)] p-6 rounded-xl border border-[var(--border)] flex flex-col h-full shadow-sm relative overflow-hidden"
          >
            {/* Indikator Status Aktif/Nonaktif */}
            {/* <div
              className={`absolute top-0 left-0 w-1 h-full ${k.isActive !== false ? "bg-green-500" : "bg-red-500"}`}
            /> */}

            <div className="flex justify-between items-start mb-4 pl-2">
              <div>
                <h3 className="text-xl font-semibold text-[var(--card-foreground)]">
                  {k.name}
                </h3>
                {/* <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${k.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {k.isActive !== false ? 'Aktif' : 'Nonaktif'}
                </span> */}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => openEditModal(k)}
                  className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--primary)] transition"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => confirmDelete(k.id)}
                  className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--error)] transition"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="space-y-2 mb-6 flex-grow text-sm pl-2">
              <div className="flex justify-between text-[var(--muted-foreground)]">
                <span>Wali Kelas:</span>
                <span className="font-medium text-[var(--foreground)]">
                  {k.teacherName ?? "Belum Ada"}
                </span>
              </div>
              <div className="flex justify-between text-[var(--muted-foreground)]">
                <span>Jumlah Siswa:</span>
                <span className="font-medium text-[var(--foreground)]">
                  {k.studentCount} Siswa
                </span>
              </div>
            </div>

            <Link
              href={`/admin/kelas/${k.id}/members`}
              className="w-full bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--secondary)] hover:text-[var(--secondary-foreground)] py-2.5 rounded-lg transition font-medium flex justify-center items-center gap-2"
            >
              Kelola Anggota <Users size={16} />
            </Link>
          </div>
        ))}
      </div>

      {/* Modal / Popup Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex justify-center items-center p-4 backdrop-blur-sm">
          <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl w-full max-w-md shadow-lg overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-[var(--border)]">
              <h2 className="text-lg font-bold text-[var(--foreground)]">
                {modalMode === "add" ? "Tambah Kelas Baru" : "Edit Kelas"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Input Nama Kelas */}
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Nama Kelas
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full p-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary)] outline-none"
                  placeholder="Contoh: X IPA 1"
                  required
                />
              </div>

              {/* Select Wali Kelas */}
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Wali Kelas
                </label>
                <select
                  value={formData.teacherId}
                  onChange={(e) =>
                    setFormData({ ...formData, teacherId: e.target.value })
                  }
                  className="w-full p-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary)] outline-none"
                >
                  <option value="">-- Pilih Wali Kelas --</option>
                  {/* Mapping dari array teachers di ViewModel */}
                  {teachers?.map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Checkbox Status Aktif */}
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="w-4 h-4 text-[var(--primary)] rounded border-[var(--border)]"
                />
                <label
                  htmlFor="isActive"
                  className="text-sm font-medium text-[var(--foreground)] cursor-pointer"
                >
                  Kelas Aktif
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-[var(--muted)] text-[var(--muted-foreground)] rounded-lg hover:text-[var(--foreground)] transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:opacity-90 transition"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
