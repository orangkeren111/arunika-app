"use client";

import React, { use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Image as ImageIcon,
  Sparkles,
  Upload,
  X,
  BookOpen,
} from "lucide-react";
import { useValidateCaptionsViewModel } from "./ValidateCaptionsViewModel";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ValidateCaptionsPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const bukuId = resolvedParams.id;

  const {
    loading,
    submitting,
    bukuData,
    imagesList,
    newImages,
    isModalOpen,
    setIsModalOpen,
    newImageData,
    setNewImageData,
    uploadingImage,
    handleCaptionChange,
    handleBabChange,
    handleDeleteImage,
    handleDeleteNewImage,
    handleUploadImageFile,
    handleAddExtraImageSubmit,
    handleConfirm,
    babs,
    totalImagesCount,
  } = useValidateCaptionsViewModel(bukuId);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-[var(--muted-foreground)]">
          Memuat data deskripsi & caption gambar AI...
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
              Validasi Stage 2: {bukuData?.judul}
            </h1>
            <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 text-xs px-3 py-1 rounded-full font-bold">
              Captions AI & Gambar Ekstra
            </span>
          </div>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Periksa dan edit deskripsi caption gambar hasil analisa AI, serta tambahkan gambar materi ekstra di luar buku jika diperlukan.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 rounded-xl text-xs font-bold hover:opacity-90 transition shadow-sm w-full sm:w-auto"
        >
          <Plus size={16} /> Tambah Gambar Ekstra
        </button>
      </div>

      {/* Extracted Captioned Images Grid */}
      <div className="space-y-4">
        <div className="flex justify-between items-center bg-[var(--card)] p-4 rounded-xl border border-[var(--border)]">
          <h2 className="font-bold text-sm text-[var(--card-foreground)] flex items-center gap-2">
            <ImageIcon size={18} className="text-blue-500" />
            Daftar Gambar Extracted & AI Captions ({imagesList.length})
          </h2>
        </div>

        {imagesList.length === 0 && newImages.length === 0 ? (
          <div className="text-center py-12 bg-[var(--card)] rounded-xl border border-[var(--border)]">
            <ImageIcon size={40} className="mx-auto text-[var(--muted-foreground)] opacity-40 mb-2" />
            <p className="text-sm text-[var(--muted-foreground)]">Belum ada gambar yang dipilih.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Existing Extracted Images */}
            {imagesList.map((img) => (
              <div
                key={img.id}
                className="bg-[var(--card)] rounded-xl border border-[var(--border)] hover:border-[var(--primary)] transition shadow-sm flex flex-col justify-between overflow-hidden"
              >
                <div className="relative bg-black/5 dark:bg-white/5 p-4 flex items-center justify-center min-h-[180px] max-h-[240px]">
                  {img.imagePath ? (
                    <img
                      src={img.imagePath}
                      alt={`Hal ${img.pageNumber}`}
                      className="max-h-[200px] object-contain rounded-md"
                    />
                  ) : (
                    <div className="text-xs text-[var(--muted-foreground)]">No Preview</div>
                  )}

                  <span className="absolute top-2 left-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded font-bold backdrop-blur-sm">
                    {img.isManualUpload ? "Ekstra Manual" : `Halaman ${img.pageNumber}`}
                  </span>

                  <button
                    onClick={() => handleDeleteImage(img.id)}
                    className="absolute top-2 right-2 p-1.5 bg-red-600/90 text-white rounded-md hover:bg-red-700 transition"
                    title="Hapus Gambar Ini"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="p-4 space-y-3 flex-grow">
                  {/* Select Bab link */}
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--muted-foreground)] mb-1">
                      Tautkan ke Bab Materi:
                    </label>
                    <select
                      value={img.babId || ""}
                      onChange={(e) =>
                        handleBabChange(img.id, e.target.value ? Number(e.target.value) : null)
                      }
                      className="w-full p-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-xs text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                    >
                      <option value="">-- Umum / Semua Bab --</option>
                      {babs.map((b: any) => (
                        <option key={b.id} value={b.id}>
                          {b.judulBab}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Caption Textarea */}
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--muted-foreground)] mb-1">
                      Caption / Deskripsi Konsep (AI Generated):
                    </label>
                    <textarea
                      value={img.caption || ""}
                      onChange={(e) => handleCaptionChange(img.id, e.target.value)}
                      rows={3}
                      placeholder="Masukkan deskripsi gambar yang jelas untuk konteks pembuatan soal..."
                      className="w-full p-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-xs text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-y"
                    />
                  </div>
                </div>
              </div>
            ))}

            {/* Newly Added Extra Images */}
            {newImages.map((img, index) => (
              <div
                key={`new-${index}`}
                className="bg-blue-500/5 rounded-xl border border-blue-500/30 transition shadow-sm flex flex-col justify-between overflow-hidden"
              >
                <div className="relative bg-black/5 dark:bg-white/5 p-4 flex items-center justify-center min-h-[180px] max-h-[240px]">
                  <img
                    src={img.imagePath}
                    alt={`Gambar Ekstra ${index + 1}`}
                    className="max-h-[200px] object-contain rounded-md"
                  />
                  <span className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded font-bold backdrop-blur-sm">
                    ✨ Gambar Ekstra Tambahan
                  </span>
                  <button
                    onClick={() => handleDeleteNewImage(index)}
                    className="absolute top-2 right-2 p-1.5 bg-red-600/90 text-white rounded-md hover:bg-red-700 transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="p-4 space-y-3 flex-grow">
                  <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                    <BookOpen size={12} />
                    {img.babId
                      ? babs.find((b: any) => b.id === img.babId)?.judulBab || "Bab Terpilih"
                      : "Umum / Semua Bab"}
                  </p>
                  <p className="text-xs text-[var(--foreground)] bg-[var(--background)] p-2.5 rounded-lg border border-[var(--border)]">
                    "{img.caption}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Add Extra Image */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="bg-[var(--card)] w-full max-w-lg p-6 rounded-2xl border border-[var(--border)] shadow-xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition"
            >
              <X size={20} />
            </button>

            <h3 className="text-lg font-bold mb-4 text-[var(--foreground)] flex items-center gap-2">
              <Upload size={20} className="text-[var(--primary)]" /> Tambah Gambar Ekstra Baru
            </h3>

            <form onSubmit={handleAddExtraImageSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                  Upload Gambar
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleUploadImageFile(e.target.files[0]);
                    }
                  }}
                  className="w-full text-xs text-[var(--muted-foreground)] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[var(--primary)] file:text-[var(--primary-foreground)] hover:file:opacity-90 cursor-pointer"
                />
                {uploadingImage && (
                  <p className="text-xs text-amber-600 mt-1 animate-pulse">Mengunggah gambar...</p>
                )}
              </div>

              {newImageData.imagePath && (
                <div className="p-2 bg-[var(--muted)] rounded-lg flex items-center justify-center">
                  <img
                    src={newImageData.imagePath}
                    alt="Preview"
                    className="max-h-36 object-contain rounded"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                  Tautkan ke Bab Materi
                </label>
                <select
                  value={newImageData.babId}
                  onChange={(e) => setNewImageData({ ...newImageData, babId: e.target.value })}
                  className="w-full p-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-xs text-[var(--foreground)]"
                >
                  <option value="">-- Umum / Semua Bab --</option>
                  {babs.map((b: any) => (
                    <option key={b.id} value={b.id}>
                      {b.judulBab}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                  Caption / Deskripsi Gambar (Wajib)
                </label>
                <textarea
                  value={newImageData.caption}
                  onChange={(e) => setNewImageData({ ...newImageData, caption: e.target.value })}
                  rows={3}
                  placeholder="Tuliskan penjelasan detail gambar ini..."
                  className="w-full p-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-xs text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary)]"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold bg-[var(--muted)] text-[var(--foreground)] rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={uploadingImage}
                  className="px-4 py-2 text-xs font-bold bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:opacity-90 transition disabled:opacity-50"
                >
                  Simpan Gambar Ekstra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STICKY BOTTOM CONFIRMATION BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--card)] border-t border-[var(--border)] p-4 shadow-lg backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-xs text-[var(--muted-foreground)]">
            <span className="font-bold text-[var(--foreground)]">{totalImagesCount}</span> Total Gambar Siap Digunakan untuk Bank Soal AI
          </div>
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition disabled:opacity-50"
          >
            {submitting ? (
              "Memproses Pembuatan Soal..."
            ) : (
              <>
                <Sparkles size={16} /> Konfirmasi & Generate Soal AI
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
