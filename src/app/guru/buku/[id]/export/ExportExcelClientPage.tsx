"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FileSpreadsheet,
  FileText,
  CheckSquare,
  Square,
  Filter,
  CheckCircle,
  Trash2,
  ListFilter,
  Check,
  X,
  BookOpen,
} from "lucide-react";
import { useExportExcelViewModel } from "./GuruExportExcelViewModel";
import { MathRenderer } from "@/src/components/MathRenderer";

export default function ExportExcelClientPage({ bookId }: { bookId: string }) {
  const {
    buku,
    babList,
    soalList,
    filteredSoalList,
    stagedSoalList,
    selectedBabId,
    setSelectedBabId,
    selectedSoalIds,
    isAllCurrentBabSelected,
    loading,
    exportingWord,
    toggleSoalSelection,
    toggleSelectAllCurrentBab,
    selectAllInBook,
    clearAllSelections,
    handleExportExcel,
    handleExportWord,
  } = useExportExcelViewModel(bookId);

  if (loading) {
    return (
      <div className="p-8 text-center text-[var(--muted-foreground)] flex items-center justify-center min-h-[400px]">
        Memuat data bank soal...
      </div>
    );
  }

  if (!buku) {
    return (
      <div className="p-8 text-center text-[var(--muted-foreground)]">
        Buku tidak ditemukan.
      </div>
    );
  }

  return (
    <div className="space-y-6 relative px-4 md:px-0 pb-12">
      {/* Back Link */}
      <Link
        href={`/guru/buku/${bookId}`}
        className="inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition mb-2"
      >
        <ArrowLeft size={16} /> Kembali ke Detail Buku
      </Link>

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[var(--card)] border border-[var(--border)] p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-green-600 mb-1">
            <FileSpreadsheet size={18} />
            <span>Ekspor Bank Soal ke Excel</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] break-words">
            {buku.title}
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Pilih bab dan soal yang ingin diekspor. File .xlsx yang dihasilkan dapat disimpan atau dibuka dengan Microsoft Excel.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <button
            onClick={handleExportExcel}
            disabled={stagedSoalList.length === 0}
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-xl transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
          >
            <FileSpreadsheet size={20} />
            <span>
              Download Excel ({stagedSoalList.length} Soal)
            </span>
          </button>

          <button
            onClick={handleExportWord}
            disabled={
              stagedSoalList.length === 0 || exportingWord
            }
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
          >
            <FileText size={20} />

            <span>
              {exportingWord
                ? "Generating Word..."
                : `Download Word (${stagedSoalList.length} Soal)`}
            </span>
          </button>
        </div>
      </div>

      {/* Main Dual-Pane Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT / TOP PANE: Filter Bab & Question Selection */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 shadow-sm space-y-4">
            {/* Filter Dropdown & Quick Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter size={18} className="text-[var(--primary)] flex-shrink-0" />
                <label htmlFor="babSelect" className="text-sm font-bold text-[var(--foreground)] whitespace-nowrap">
                  Filter Bab:
                </label>
                <select
                  id="babSelect"
                  value={selectedBabId}
                  onChange={(e) => setSelectedBabId(e.target.value)}
                  className="w-full sm:w-auto p-2 rounded-xl border border-[var(--input)] bg-[var(--card)] text-sm font-medium text-[var(--foreground)] focus:ring-2 focus:ring-[var(--ring)] focus:outline-none"
                >
                  <option value="ALL">
                    Semua Bab ({soalList.length} Soal)
                  </option>
                  {babList.map((bab) => (
                    <option key={bab.id} value={bab.id}>
                      {bab.title} ({bab.questionCount} Soal)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 text-xs w-full sm:w-auto justify-end">
                <button
                  onClick={selectAllInBook}
                  className="text-[var(--primary)] hover:underline font-semibold"
                >
                  Pilih Semua Buku
                </button>
                <span className="text-[var(--muted-foreground)]">•</span>
                <button
                  onClick={clearAllSelections}
                  className="text-red-500 hover:underline font-semibold"
                >
                  Kosongkan Pilihan
                </button>
              </div>
            </div>

            {/* Select All Checkbox for current Bab view */}
            <div className="flex items-center justify-between bg-[var(--muted)]/40 p-3 rounded-xl">
              <button
                onClick={toggleSelectAllCurrentBab}
                className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)] hover:opacity-80 cursor-pointer"
              >
                {isAllCurrentBabSelected ? (
                  <CheckSquare size={18} className="text-[var(--primary)]" />
                ) : (
                  <Square size={18} className="text-[var(--muted-foreground)]" />
                )}
                <span>
                  {isAllCurrentBabSelected ? "Batal Pilih Semua" : "Pilih Semua Soal di Tampilan Ini"}
                </span>
              </button>
              <span className="text-xs text-[var(--muted-foreground)] font-medium">
                {filteredSoalList.filter((s) => selectedSoalIds.has(s.id)).length} / {filteredSoalList.length} terpilih
              </span>
            </div>
          </div>

          {/* List of Filtered Questions */}
          <div className="space-y-3">
            {filteredSoalList.length === 0 ? (
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-8 text-center text-[var(--muted-foreground)]">
                Belum ada soal pada bab ini.
              </div>
            ) : (
              filteredSoalList.map((soal, index) => {
                const isSelected = selectedSoalIds.has(soal.id);

                return (
                  <div
                    key={soal.id}
                    onClick={() => toggleSoalSelection(soal.id)}
                    className={`p-4 rounded-2xl border transition cursor-pointer space-y-3 ${isSelected
                      ? "border-[var(--primary)] bg-[var(--primary)]/5 shadow-sm"
                      : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/50"
                      }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="mt-0.5 flex-shrink-0">
                          {isSelected ? (
                            <CheckSquare size={20} className="text-[var(--primary)]" />
                          ) : (
                            <Square size={20} className="text-[var(--muted-foreground)]" />
                          )}
                        </div>
                        <span className="text-xs font-bold text-[var(--muted-foreground)]">
                          Soal #{index + 1}
                        </span>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${soal.type === "MCQ"
                            ? "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                            : "bg-purple-500/10 text-purple-600 border border-purple-500/20"
                            }`}
                        >
                          {soal.type === "MCQ" ? "Pilihan Ganda" : "Essay"}
                        </span>
                        <span className="text-xs bg-[var(--muted)] text-[var(--muted-foreground)] px-2 py-0.5 rounded-md font-medium">
                          {soal.babTitle}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0 text-xs text-[var(--muted-foreground)] font-medium">
                        <span>Difficulty: {soal.difficulty}</span>
                        <span>•</span>
                        <span>{soal.bloomLevel}</span>
                      </div>
                    </div>

                    <div className="text-sm font-medium text-[var(--foreground)] pl-8">
                      <MathRenderer text={soal.teksSoal} />
                    </div>

                    {/* MCQ Options preview */}
                    {soal.type === "MCQ" && Array.isArray(soal.opsiJawaban) && (
                      <div className="pl-8 grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                        {soal.opsiJawaban.map((opt, i) => (
                          <div
                            key={i}
                            className={`text-xs p-2 rounded-lg border ${opt === soal.jawabanBenarMcq
                              ? "border-green-500/30 bg-green-500/10 text-green-700 font-semibold"
                              : "border-[var(--border)] text-[var(--muted-foreground)] bg-[var(--card)]"
                              }`}
                          >
                            <span className="font-bold mr-1">
                              {String.fromCharCode(65 + i)}.
                            </span>
                            <MathRenderer text={opt} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT / BOTTOM PANE: Active Staged Questions Preview & Export */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-6 bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div>
                <h3 className="font-bold text-base text-[var(--foreground)]">
                  Soal Terpilih untuk Ekspor
                </h3>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {stagedSoalList.length} dari {soalList.length} soal terpilih
                </p>
              </div>

              {stagedSoalList.length > 0 && (
                <button
                  onClick={clearAllSelections}
                  className="text-xs text-red-500 hover:underline font-semibold"
                >
                  Kosongkan
                </button>
              )}
            </div>

            <button
              onClick={handleExportExcel}
              disabled={stagedSoalList.length === 0}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <FileSpreadsheet size={20} />
              <span>Generate & Download Excel (.xlsx)</span>
            </button>
            <button
              onClick={handleExportWord}
              disabled={
                stagedSoalList.length === 0 || exportingWord
              }
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <FileText size={20} />

              <span>
                {exportingWord
                  ? "Generating Word..."
                  : "Generate & Download Word (.docx)"}
              </span>
            </button>

            {/* Staged Questions Scrollable List */}
            <div className="max-h-[500px] overflow-y-auto space-y-2 pr-1">
              {stagedSoalList.length === 0 ? (
                <div className="p-8 text-center text-sm text-[var(--muted-foreground)] border border-dashed border-[var(--border)] rounded-xl">
                  Belum ada soal yang dipilih. Silakan pilih soal dari panel sebelah kiri untuk diekspor.
                </div>
              ) : (
                stagedSoalList.map((soal, idx) => (
                  <div
                    key={soal.id}
                    className="p-3 rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 text-xs space-y-1.5 relative group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-[var(--primary)]">
                        #{idx + 1} • {soal.babTitle}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[var(--card)] text-[var(--muted-foreground)] border border-[var(--border)]">
                          {soal.type}
                        </span>
                        <button
                          onClick={() => toggleSoalSelection(soal.id)}
                          className="text-[var(--muted-foreground)] hover:text-red-500 transition"
                          title="Hapus dari daftar ekspor"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="text-[var(--foreground)] line-clamp-2 font-medium">
                      <MathRenderer text={soal.teksSoal} />
                    </div>
                  </div>
                ))
              )}
            </div>

            {stagedSoalList.length > 5 && (
              <button
                onClick={handleExportExcel}
                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-xl transition shadow-md text-sm cursor-pointer"
              >
                <FileSpreadsheet size={18} />
                <span>Download {stagedSoalList.length} Soal</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
