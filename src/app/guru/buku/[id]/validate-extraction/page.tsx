"use client";

import React, { use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Pencil,
  BookOpen,
  Image as ImageIcon,
  Save,
  Layers,
  Sparkles,
} from "lucide-react";
import { useValidateExtractionViewModel } from "./ValidateExtractionViewModel";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ValidateExtractionPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const bukuId = resolvedParams.id;

  const {
    loading,
    submitting,
    bukuData,
    activeTab,
    setActiveTab,
    imageKeepMap,
    imageFilter,
    setImageFilter,
    babsKompetensi,
    editingItem,
    setEditingItem,
    newItem,
    setNewItem,
    toggleImageKeep,
    setAllImagesKeepStatus,
    handleAddKompetensi,
    handleUpdateKompetensi,
    handleDeleteKompetensi,
    handleConfirm,
    images,
    keptCount,
    discardedCount,
    filteredImages,
  } = useValidateExtractionViewModel(bukuId);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-[var(--muted-foreground)]">
          Memuat data ekstraksi gambar & kompetensi...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Link
            href="/guru/buku"
            className="inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-2 transition"
          >
            <ArrowLeft size={16} /> Kembali ke Koleksi Buku
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[var(--foreground)]">
              Validasi Stage 1: {bukuData?.judul}
            </h1>
            <span className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 text-xs px-3 py-1 rounded-full font-bold">
              Gambar & Kompetensi
            </span>
          </div>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Pilih gambar yang berguna dan sesuaikan Kompetensi Dasar (KD) sebelum AI memproses deskripsi & captioning.
          </p>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex gap-2 border-b border-[var(--border)]">
        <button
          onClick={() => setActiveTab("images")}
          className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm border-b-2 transition ${
            activeTab === "images"
              ? "border-[var(--primary)] text-[var(--primary)]"
              : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
        >
          <ImageIcon size={18} /> Validasi Gambar ({keptCount}/{images.length} Disimpan)
        </button>
        <button
          onClick={() => setActiveTab("kompetensi")}
          className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm border-b-2 transition ${
            activeTab === "kompetensi"
              ? "border-[var(--primary)] text-[var(--primary)]"
              : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
        >
          <Layers size={18} /> Kelola Kompetensi Dasar ({babsKompetensi.reduce((s, b) => s + b.kompetensiList.length, 0)} Item)
        </button>
      </div>

      {/* TAB 1: VALIDASI GAMBAR */}
      {activeTab === "images" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--card)] p-4 rounded-xl border border-[var(--border)]">
            <div className="flex items-center gap-2 overflow-x-auto">
              <span className="text-xs font-semibold text-[var(--muted-foreground)] mr-1">
                Filter:
              </span>
              {[
                { id: "ALL", label: `Semua (${images.length})` },
                { id: "KEPT", label: `✅ Disimpan (${keptCount})` },
                { id: "DISCARDED", label: `❌ Dibuang (${discardedCount})` },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setImageFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    imageFilter === f.id
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                      : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setAllImagesKeepStatus(true)}
                className="text-xs font-semibold px-3 py-1.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 rounded-lg hover:opacity-90 transition"
              >
                Pilih Semua
              </button>
              <button
                onClick={() => setAllImagesKeepStatus(false)}
                className="text-xs font-semibold px-3 py-1.5 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded-lg hover:opacity-90 transition"
              >
                Buang Semua
              </button>
            </div>
          </div>

          {filteredImages.length === 0 ? (
            <div className="text-center py-12 bg-[var(--card)] rounded-xl border border-[var(--border)]">
              <ImageIcon size={40} className="mx-auto text-[var(--muted-foreground)] opacity-40 mb-2" />
              <p className="text-sm text-[var(--muted-foreground)]">Tidak ada gambar pada filter ini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredImages.map((img: any) => {
                const isKept = imageKeepMap[img.id] !== false;

                return (
                  <div
                    key={img.id}
                    className={`bg-[var(--card)] rounded-xl border transition overflow-hidden flex flex-col justify-between ${
                      isKept
                        ? "border-emerald-500/50 shadow-sm ring-1 ring-emerald-500/20"
                        : "border-red-500/30 opacity-60 bg-red-500/5"
                    }`}
                  >
                    <div className="relative bg-black/5 dark:bg-white/5 p-3 flex items-center justify-center min-h-[160px] max-h-[220px]">
                      {img.imagePath ? (
                        <img
                          src={img.imagePath}
                          alt={`Hal ${img.pageNumber}`}
                          className="max-h-[190px] object-contain rounded-md"
                        />
                      ) : (
                        <div className="text-xs text-[var(--muted-foreground)]">No Image Preview</div>
                      )}

                      <span className="absolute top-2 left-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded font-bold backdrop-blur-sm">
                        Hal {img.pageNumber}
                      </span>
                    </div>

                    <div className="p-3 flex-grow space-y-2">
                      {img.contextText && (
                        <p className="text-xs text-[var(--muted-foreground)] line-clamp-3 bg-[var(--muted)] p-2 rounded">
                          "{img.contextText}"
                        </p>
                      )}
                    </div>

                    <div className="p-3 border-t border-[var(--border)] bg-[var(--card)]">
                      <button
                        onClick={() => toggleImageKeep(img.id)}
                        className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition ${
                          isKept
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                            : "bg-red-600 hover:bg-red-700 text-white"
                        }`}
                      >
                        {isKept ? (
                          <>
                            <CheckCircle2 size={14} /> Simpan Gambar
                          </>
                        ) : (
                          <>
                            <XCircle size={14} /> Gambar Dibuang
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: KOMPETENSI DASAR BAB */}
      {activeTab === "kompetensi" && (
        <div className="space-y-6">
          {babsKompetensi.map((bab) => (
            <div
              key={bab.babId}
              className="bg-[var(--card)] p-5 rounded-xl border border-[var(--border)] shadow-sm space-y-4"
            >
              <div className="flex justify-between items-center border-b border-[var(--border)] pb-3">
                <h3 className="font-bold text-lg text-[var(--card-foreground)] flex items-center gap-2">
                  <BookOpen size={18} className="text-[var(--primary)]" />
                  {bab.judulBab}
                </h3>
                <button
                  onClick={() => setNewItem({ babId: bab.babId, nomer: "", isi: "" })}
                  className="inline-flex items-center gap-1 bg-[var(--primary)] text-[var(--primary-foreground)] px-3 py-1.5 rounded-lg text-xs font-semibold hover:opacity-90 transition"
                >
                  <Plus size={14} /> Tambah Kompetensi
                </button>
              </div>

              {/* Kompetensi List */}
              <div className="space-y-2">
                {bab.kompetensiList.length === 0 ? (
                  <p className="text-xs text-[var(--muted-foreground)] italic py-2">
                    Belum ada Kompetensi Dasar untuk bab ini.
                  </p>
                ) : (
                  bab.kompetensiList.map((k, index) => {
                    const isEditingThis =
                      editingItem?.babId === bab.babId && editingItem?.index === index;

                    if (isEditingThis) {
                      return (
                        <div
                          key={index}
                          className="p-3 bg-[var(--muted)] rounded-lg border border-[var(--primary)] space-y-2"
                        >
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={editingItem.nomer}
                              onChange={(e) =>
                                setEditingItem({ ...editingItem, nomer: e.target.value })
                              }
                              placeholder="Nomor (mis: 3.1)"
                              className="w-24 p-2 text-xs border rounded bg-[var(--background)]"
                            />
                            <input
                              type="text"
                              value={editingItem.isi}
                              onChange={(e) =>
                                setEditingItem({ ...editingItem, isi: e.target.value })
                              }
                              placeholder="Deskripsi Kompetensi..."
                              className="flex-grow p-2 text-xs border rounded bg-[var(--background)]"
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setEditingItem(null)}
                              className="px-3 py-1 text-xs font-medium bg-gray-200 dark:bg-gray-700 rounded"
                            >
                              Batal
                            </button>
                            <button
                              onClick={handleUpdateKompetensi}
                              className="px-3 py-1 text-xs font-semibold bg-[var(--primary)] text-white rounded flex items-center gap-1"
                            >
                              <Save size={12} /> Simpan
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={index}
                        className="flex items-start justify-between p-3 bg-[var(--background)] rounded-lg border border-[var(--border)] hover:border-[var(--primary)] transition"
                      >
                        <div className="flex items-start gap-3">
                          <span className="bg-[var(--muted)] text-[var(--primary)] font-bold text-xs px-2.5 py-1 rounded">
                            {k.nomerKompetensi}
                          </span>
                          <p className="text-sm font-medium text-[var(--foreground)]">
                            {k.isiKompetensi}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            onClick={() =>
                              setEditingItem({
                                babId: bab.babId,
                                index,
                                nomer: k.nomerKompetensi,
                                isi: k.isiKompetensi,
                              })
                            }
                            className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--primary)] rounded hover:bg-[var(--muted)]"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteKompetensi(bab.babId, index)}
                            className="p-1.5 text-[var(--muted-foreground)] hover:text-red-500 rounded hover:bg-red-50"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Form Add New Kompetensi */}
                {newItem?.babId === bab.babId && (
                  <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/30 space-y-2 mt-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newItem.nomer}
                        onChange={(e) => setNewItem({ ...newItem, nomer: e.target.value })}
                        placeholder="Nomor (mis: 3.1)"
                        className="w-24 p-2 text-xs border rounded bg-[var(--background)]"
                      />
                      <input
                        type="text"
                        value={newItem.isi}
                        onChange={(e) => setNewItem({ ...newItem, isi: e.target.value })}
                        placeholder="Deskripsi Kompetensi Baru..."
                        className="flex-grow p-2 text-xs border rounded bg-[var(--background)]"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setNewItem(null)}
                        className="px-3 py-1 text-xs font-medium bg-gray-200 dark:bg-gray-700 rounded"
                      >
                        Batal
                      </button>
                      <button
                        onClick={() => handleAddKompetensi(bab.babId)}
                        className="px-3 py-1 text-xs font-semibold bg-amber-600 text-white rounded flex items-center gap-1"
                      >
                        <Plus size={12} /> Tambahkan
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* STICKY BOTTOM CONFIRMATION BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--card)] border-t border-[var(--border)] p-4 shadow-lg backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-xs text-[var(--muted-foreground)]">
            <span className="font-bold text-[var(--foreground)]">{keptCount}</span> Gambar Disimpan •{" "}
            <span className="font-bold text-[var(--foreground)]">
              {babsKompetensi.reduce((s, b) => s + b.kompetensiList.length, 0)}
            </span>{" "}
            Kompetensi Siap
          </div>
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition disabled:opacity-50"
          >
            {submitting ? (
              "Menyimpan..."
            ) : (
              <>
                <Sparkles size={16} /> Konfirmasi & Lanjut ke Vision AI Captioning
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
