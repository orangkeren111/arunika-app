"use client";

import React, { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, X } from "lucide-react";
import { useMembersViewModel } from "./MembersViewModel";

export default function MembersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);

  // Destructure tambahan data teachers dan students dari ViewModel
  const {
    kelasDetail,
    teacher,
    members,
    availableTeachers = [],
    availableStudents = [],
    handleRemoveStudent,
    handleAssignTeacher,
    handleAddStudent,
  } = useMembersViewModel(resolvedParams.id);

  // State untuk mengontrol modal dan pilihan dropdown
  const [activeModal, setActiveModal] = useState<"student" | "teacher" | null>(
    null,
  );
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");

  const closeModal = () => {
    setActiveModal(null);
    setSelectedStudentId("");
    setSelectedTeacherId("");
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
              <button
                onClick={() => setActiveModal("student")}
                className="w-full sm:w-auto flex items-center justify-center gap-1 text-sm bg-[var(--primary)] text-[var(--primary-foreground)] px-3 py-1.5 rounded-md hover:opacity-90 transition"
              >
                <Plus size={16} /> Tambah Siswa
              </button>
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
          <div className="bg-[var(--card)] w-full max-w-md p-5 md:p-6 rounded-xl border border-[var(--border)] shadow-lg relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition"
            >
              <X size={20} />
            </button>

            <h3 className="text-lg md:text-xl font-bold mb-4 text-[var(--foreground)] pr-6">
              {activeModal === "student"
                ? "Tambah Siswa"
                : "Tugaskan / Ganti Guru"}
            </h3>

            {/* Form Konten Berdasarkan Tipe Modal */}
            {activeModal === "student" ? (
              <div className="space-y-4">
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
            ) : (
              <div className="space-y-4">
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
          </div>
        </div>
      )}
    </div>
  );
}
