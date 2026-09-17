"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  School,
  Plus,
  X,
  Edit2,
  MapPin,
  ArrowRight,
  UserPlus,
  Power,
  BarChart2,
  ShieldCheck,
  ShieldAlert,
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
    handleToggleSchoolStatus,
  } = useSuperadminDashboardViewModel();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    tingkat: "",
    adminName: "",
    adminEmail: "",
    adminPassword: "",
  });

  const openAddModal = () => {
    setModalMode("add");
    setFormData({
      name: "",
      address: "",
      tingkat: "",
      adminName: "",
      adminEmail: "",
      adminPassword: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (school: any) => {
    setModalMode("edit");
    setEditingId(school.id.toString());
    setFormData({
      name: school.name,
      address: school.address,
      tingkat: school.tingkat,
      adminName: "",
      adminEmail: "",
      adminPassword: "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({
      name: "",
      address: "",
      tingkat: "",
      adminName: "",
      adminEmail: "",
      adminPassword: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === "add") {
      handleCreateSchool(formData.name, formData.address, formData.tingkat, {
        name: formData.adminName,
        email: formData.adminEmail,
        password: formData.adminPassword,
      });
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
            Pengelolaan Sekolah & Penyewa
          </h1>
          <p className="text-[var(--muted-foreground)] mt-1 text-sm md:text-base">
            Pantau status sekolah, penggunaan AI token, dan kelola akun administrator.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2.5 rounded-lg text-sm font-semibold hover:opacity-95 shadow transition-all"
        >
          <Plus size={18} /> Tambah Sekolah Baru
        </button>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {schools.map((school) => (
          <div
            key={school.id}
            className={`bg-[var(--card)] p-6 rounded-xl border transition shadow-sm flex flex-col justify-between h-full relative ${school.isRetired
              ? "border-red-200 dark:border-red-900/40 bg-red-50/20 dark:bg-red-950/10"
              : "border-[var(--border)] hover:border-[var(--primary)]"
              }`}
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-3 rounded-lg ${school.isRetired
                      ? "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400"
                      : "bg-[var(--primary)]/10 text-[var(--primary)]"
                      }`}
                  >
                    <School size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[var(--card-foreground)]">
                      {school.name}
                    </h3>
                    <span className="inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)] mt-0.5">
                      <MapPin size={12} /> {school.address || "Tidak ada alamat"}
                    </span>
                  </div>
                </div>

                {/* Status Toggle Badge */}
                <button
                  onClick={() => handleToggleSchoolStatus(school.id.toString(), school.isRetired)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition ${school.isRetired
                    ? "bg-red-100 text-red-700 border-red-300 hover:bg-red-200 dark:bg-red-950/80 dark:text-red-300 dark:border-red-800"
                    : "bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800"
                    }`}
                  title={school.isRetired ? "Klik untuk mengaktifkan" : "Klik untuk menonaktifkan"}
                >
                  {school.isRetired ? (
                    <>
                      <ShieldAlert size={13} /> Nonaktif
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={13} /> Aktif
                    </>
                  )}
                </button>
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
                <BarChart2 size={24} className="text-[var(--primary)] opacity-80" />
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
            <div className="mt-6 border-t border-[var(--border)] pt-4 flex justify-between items-center gap-2">
              <Link
                href={`/superadmin/schools/${school.id}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold bg-[var(--primary)] text-white px-3 py-1.5 rounded-md hover:opacity-90 transition shadow-sm"
              >
                Detail & Statistik <ArrowRight size={13} />
              </Link>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEditModal(school)}
                  className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--muted)] rounded transition"
                  title="Edit Informasi Sekolah"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleToggleSchoolStatus(school.id.toString(), school.isRetired)}
                  className={`p-1.5 rounded transition ${school.isRetired
                    ? "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                    : "text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                    }`}
                  title={school.isRetired ? "Aktifkan Sekolah" : "Nonaktifkan Sekolah"}
                >
                  <Power size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- ADD / EDIT SCHOOL MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-[var(--card)] w-full max-w-lg p-6 rounded-xl border border-[var(--border)] shadow-xl relative max-h-[90vh] overflow-y-auto">
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
                  Nama Sekolah <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: SMA Negeri 1 Surabaya..."
                  className="w-full p-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] text-sm focus:ring-2 focus:ring-[var(--primary)]"
                  required
                />
                <select
                  value={formData.tingkat}
                  onChange={(e) => setFormData({ ...formData, tingkat: e.target.value })}
                  className="w-full p-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] text-sm focus:ring-2 focus:ring-[var(--primary)]"
                  required
                >
                  <option value="SD">SD</option>
                  <option value="SMP">SMP</option>
                  <option value="SMA">SMA</option>
                  <option value="Kuliah">Kuliah</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--foreground)] mb-1">
                  Alamat Sekolah
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Masukkan alamat lengkap sekolah..."
                  rows={2}
                  className="w-full p-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] text-sm focus:ring-2 focus:ring-[var(--primary)] resize-none"
                />
              </div>

              {/* Admin User Section for New School */}
              {modalMode === "add" && (
                <div className="border-t border-[var(--border)] pt-4 mt-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-[var(--primary)]">
                    <UserPlus size={16} /> Akun Admin Sekolah Utama
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Tentukan administrator awal untuk mengelola sekolah ini.
                  </p>

                  <div>
                    <label className="block text-xs font-medium text-[var(--foreground)] mb-1">
                      Nama Admin <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.adminName}
                      onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                      placeholder="Nama lengkap admin"
                      className="w-full p-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--foreground)] mb-1">
                      Email Admin <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.adminEmail}
                      onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                      placeholder="admin@sekolah.sch.id"
                      className="w-full p-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--foreground)] mb-1">
                      Password Admin
                    </label>
                    <input
                      type="password"
                      value={formData.adminPassword}
                      onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                      placeholder="Default: admin123"
                      className="w-full p-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] text-sm"
                    />
                  </div>
                </div>
              )}

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
                  {modalMode === "add" ? "Buat Sekolah & Admin" : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
