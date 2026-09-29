"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";

import {
  Plus,
  Edit2,
  Trash2,
  X,
  Upload,
  KeyRound,
  Eye,
  FileSpreadsheet,
  Download,
} from "lucide-react";

import { useUsersViewModel } from "./UsersViewModel";
import { Role, UserImportRow } from "../../types/admin";

interface UserFormData {
  id: number;
  name: string;
  email: string;
  password: string;
  role: Role;
}

export default function UsersPage() {
  const {
    users,
    loading,
    actionLoading,
    handleDelete,
    handleAdd,
    handleEdit,
    handleResetPassword,
    handleBatchImport,
  } = useUsersViewModel();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [formData, setFormData] = useState<UserFormData>({
    id: 0,
    name: "",
    email: "",
    password: "",
    role: "SISWA",
  });

  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importRows, setImportRows] = useState<UserImportRow[]>([]);
  const [importError, setImportError] = useState("");
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetUserId, setResetUserId] = useState<number | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openAddModal = () => {
    setModalMode("add");
    setFormData({
      id: 0,
      name: "",
      email: "",
      password: "",
      role: "SISWA",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (user: any) => {
    setModalMode("edit");
    setFormData({
      id: user.id,
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formData.name.trim()) {
      alert("Nama wajib diisi.");
      return;
    }

    if (!formData.email.trim()) {
      alert("Username/email wajib diisi.");
      return;
    }

    if (modalMode === "add") {
      if (!formData.password) {
        alert("Password wajib diisi.");
        return;
      }
      await handleAdd(formData.name, formData.role, formData.email, formData.password);
    } else {
      await handleEdit(formData.id, {
        name: formData.name,
        email: formData.email,
        role: formData.role,
      });
    }
    setIsModalOpen(false);
  };

  const openResetPassword = (id: number) => {
    setResetUserId(id);
    setResetPassword("");
    setIsResetOpen(true);
  };

  const submitResetPassword = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!resetUserId) return;

    if (resetPassword.length < 6) {
      alert("Password minimal 6 karakter.");
      return;
    }

    await handleResetPassword(resetUserId, resetPassword);
    setIsResetOpen(false);
    setResetUserId(null);
    setResetPassword("");
  };

  const normalizeRole = (value: unknown): Role | null => {
    const role = String(value ?? "").trim().toUpperCase();
    if (role === "SISWA" || role === "STUDENT") return "SISWA";
    if (role === "GURU" || role === "TEACHER") return "GURU";
    return null;
  };

  const handleExcelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportError("");
    setImportRows([]);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
        defval: "",
      });

      if (rawRows.length === 0) {
        throw new Error("Excel tidak memiliki data.");
      }

      const rows: UserImportRow[] = [];

      for (let index = 0; index < rawRows.length; index++) {
        const raw = rawRows[index];

        const email = String(raw.email ?? raw.Email ?? raw.EMAIL ?? "").trim();
        const name = String(raw.name ?? raw.Name ?? raw.NAME ?? "").trim();
        const password = String(raw.password ?? raw.Password ?? raw.PASSWORD ?? "");
        const role = normalizeRole(raw.role ?? raw.Role ?? raw.ROLE);

        if (!email) throw new Error(`Baris ${index + 2}: email wajib diisi.`);
        if (!name) throw new Error(`Baris ${index + 2}: name wajib diisi.`);
        if (!password) throw new Error(`Baris ${index + 2}: password wajib diisi.`);
        if (!role) throw new Error(`Baris ${index + 2}: role harus SISWA/STUDENT atau GURU/TEACHER.`);

        rows.push({ email, name, password, role });
      }

      setImportRows(rows);
    } catch (error: any) {
      setImportError(error?.message || "Gagal membaca file Excel.");
    }
    event.target.value = "";
  };

  const submitImport = async () => {
    if (importRows.length === 0) return;

    const success = await handleBatchImport(importRows);
    if (success) {
      setImportRows([]);
      setIsImportOpen(false);
    }
  };

  return (
    <div className="space-y-6 text-foreground">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pengguna</h1>
          <p className="text-sm text-muted-foreground">Kelola guru dan siswa.</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setIsImportOpen(true)}
            disabled={actionLoading}
            className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
          >
            <Upload size={18} />
            Import Excel
          </button>

          <button
            onClick={openAddModal}
            disabled={actionLoading}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Plus size={18} />
            Tambah Pengguna
          </button>
        </div>
      </div>

      {/* TABLE */}
      {loading ? (
        <div className="rounded-xl border border-border bg-background p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <p className="text-muted-foreground">Memuat data pengguna...</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Nama</th>
                <th className="px-4 py-3 text-left font-medium">Username / Email</th>
                <th className="px-4 py-3 text-left font-medium">Role</th>
                <th className="px-4 py-3 text-right font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-border">
                  <td className="px-4 py-3">{user.name}</td>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="rounded-lg p-2 hover:bg-accent hover:text-accent-foreground"
                        title="Detail"
                      >
                        <Eye size={17} />
                      </Link>

                      <button
                        onClick={() => openEditModal(user)}
                        className="rounded-lg p-2 hover:bg-accent hover:text-accent-foreground"
                        title="Edit"
                      >
                        <Edit2 size={17} />
                      </button>

                      <button
                        onClick={() => openResetPassword(user.id)}
                        className="rounded-lg p-2 hover:bg-accent hover:text-accent-foreground"
                        title="Reset password"
                      >
                        <KeyRound size={17} />
                      </button>

                      <button
                        onClick={() => {
                          if (window.confirm(`Hapus pengguna ${user.name}?`)) {
                            handleDelete(user.id);
                          }
                        }}
                        className="rounded-lg p-2 text-red-500 hover:bg-red-500/10"
                        title="Hapus"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {users.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    Belum ada pengguna.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-xl text-foreground">
            <div className="flex items-center justify-between border-b border-border p-5">
              <h2 className="text-lg font-semibold">
                {modalMode === "add" ? "Tambah Pengguna" : "Edit Pengguna"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded p-1 hover:bg-accent hover:text-accent-foreground"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-5">
              <div>
                <label className="mb-1 block text-sm font-medium">Nama</label>
                <input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Username / Email
                </label>
                <input
                  type="text"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {modalMode === "add" && (
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Password
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value as Role })
                  }
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="SISWA">Siswa</option>
                  <option value="GURU">Guru</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {actionLoading ? "Menyimpan..." : "Simpan"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {isResetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-border bg-background shadow-xl text-foreground">
            <div className="flex items-center justify-between border-b border-border p-5">
              <h2 className="text-lg font-semibold">Reset Password</h2>
              <button
                onClick={() => setIsResetOpen(false)}
                className="rounded p-1 hover:bg-accent hover:text-accent-foreground"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={submitResetPassword} className="space-y-4 p-5">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Password Baru
                </label>
                <input
                  type="password"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Minimal 6 karakter"
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {actionLoading ? "Menyimpan..." : "Reset Password"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EXCEL IMPORT MODAL */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-16 backdrop-blur-sm">
          <div className="w-full max-w-4xl rounded-xl border border-border bg-background shadow-xl text-foreground">
            <div className="flex items-center justify-between border-b border-border p-5">
              <div className="flex items-center gap-3">
                <FileSpreadsheet />
                <div>
                  <h2 className="text-lg font-semibold">Import Pengguna</h2>
                  <p className="text-sm text-muted-foreground">
                    email, name, password, role
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsImportOpen(false);
                  setImportRows([]);
                  setImportError("");
                }}
                className="rounded p-1 hover:bg-accent hover:text-accent-foreground"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Format Excel</p>
                <p className="mt-1">
                  Kolom wajib:
                  <strong className="text-foreground">
                    {" "}email, name, password, role
                  </strong>
                </p>
                <p className="mt-1">
                  Role yang diterima:
                  <strong className="text-foreground">
                    {" "}SISWA / STUDENT / GURU / TEACHER
                  </strong>
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleExcelUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border p-8 hover:bg-accent hover:text-accent-foreground"
                >
                  <Upload size={20} />
                  Pilih File Excel
                </button>

                <a
                  href="/template/TemplateUploadUser.xlsx"
                  download="TemplateUploadUser.xlsx"
                  className="flex items-center justify-center gap-2 text-sm text-primary hover:underline"
                >
                  <Download size={16} />
                  Unduh Template Excel
                </a>
              </div>
            </div>

            {importError && (
              <div className="mx-5 mb-5 rounded-lg bg-destructive/15 p-4 text-sm text-destructive">
                {importError}
              </div>
            )}

            {importRows.length > 0 && (
              <div className="mx-5 mb-5 overflow-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Email</th>
                      <th className="px-3 py-2 text-left font-medium">Nama</th>
                      <th className="px-3 py-2 text-left font-medium">Password</th>
                      <th className="px-3 py-2 text-left font-medium">Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importRows.map((row, index) => (
                      <tr key={index} className="border-t border-border">
                        <td className="px-3 py-2">{row.email}</td>
                        <td className="px-3 py-2">{row.name}</td>
                        <td className="px-3 py-2 text-muted-foreground">••••••••</td>
                        <td className="px-3 py-2">{row.role}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end gap-2 border-t border-border p-5">
              <button
                onClick={() => setIsImportOpen(false)}
                className="rounded-lg border border-input bg-background px-4 py-2 hover:bg-accent hover:text-accent-foreground"
              >
                Batal
              </button>

              <button
                onClick={submitImport}
                disabled={actionLoading || importRows.length === 0}
                className="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {actionLoading
                  ? "Mengimport..."
                  : `Import ${importRows.length} Pengguna`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}