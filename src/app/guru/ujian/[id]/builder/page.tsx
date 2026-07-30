"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, MoveLeft, CheckSquare, Square } from "lucide-react";
import { useFormUjianViewModel } from "./GuruFormUjianViewModel"; // Adjust path as needed

export default function ExamBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);

  const {
    template,
    setTemplate, // Make sure to destructure this from the updated viewmodel
    babList,
    bukuList,
    selectedBuku,
    setSelectedBuku,
    activeBabs,
    handleToggleBab,
    selectedQuestions,
    handleRemoveQuestion,
    handleSaveTemplate,
  } = useFormUjianViewModel(resolvedParams.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          Exam Builder: {template?.title || "Ujian Baru"}
        </h1>
        <p className="text-[var(--muted-foreground)] mt-1">
          Lengkapi detail ujian dan pilih bab dari kiri untuk menambahkan soal.
        </p>
      </div>

      {/* --- FORM PENGATURAN UJIAN --- */}
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
              Judul Ujian
            </label>
            <input
              type="text"
              value={template?.title || ""}
              onChange={(e) =>
                setTemplate((prev) =>
                  prev ? { ...prev, title: e.target.value } : undefined,
                )
              }
              placeholder="Contoh: Ujian Tengah Semester"
              className="w-full p-2.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--primary)] transition-shadow"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
              Durasi (Menit)
            </label>
            <input
              type="number"
              min="1"
              value={template?.durasiMenit || ""}
              onChange={(e) =>
                setTemplate((prev) =>
                  prev
                    ? { ...prev, durasiMenit: Number(e.target.value) }
                    : undefined,
                )
              }
              placeholder="Contoh: 90"
              className="w-full p-2.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--primary)] transition-shadow"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
              Jumlah Soal Target
            </label>
            <input
              type="number"
              min="1"
              value={template?.questionCount || ""}
              onChange={(e) =>
                setTemplate((prev) =>
                  prev
                    ? { ...prev, questionCount: Number(e.target.value) }
                    : undefined,
                )
              }
              placeholder="Contoh: 40"
              className="w-full p-2.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--primary)] transition-shadow"
            />
            <p className="text-xs text-[var(--muted-foreground)] mt-1.5">
              Soal terpilih saat ini: {selectedQuestions?.length || 0}
            </p>
          </div>
        </div>

        <div className="border-t border-[var(--border)] pt-4">
          <h3 className="text-sm font-bold text-[var(--foreground)] mb-3">
            Kriteria Jumlah Soal Kognitif (DDA) - Harus Lebih dari 10 Soal per Level
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--muted-foreground)] mb-1">
                Kriteria C1 (Mengingat)
              </label>
              <input
                type="number"
                min="11"
                value={template?.reqC1 || ""}
                onChange={(e) =>
                  setTemplate((prev) =>
                    prev ? { ...prev, reqC1: Number(e.target.value) } : undefined,
                  )
                }
                className="w-full p-2.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--muted-foreground)] mb-1">
                Kriteria C2 (Memahami)
              </label>
              <input
                type="number"
                min="11"
                value={template?.reqC2 || ""}
                onChange={(e) =>
                  setTemplate((prev) =>
                    prev ? { ...prev, reqC2: Number(e.target.value) } : undefined,
                  )
                }
                className="w-full p-2.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--muted-foreground)] mb-1">
                Kriteria C3 (Menerapkan)
              </label>
              <input
                type="number"
                min="11"
                value={template?.reqC3 || ""}
                onChange={(e) =>
                  setTemplate((prev) =>
                    prev ? { ...prev, reqC3: Number(e.target.value) } : undefined,
                  )
                }
                className="w-full p-2.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--muted-foreground)] mb-1">
                Kriteria C4 (Menganalisis)
              </label>
              <input
                type="number"
                min="11"
                value={template?.reqC4 || ""}
                onChange={(e) =>
                  setTemplate((prev) =>
                    prev ? { ...prev, reqC4: Number(e.target.value) } : undefined,
                  )
                }
                className="w-full p-2.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
          </div>
        </div>
      </div>
      {/* --- END FORM PENGATURAN UJIAN --- */}

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
        {/* Kiri: Bank Soal (Daftar Bab) */}
        <div className="flex flex-col bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
          <div className="p-4 border-b border-[var(--border)] bg-[var(--muted)]">
            <h3 className="font-semibold text-[var(--foreground)]">
              Sumber Soal (Pilih Buku & Bab)
            </h3>
            <select
              value={selectedBuku}
              onChange={(e) => setSelectedBuku(e.target.value)}
              className="mt-4 w-full p-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--primary)]"
            >
              <option value="" disabled>
                -- Pilih Buku --
              </option>
              {bukuList?.map((buku) => (
                <option key={buku.id} value={buku.id}>
                  {buku.title}
                </option>
              ))}
            </select>
          </div>

          <div className="p-4 overflow-y-auto flex-1 space-y-3">
            {!selectedBuku ? (
              <p className="text-sm text-center text-[var(--muted-foreground)] mt-4">
                Silakan pilih buku terlebih dahulu untuk melihat daftar bab.
              </p>
            ) : babList?.length === 0 ? (
              <p className="text-sm text-center text-[var(--muted-foreground)] mt-4">
                Tidak ada bab tersedia di buku ini.
              </p>
            ) : (
              babList?.map((bab) => {
                const isSelected = activeBabs.includes(bab.id);

                return (
                  <div
                    key={bab.id}
                    onClick={() => handleToggleBab(bab.id)}
                    className={`p-4 border rounded-lg cursor-pointer flex items-center gap-3 transition-all duration-200 ${
                      isSelected
                        ? "bg-[var(--primary)]/10 border-[var(--primary)]"
                        : "bg-[var(--background)] border-[var(--border)] hover:border-[var(--primary)]/50"
                    }`}
                  >
                    <div
                      className={
                        isSelected
                          ? "text-[var(--primary)]"
                          : "text-[var(--muted-foreground)]"
                      }
                    >
                      {isSelected ? (
                        <CheckSquare size={20} />
                      ) : (
                        <Square size={20} />
                      )}
                    </div>
                    <span
                      className={`font-medium ${
                        isSelected
                          ? "text-[var(--primary)]"
                          : "text-[var(--foreground)]"
                      }`}
                    >
                      {bab.title}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Kanan: Komposisi Ujian */}
        <div className="flex flex-col bg-[var(--card)] rounded-xl border border-[var(--primary)] overflow-hidden">
          <div className="p-4 border-b border-[var(--border)] bg-[#7FA88F10] flex justify-between items-center">
            <h3 className="font-semibold text-[var(--primary)]">
              Soal Terpilih untuk Ujian
            </h3>
            <span
              className={`text-xs font-bold px-2 py-1 rounded-full ${
                template?.questionCount &&
                selectedQuestions?.length > template.questionCount
                  ? "bg-red-500 text-white" // Warn if selected questions exceed the target
                  : "bg-[var(--primary)] text-[var(--primary-foreground)]"
              }`}
            >
              {selectedQuestions?.length || 0} /{" "}
              {template?.questionCount || "?"} Soal
            </span>
          </div>
          <div className="p-4 overflow-y-auto flex-1 space-y-3">
            {selectedQuestions?.length === 0 ? (
              <p className="text-sm text-center text-[var(--muted-foreground)] mt-4">
                Belum ada soal yang dipilih. Centang bab di sebelah kiri untuk
                menambahkan soal.
              </p>
            ) : (
              selectedQuestions?.map((soal, index) => (
                <div
                  key={soal.id}
                  className="p-3 border border-[var(--border)] bg-[var(--background)] rounded-lg flex gap-3 items-start transition-colors group"
                >
                  <div className="flex-1">
                    <p className="text-sm text-[var(--foreground)] line-clamp-2">
                      <span className="font-semibold mr-1">{index + 1}.</span>
                      {soal.text}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="p-4 border-t border-[var(--border)] bg-[var(--muted)]">
            <button
              onClick={handleSaveTemplate}
              disabled={
                selectedQuestions?.length === 0 ||
                !template?.title ||
                !template?.durasiMenit ||
                !template?.questionCount
              }
              className="w-full bg-[var(--primary)] text-[var(--primary-foreground)] py-2.5 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
            >
              Simpan Template Ujian
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
