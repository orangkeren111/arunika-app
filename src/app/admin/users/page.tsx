"use client";

import React, { useState } from "react";
import { Plus, Edit2, Trash2, X } from "lucide-react";
import { useUsersViewModel } from "./UsersViewModel";
import { Role, User } from "../../types/admin";

interface UserFormData {
  id: number;
  name: string;
  email: string;
  role: Role;
}
export default function UsersPage() {
  const { users, handleDelete, handleAdd, handleEdit } = useUsersViewModel();

  // State untuk mengontrol Modal & Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // 'add' atau 'edit'
  const [formData, setFormData] = useState<UserFormData>({
    id: 0,
    name: "",
    email: "",
    role: "SISWA",
  });

  // Handler untuk membuka modal Tambah
  const openAddModal = () => {
    setModalMode("add");
    setFormData({ id: 0, name: "", email: "", role: "SISWA" });
    setIsModalOpen(true);
  };

  // Handler untuk membuka modal Edit
  const openEditModal = (user: User) => {
    setModalMode("edit");
    setFormData({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
    setIsModalOpen(true);
  };

  // Handler untuk submit form pada modal
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const currentRole = formData.role as "GURU" | "SISWA";
    if (modalMode === "add") {
      handleAdd(formData.name, currentRole, formData.email);
    } else {
      handleEdit(formData.id, {
        name: formData.name,
        role: currentRole,
        email: formData.email,
      });
    }
    setIsModalOpen(false); // Tutup modal setelah submit
  };

  // Handler untuk Delete dengan konfirmasi
  const confirmDelete = (id: number) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus pengguna ini?")) {
      handleDelete(id);
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            Manajemen Pengguna
          </h1>
          <p className="text-[var(--muted-foreground)] mt-1">
            Kelola data Guru dan Siswa di platform ini.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 rounded-lg hover:opacity-90 transition"
        >
          <Plus size={18} /> Tambah Pengguna
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[var(--muted)] text-[var(--muted-foreground)] border-b border-[var(--border)]">
              <th className="p-4 font-medium">Nama Lengkap</th>
              <th className="p-4 font-medium">Email</th>
              <th className="p-4 font-medium">Peran</th>
              <th className="p-4 font-medium text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-b border-[var(--border)] last:border-0 text-[var(--card-foreground)]"
              >
                <td className="p-4">{user.name}</td>
                <td className="p-4">{user.email}</td>
                <td className="p-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${user.role === "GURU" ? "bg-[var(--info)] bg-opacity-20 text-[var(--info)]" : "bg-[var(--success)] bg-opacity-20 text-[var(--success)]"}`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="p-4 flex justify-end gap-2">
                  <button
                    onClick={() => openEditModal(user)}
                    className="p-2 text-[var(--muted-foreground)] hover:text-[var(--primary)] transition"
                    title="Edit Pengguna"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => confirmDelete(user.id)}
                    className="p-2 text-[var(--muted-foreground)] hover:text-[var(--error)] transition"
                    title="Hapus Pengguna"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Popup Section */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-[var(--card)] w-full max-w-md rounded-xl shadow-lg border border-[var(--border)] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-[var(--border)]">
              <h2 className="text-lg font-bold text-[var(--foreground)]">
                {modalMode === "add" ? "Tambah Pengguna" : "Edit Pengguna"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  placeholder="Masukkan nama lengkap"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  placeholder="Masukkan email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Peran (Role)
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      role: e.target.value as "GURU" | "SISWA",
                    })
                  }
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                >
                  <option value="SISWA">Siswa</option>
                  <option value="GURU">Guru</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)] transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition"
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
