"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Edit2, Trash2, Link2, Check, RefreshCw } from "lucide-react";
import { useKompetensiViewModel } from "./KompetensiViewModel";

interface Kompetensi {
  id: number;
  nomerKompetensi: string;
  isiKompetensi: string;
}

export default function KompetensiClientPage({
  babId,
  bookId,
  babTitle,
  bookTitle,
  initialCompetencies,
  availableBooks,
}: {
  babId: number;
  bookId: number;
  babTitle: string;
  bookTitle: string;
  initialCompetencies: Kompetensi[];
  availableBooks: string[];
}) {
  const {
    competencies,
    isFormOpen,
    setIsFormOpen,
    editingId,
    nomerKomp,
    setNomerKomp,
    isiKomp,
    setIsiKomp,
    isLinkingOpen,
    setIsLinkingOpen,
    selectedBook,
    availableChapters,
    selectedChapter,
    previewCompetencies,
    selectedKompIds,
    linkingLoading,
    openAddForm,
    openEditForm,
    handleSave,
    handleDelete,
    handleBookChange,
    handleChapterChange,
    toggleSelectKomp,
    handleExecuteLink,
  } = useKompetensiViewModel(babId, initialCompetencies);

  return (
    <div className="space-y-6">
      {/* Header breadcrumb */}
      <div className="flex items-center gap-3">
        <Link
          href={`/guru/buku/${bookId}/bab/${babId}`}
          className="p-2 rounded-lg bg-[var(--card)] border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:shadow-sm transition"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <span className="text-xs text-[var(--muted-foreground)] font-medium">
            {bookTitle} / {babTitle}
          </span>
          <h1 className="text-2xl font-bold text-[var(--foreground)] mt-0.5">
            Kompetensi Bab
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Competency List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
            <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--muted)]/20">
              <h2 className="text-lg font-bold text-[var(--foreground)]">Daftar Kompetensi</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsLinkingOpen(true)}
                  className="flex items-center gap-1.5 bg-blue-600/15 text-blue-500 border border-blue-500/20 px-3 py-1.5 rounded-lg text-sm hover:bg-blue-600/25 transition font-medium"
                >
                  <Link2 size={16} /> Link Kurikulum
                </button>
                <button
                  onClick={openAddForm}
                  className="flex items-center gap-1.5 bg-[var(--primary)] text-[var(--primary-foreground)] px-3 py-1.5 rounded-lg text-sm hover:opacity-90 transition font-medium"
                >
                  <Plus size={16} /> Tambah Manual
                </button>
              </div>
            </div>

            <div className="divide-y divide-[var(--border)]">
              {competencies.length === 0 ? (
                <div className="p-8 text-center text-[var(--muted-foreground)]">
                  Belum ada kompetensi untuk bab ini. Silakan tambah manual atau link dari kurikulum.
                </div>
              ) : (
                competencies.map((komp) => (
                  <div key={komp.id} className="p-4 hover:bg-[var(--muted)]/10 transition flex justify-between items-start gap-4">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[var(--primary)]/10 text-[var(--primary)]">
                          Kode: {komp.nomerKompetensi}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--foreground)] whitespace-pre-wrap">
                        {komp.isiKompetensi}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditForm(komp)}
                        className="p-2 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--muted)] transition"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(komp.id)}
                        className="p-2 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--error)] hover:bg-[var(--muted)] transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Sidebar panels (Add/Edit Form OR Link Wizard) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Add/Edit Form */}
          {isFormOpen && (
            <div className="bg-[var(--card)] p-5 rounded-xl border border-[var(--border)] space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-[var(--foreground)]">
                  {editingId ? "Edit Kompetensi" : "Tambah Kompetensi"}
                </h3>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  Batal
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted-foreground)] uppercase">
                    Kode/Nomer Kompetensi
                  </label>
                  <input
                    type="text"
                    required
                    value={nomerKomp}
                    onChange={(e) => setNomerKomp(e.target.value)}
                    placeholder="Contoh: 3.1 atau KD 3.1"
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted-foreground)] uppercase">
                    Isi Kompetensi (Freetext)
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={isiKomp}
                    onChange={(e) => setIsiKomp(e.target.value)}
                    placeholder="Tulis detail kompetensi bab..."
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[var(--primary)] text-[var(--primary-foreground)] py-2 rounded-lg hover:opacity-90 transition text-sm font-medium"
                >
                  {editingId ? "Simpan Perubahan" : "Simpan Kompetensi"}
                </button>
              </form>
            </div>
          )}

          {/* Linking Tool Wizard */}
          {isLinkingOpen && (
            <div className="bg-[var(--card)] p-5 rounded-xl border border-[var(--border)] space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-[var(--foreground)]">Link dari Kurikulum</h3>
                <button
                  onClick={() => setIsLinkingOpen(false)}
                  className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  Batal
                </button>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted-foreground)]">Pilih Pelajaran</label>
                  <select
                    value={selectedBook}
                    onChange={(e) => handleBookChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] focus:outline-none"
                  >
                    <option value="">-- Pilih Pelajaran / Buku --</option>
                    {availableBooks.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                {selectedBook && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--muted-foreground)]">Pilih Bab Kurikulum</label>
                    <select
                      value={selectedChapter}
                      onChange={(e) => handleChapterChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] focus:outline-none"
                    >
                      <option value="">-- Pilih Bab --</option>
                      {availableChapters.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                )}

                {previewCompetencies.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[var(--muted-foreground)]">Pilih Kompetensi yang Ingin Di-link</label>
                    <div className="border border-[var(--border)] rounded-lg max-h-60 overflow-y-auto divide-y divide-[var(--border)] bg-[var(--background)]">
                      {previewCompetencies.map((c) => {
                        const selected = selectedKompIds.includes(c.id);
                        return (
                          <div
                            key={c.id}
                            onClick={() => toggleSelectKomp(c.id)}
                            className={`p-3 text-xs cursor-pointer transition flex items-start gap-2 hover:bg-[var(--muted)]/50
                              ${selected ? "bg-blue-600/5 text-blue-600 font-medium" : "text-[var(--muted-foreground)]"}`}
                          >
                            <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition
                              ${selected ? "bg-blue-500 border-blue-500 text-white" : "border-[var(--border)] bg-white"}`}
                            >
                              {selected && <Check size={10} />}
                            </div>
                            <div className="flex-1">
                              <span className="font-mono font-bold block mb-0.5">{c.nomerKompetensi}</span>
                              <p className="line-clamp-2">{c.isiKompetensi}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      onClick={handleExecuteLink}
                      disabled={selectedKompIds.length === 0 || linkingLoading}
                      className="w-full flex items-center justify-center gap-1.5 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium disabled:opacity-50"
                    >
                      {linkingLoading ? (
                        <RefreshCw className="animate-spin w-4 h-4" />
                      ) : (
                        `Link (${selectedKompIds.length}) Kompetensi`
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
