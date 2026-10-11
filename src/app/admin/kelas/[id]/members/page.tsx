"use client";

import React, { use, useRef, useState } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { ArrowLeft, Download, FileSpreadsheet, Plus, Upload, X } from "lucide-react";
import { useMembersViewModel } from "./MembersViewModel";

export default function MembersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);

  const {
    kelasDetail,
    teacher,
    members,
    availableTeachers = [],
    availableStudents = [],
    batchLoading,
    handleRemoveStudent,
    handleAssignTeacher,
    handleAddStudent,
    handleBatchAddStudents,
  } = useMembersViewModel(resolvedParams.id);

  // Single-add modal
  const [activeModal, setActiveModal] = useState<"student" | "teacher" | "batch" | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");

  // Batch upload state
  const [batchRows, setBatchRows] = useState<string[]>([]); // list of usernames
  const [batchError, setBatchError] = useState("");
  const [batchResult, setBatchResult] = useState<{ inserted: number; skipped: number; notFound: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const closeModal = () => {
    setActiveModal(null);
    setSelectedStudentId("");
    setSelectedTeacherId("");
    setBatchRows([]);
    setBatchError("");
    setBatchResult(null);
  };

  // --- Excel parsing for batch member upload ---
  const handleExcelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setBatchError("");
    setBatchRows([]);
    setBatchResult(null);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
        defval: "",
      });

      if (rawRows.length === 0) {
        throw new Error("File Excel tidak memiliki data.");
      }

      const usernames: string[] = [];

      for (let i = 0; i < rawRows.length; i++) {
        const raw = rawRows[i];
        const username = String(
          raw.username ?? raw.Username ?? raw.USERNAME ??
          raw.email ?? raw.Email ?? raw.EMAIL ?? ""
        ).trim();

        if (!username) {
          throw new Error(`Baris ${i + 2}: username/email wajib diisi.`);
        }

        usernames.push(username);
      }

      setBatchRows(usernames);
    } catch (error: any) {
      setBatchError(error?.message || "Gagal membaca file Excel.");
    }

    event.target.value = "";
  };

  const submitBatch = async () => {
    if (batchRows.length === 0) return;
    try {
      const result = await handleBatchAddStudents(batchRows);
      setBatchResult(result);
      setBatchRows([]);

      let msg = `${result.inserted} siswa berhasil ditambahkan.`;
      if (result.skipped > 0) msg += ` ${result.skipped} sudah menjadi anggota (dilewati).`;
      if (result.notFound.length > 0)
        msg += ` ${result.notFound.length} username/email tidak ditemukan: ${result.notFound.join(", ")}.`;

      alert(msg);
      closeModal();
    } catch (error: any) {
      setBatchError(error?.message || "Gagal menambahkan siswa secara massal.");
    }
  };

  if (!kelasDetail)
    return (
      <div className="p-4 md:p-8 text-center text-[var(--muted-foreground)]">
        Memuat data kelas...
      </div>
    );

  return (
    <div className="space-y-4 md:space-y-6 relative px-4 md:px-0">
      <Link
        href="/admin/kelas"
        className="inline-flex items-center gap-2 text-sm md:text-base text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition mb-2"
      >
        <ArrowLeft size={16} /> Kembali ke Daftar Kelas
      </Link>

      <div>
        <h1 className="text-xl md:text-2xl font-bold text-[var(--foreground)] break-words">
          Kelola Anggota: {kelasDetail.name}
        </h1>
        <p className="text-sm md:text-base text-[var(--muted-foreground)] mt-1">
          Tugaskan Wali Kelas dan masukkan siswa ke rombongan belajar ini.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Kolom Kiri: Info Guru & Kelas */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[var(--card)] p-4 md:p-6 rounded-xl border border-[var(--border)]">
            <h3 className="font-semibold text-[var(--foreground)] mb-4 pb-4 border-b border-[var(--border)]">
              Wali Kelas / Pengajar
            </h3>
            {teacher ? (
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 flex-shrink-0 bg-[var(--primary)] bg-opacity-20 text-[var(--primary)] rounded-full flex items-center justify-center font-bold text-base md:text-lg">
                  {teacher.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-[var(--card-foreground)] truncate">
                    {teacher.name}
                  </p>
                  <p className="text-xs md:text-sm text-[var(--muted-foreground)] truncate">
                    {teacher.email}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-[var(--muted-foreground)] text-sm mb-3">
                  Belum ada guru yang ditugaskan
                </p>
                <button
                  onClick={() => setActiveModal("teacher")}
                  className="w-full sm:w-auto text-sm bg-[var(--secondary)] text-[var(--secondary-foreground)] px-4 py-2 rounded-lg hover:opacity-90 transition"
                >
                  Tugaskan Guru
                </button>
              </div>
            )}
            {teacher && (
              <button
                onClick={() => setActiveModal("teacher")}
                className="mt-4 w-full text-sm border border-[var(--border)] text-[var(--foreground)] py-2 rounded-lg hover:bg-[var(--muted)] transition"
              >
                Ganti Guru
              </button>
            )}
          </div>
        </div>

        {/* Kolom Kanan: Daftar Siswa */}
        <div className="lg:col-span-2">
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-[var(--border)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-[var(--card)]">
              <h3 className="font-semibold text-[var(--foreground)] flex items-center gap-2">
                Daftar Siswa{" "}
                <span className="bg-[var(--muted)] text-[var(--muted-foreground)] px-2 py-0.5 rounded-full text-xs">
                  {members.length}
                </span>
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setActiveModal("batch")}
                  className="flex items-center justify-center gap-1 text-sm border border-[var(--border)] text-[var(--foreground)] px-3 py-1.5 rounded-md hover:bg-[var(--muted)] transition"
                >
                  <Upload size={15} /> Import Excel
                </button>
                <button
                  onClick={() => setActiveModal("student")}
                  className="flex items-center justify-center gap-1 text-sm bg-[var(--primary)] text-[var(--primary-foreground)] px-3 py-1.5 rounded-md hover:opacity-90 transition"
                >
                  <Plus size={16} /> Tambah Siswa
                </button>
              </div>
            </div>

            {members.length === 0 ? (
              <div className="p-8 text-center text-[var(--muted-foreground)] flex-grow flex items-center justify-center">
                Belum ada siswa di kelas ini.
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse min-w-[400px]">
                  <tbody>
                    {members.map((member) => (
                      <tr
                        key={member.id}
                        className="border-b border-[var(--border)] last:border-0 text-[var(--card-foreground)] hover:bg-[var(--muted)] hover:bg-opacity-50 transition"
                      >
                        <td className="p-3 md:p-4 flex items-center gap-3">
                          <div className="w-8 h-8 flex-shrink-0 bg-[var(--muted)] text-[var(--muted-foreground)] rounded-full flex items-center justify-center text-xs font-bold">
                            {member.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm md:text-base truncate">
                              {member.name}
                            </p>
                            <p className="text-xs text-[var(--muted-foreground)] truncate">
                              {member.email}
                            </p>
                          </div>
                        </td>
                        <td className="p-3 md:p-4 text-right w-[100px]">
                          <button
                            onClick={() => handleRemoveStudent(member.id)}
                            className="text-[var(--muted-foreground)] hover:text-[var(--error)] text-xs md:text-sm font-medium transition"
                          >
                            Keluarkan
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Overlay */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div
            className={`bg-[var(--card)] w-full p-5 md:p-6 rounded-xl border border-[var(--border)] shadow-lg relative max-h-[90vh] overflow-y-auto ${
              activeModal === "batch" ? "max-w-2xl" : "max-w-md"
            }`}
          >
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition"
            >
              <X size={20} />
            </button>

            <h3 className="text-lg md:text-xl font-bold mb-1 text-[var(--foreground)] pr-6">
              {activeModal === "student"
                ? "Tambah Siswa"
                : activeModal === "batch"
                ? "Import Siswa via Excel"
                : "Tugaskan / Ganti Guru"}
            </h3>

            {/* ---- SINGLE STUDENT ---- */}
            {activeModal === "student" && (
              <div className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Pilih Siswa
                  </label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full p-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-sm md:text-base"
                  >
                    <option value="" disabled>
                      -- Pilih Siswa --
                    </option>
                    {availableStudents?.map((siswa) => (
                      <option key={siswa.id} value={siswa.id}>
                        {siswa.name} ({siswa.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 mt-6">
                  <button
                    onClick={closeModal}
                    className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-[var(--foreground)] bg-[var(--muted)] rounded-lg hover:bg-opacity-80 transition"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => {
                      if (!selectedStudentId) return;
                      handleAddStudent(Number(selectedStudentId));
                      closeModal();
                    }}
                    disabled={!selectedStudentId}
                    className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] bg-[var(--primary)] rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Simpan Siswa
                  </button>
                </div>
              </div>
            )}

            {/* ---- TEACHER ---- */}
            {activeModal === "teacher" && (
              <div className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Pilih Guru
                  </label>
                  <select
                    value={selectedTeacherId}
                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                    className="w-full p-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-sm md:text-base"
                  >
                    <option value="" disabled>
                      -- Pilih Guru --
                    </option>
                    {availableTeachers?.map((guru) => (
                      <option key={guru.id} value={guru.id}>
                        {guru.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 mt-6">
                  <button
                    onClick={closeModal}
                    className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-[var(--foreground)] bg-[var(--muted)] rounded-lg hover:bg-opacity-80 transition"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => {
                      if (!selectedTeacherId) return;
                      handleAssignTeacher(Number(selectedTeacherId));
                      closeModal();
                    }}
                    disabled={!selectedTeacherId}
                    className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] bg-[var(--primary)] rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Simpan Guru
                  </button>
                </div>
              </div>
            )}

            {/* ---- BATCH EXCEL UPLOAD ---- */}
            {activeModal === "batch" && (
              <div className="space-y-5 mt-2">
                {/* Info format */}
                <div className="rounded-lg bg-[var(--muted)] p-4 text-sm text-[var(--muted-foreground)]">
                  <p className="font-medium text-[var(--foreground)] flex items-center gap-2">
                    <FileSpreadsheet size={16} /> Format Excel
                  </p>
                  <p className="mt-1">
                    Kolom wajib:{" "}
                    <strong className="text-[var(--foreground)]">username</strong>{" "}
                    atau{" "}
                    <strong className="text-[var(--foreground)]">email</strong>{" "}
                    (nama kolom bisa keduanya)
                  </p>
                  <p className="mt-1">
                    Isi dengan username atau email siswa yang sudah terdaftar di
                    sekolah ini (role: SISWA).
                  </p>
                </div>

                {/* File picker + template download */}
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
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--border)] p-8 hover:bg-[var(--muted)] transition text-[var(--foreground)]"
                  >
                    <Upload size={20} />
                    Pilih File Excel
                  </button>

                  <a
                    href="/template/TemplateImportAnggotaKelas.xlsx"
                    download="TemplateImportAnggotaKelas.xlsx"
                    className="flex items-center justify-center gap-2 text-sm text-[var(--primary)] hover:underline"
                  >
                    <Download size={16} />
                    Unduh Template Excel
                  </a>
                </div>

                {/* Error */}
                {batchError && (
                  <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-4 text-sm text-red-600 dark:text-red-400">
                    {batchError}
                  </div>
                )}

                {/* Preview table */}
                {batchRows.length > 0 && (
                  <div className="overflow-auto rounded-lg border border-[var(--border)]">
                    <table className="w-full text-sm">
                      <thead className="bg-[var(--muted)]">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">#</th>
                          <th className="px-3 py-2 text-left font-medium">
                            Username / Email
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {batchRows.map((row, index) => (
                          <tr
                            key={index}
                            className="border-t border-[var(--border)]"
                          >
                            <td className="px-3 py-2 text-[var(--muted-foreground)]">
                              {index + 1}
                            </td>
                            <td className="px-3 py-2 text-[var(--foreground)]">
                              {row}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Footer actions */}
                <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
                  <button
                    onClick={closeModal}
                    className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition"
                  >
                    Batal
                  </button>
                  <button
                    onClick={submitBatch}
                    disabled={batchLoading || batchRows.length === 0}
                    className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm text-[var(--primary-foreground)] hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {batchLoading
                      ? "Memproses..."
                      : `Import ${batchRows.length} Siswa`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
