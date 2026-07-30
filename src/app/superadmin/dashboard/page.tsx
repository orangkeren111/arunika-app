"use client";

import React, { useState } from "react";
import {
  School,
  Plus,
  X,
  Edit2,
  Trash2,
  Users,
  Award,
  MapPin,
  ArrowRight,
} from "lucide-react";
import { useSuperadminDashboardViewModel } from "./SuperadminDashboardViewModel";

export default function SuperadminDashboardPage() {
  const {
    schools,
    loading,
    selectedSchool,
    setSelectedSchool,
    members,
    loadingMembers,
    viewSchoolMembers,
    handleCreateSchool,
    handleUpdateSchool,
    handleDeleteSchool,
  } = useSuperadminDashboardViewModel();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
  });

  const openAddModal = () => {
    setModalMode("add");
    setFormData({ name: "", address: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (school: any) => {
    setModalMode("edit");
    setEditingId(school.id.toString());
    setFormData({
      name: school.name,
      address: school.address,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: "", address: "" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === "add") {
      handleCreateSchool(formData.name, formData.address);
    } else if (modalMode === "edit" && editingId) {
      handleUpdateSchool(editingId, formData.name, formData.address);
    }
    closeModal();
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-[var(--muted-foreground)]">
        Memuat data dashboard superadmin...
      </div>
    );
  }

  return (
    <div className="space-y-6 relative px-4 md:px-0 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--foreground)] tracking-tight">
            Dashboard Pengelolaan Sekolah
          </h1>
          <p className="text-[var(--muted-foreground)] mt-1 text-sm md:text-base">
            Pantau konsumsi token kecerdasan buatan (AI) dan kelola data penyewa (sekolah).
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2.5 rounded-lg text-sm font-semibold hover:opacity-95 shadow transition-all"
        >
          <Plus size={18} /> Tambah Sekolah
        </button>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {schools.map((school) => (
          <div
            key={school.id}
            className="bg-[var(--card)] p-6 rounded-xl border border-[var(--border)] hover:border-[var(--primary)] transition shadow-sm flex flex-col justify-between h-full group relative"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-[var(--primary)]/10 text-[var(--primary)] rounded-lg">
                    <School size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[var(--card-foreground)]">
                      {school.name}
                    </h3>
                    <span className="inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)] mt-1">
                      <MapPin size={12} /> {school.address || "Tidak ada alamat"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Token Spent Highlight */}
              <div className="bg-[var(--muted)]/50 p-4 rounded-lg flex items-center justify-between border border-[var(--border)]">
                <div>
                  <p className="text-[10px] uppercase font-bold text-[var(--muted-foreground)] tracking-wider">
                    Total Token Terpakai
                  </p>
                  <p className="text-xl font-extrabold text-[var(--primary)] mt-0.5">
                    {school.totalTokensSpent.toLocaleString("id-ID")}
                  </p>
                </div>
                <Award size={24} className="text-[var(--primary)] opacity-80" />
              </div>

              {/* School Roster Statistics */}
              <div className="grid grid-cols-2 gap-4 text-center pt-2">
                <div className="bg-[var(--muted)]/30 p-2.5 rounded-lg border border-[var(--border)]/50">
                  <p className="text-sm font-bold text-[var(--foreground)]">{school.userCount}</p>
                  <p className="text-[10px] text-[var(--muted-foreground)] uppercase">Anggota</p>
                </div>
                <div className="bg-[var(--muted)]/30 p-2.5 rounded-lg border border-[var(--border)]/50">
                  <p className="text-sm font-bold text-[var(--foreground)]">{school.classCount}</p>
                  <p className="text-[10px] text-[var(--muted-foreground)] uppercase">Kelas</p>
                </div>
              </div>
            </div>

            {/* Actions Card Footer */}
            <div className="mt-6 border-t border-[var(--border)] pt-4 flex justify-between items-center">
              <button
                onClick={() => viewSchoolMembers(school)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--primary)] hover:underline"
              >
                Lihat Anggota <ArrowRight size={14} />
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => openEditModal(school)}
                  className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--muted)] rounded transition"
                  title="Edit Sekolah"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDeleteSchool(school.id.toString())}
                  className="p-1.5 text-[var(--muted-foreground)] hover:text-red-500 hover:bg-[var(--muted)] rounded transition"
                  title="Hapus Sekolah"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- ADD / EDIT SCHOOL MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-[var(--card)] w-full max-w-md p-6 rounded-xl border border-[var(--border)] shadow-xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-bold mb-6 text-[var(--foreground)] pr-6">
              {modalMode === "add" ? "Tambah Sekolah Baru" : "Edit Informasi Sekolah"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[var(--foreground)] mb-1">
                  Nama Sekolah
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: SMA Negeri 1 Surabaya..."
                  className="w-full p-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] text-sm focus:ring-2 focus:ring-[var(--primary)]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--foreground)] mb-1">
                  Alamat Sekolah
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Masukkan alamat lengkap sekolah..."
                  rows={3}
                  className="w-full p-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] text-sm focus:ring-2 focus:ring-[var(--primary)] resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-[var(--foreground)] bg-[var(--muted)] rounded-lg hover:bg-opacity-80 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-bold text-white bg-[var(--primary)] rounded-lg hover:opacity-90 transition"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MEMBERS DETAILS LIST MODAL --- */}
      {selectedSchool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-[var(--card)] w-full max-w-xl p-6 rounded-xl border border-[var(--border)] shadow-xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedSchool(null)}
              className="absolute top-4 right-4 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-bold mb-2 text-[var(--foreground)] pr-6">
              Anggota Sekolah: {selectedSchool.name}
            </h3>
            <p className="text-xs text-[var(--muted-foreground)] mb-6">
              Daftar guru, admin sekolah, dan siswa yang terdaftar di sekolah ini.
            </p>

            <div className="space-y-4">
              {loadingMembers ? (
                <p className="text-center text-sm text-[var(--muted-foreground)] p-4">Memuat anggota...</p>
              ) : members.length === 0 ? (
                <p className="text-center text-sm text-[var(--muted-foreground)] p-4">Belum ada anggota terdaftar di sekolah ini.</p>
              ) : (
                <div className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--background)] max-h-[50vh] overflow-y-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-[var(--muted)] text-[var(--foreground)] border-b border-[var(--border)]">
                      <tr>
                        <th className="p-3 font-bold">Nama</th>
                        <th className="p-3 font-bold">Email</th>
                        <th className="p-3 font-bold text-center">Role</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {members.map((member) => (
                        <tr key={member.id} className="hover:bg-[var(--muted)]/20 transition-colors">
                          <td className="p-3 font-medium text-[var(--card-foreground)]">{member.name}</td>
                          <td className="p-3 text-[var(--muted-foreground)]">{member.email}</td>
                          <td className="p-3 text-center">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                member.role === "ADMIN"
                                  ? "bg-blue-100 text-blue-800"
                                  : member.role === "GURU"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {member.role}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-6 border-t border-[var(--border)] mt-4">
              <button
                type="button"
                onClick={() => setSelectedSchool(null)}
                className="px-4 py-2 text-sm font-semibold text-[var(--primary-foreground)] bg-[var(--primary)] rounded-lg hover:opacity-90 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
