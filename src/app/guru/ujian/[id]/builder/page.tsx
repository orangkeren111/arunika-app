"use client";

import React, { use } from "react";
import Link from "next/link";
import { ArrowLeft, MoveRight, MoveLeft } from "lucide-react";
import { useFormUjianViewModel } from "./GuruFormUjianViewModel"; // Adjust path as needed

export default function ExamBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);

  const {
    template,
    babList,
    bukuList,
    selectedBab,
    setSelectedBab,
    selectedBuku,
    setSelectedBuku,
    availableQuestions,
    selectedQuestions,
    handleAddQuestion,
    handleRemoveQuestion,
    handleSaveTemplate,
    isQuestionSelected,
  } = useFormUjianViewModel(resolvedParams.id);

  return (
    <div className="space-y-6 flex flex-col h-[85vh]">
      <Link
        href="/guru/ujian"
        className="inline-flex items-center gap-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition mb-2"
      >
        <ArrowLeft size={16} /> Kembali ke Template Ujian
      </Link>

      <div>
        {/* TODO: You can also replace the title with a dynamic template name from the ViewModel if needed */}
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          Exam Builder: {template?.title}
        </h1>
        <p className="text-[var(--muted-foreground)] mt-1">
          Pilih soal dari kiri dan masukkan ke dalam ujian di kanan.
        </p>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
        {/* Kiri: Bank Soal */}
        <div className="flex flex-col bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
          <div className="p-4 border-b border-[var(--border)] bg-[var(--muted)]">
            <h3 className="font-semibold text-[var(--foreground)]">
              Bank Soal (Pilih Buku & Bab)
            </h3>
            <select
              value={selectedBuku}
              onChange={(e) => setSelectedBuku(e.target.value)}
              className="mt-2 w-full p-2 text-sm border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--ring)]"
            >
              <option value="" disabled>
                Pilih Buku
              </option>
              {bukuList?.map((buku) => (
                <option key={buku.id} value={buku.id}>
                  {buku.title}
                </option>
              ))}
            </select>
            <select
              value={selectedBab}
              onChange={(e) => setSelectedBab(e.target.value)}
              className="mt-2 w-full p-2 text-sm border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--ring)]"
            >
              <option value="" disabled>
                Pilih Bab
              </option>
              {babList?.map((bab) => (
                <option key={bab.id} value={bab.id}>
                  {bab.title}
                </option>
              ))}
            </select>
          </div>
          <div className="p-4 overflow-y-auto flex-1 space-y-3">
            {availableQuestions?.length === 0 ? (
              <p className="text-sm text-center text-[var(--muted-foreground)]">
                Tidak ada soal tersedia di bab ini.
              </p>
            ) : (
              availableQuestions.map((soal) => {
                const isSelected = isQuestionSelected(soal.id);

                return (
                  <div
                    key={soal.id}
                    className={`p-4 border ${isSelected ? "bg-gray-100 opacity-75" : "bg-white"}`}
                  >
                    <p>{soal.text}</p>

                    <button
                      onClick={() => handleAddQuestion(soal)}
                      disabled={isSelected} // Tombol mati kalau udah kepilih
                      className={
                        isSelected
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-blue-500"
                      }
                    >
                      {isSelected ? "✓ Sudah Ditambahkan" : "+ Tambah ke Ujian"}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Kanan: Komposisi Ujian */}
        <div className="flex flex-col bg-[var(--card)] rounded-xl border border-[var(--primary)] overflow-hidden">
          <div className="p-4 border-b border-[var(--border)] bg-[#7FA88F10]">
            <h3 className="font-semibold text-[var(--primary)]">
              Soal Terpilih untuk Ujian ({selectedQuestions?.length || 0})
            </h3>
          </div>
          <div className="p-4 overflow-y-auto flex-1 space-y-3">
            {selectedQuestions?.length === 0 ? (
              <p className="text-sm text-center text-[var(--muted-foreground)]">
                Belum ada soal yang dipilih.
              </p>
            ) : (
              selectedQuestions?.map((soal) => (
                <div
                  key={soal.id}
                  className="p-3 border border-[var(--border)] rounded-lg flex justify-between items-center transition-colors hover:border-[var(--error)]"
                >
                  <button
                    onClick={() => handleRemoveQuestion(soal.id)}
                    className="text-[var(--error)] p-1 rounded hover:bg-[var(--error)] hover:text-white transition flex-shrink-0"
                    aria-label="Hapus soal dari ujian"
                  >
                    <MoveLeft size={18} />
                  </button>
                  <p className="text-sm text-[var(--card-foreground)] truncate pl-4 text-right flex-1">
                    {soal.text}
                  </p>
                </div>
              ))
            )}
          </div>
          <div className="p-4 border-t border-[var(--border)]">
            <button
              onClick={handleSaveTemplate}
              disabled={selectedQuestions?.length === 0}
              className="w-full bg-[var(--primary)] text-[var(--primary-foreground)] py-2 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Simpan Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
