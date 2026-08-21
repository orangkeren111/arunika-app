"use client";

import React from "react";
import { Upload, RefreshCw } from "lucide-react";
import { useKurikulumViewModel } from "./KurikulumViewModel";

export default function KurikulumUploadForm() {
  const {
    file,
    loading,
    message,
    handleFileChange,
    handleSubmit,
  } = useKurikulumViewModel();

  return (
    <div className="bg-[var(--card)] p-6 rounded-xl border border-[var(--border)] space-y-4">
      <h2 className="text-lg font-bold text-[var(--foreground)]">Unggah Dokumen Kurikulum</h2>
      <p className="text-sm text-[var(--muted-foreground)]">
        Unggah file PDF kurikulum. Sistem akan membaca dan mengekstrak bab, pelajaran, dan kompetensi menggunakan AI.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-center w-full">
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[var(--border)] rounded-lg cursor-pointer bg-[var(--muted)] hover:bg-[var(--muted)]/80 transition">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-8 h-8 text-[var(--muted-foreground)] mb-2" />
              <p className="text-sm text-[var(--muted-foreground)]">
                <span className="font-semibold">Pilih file PDF</span> atau drag and drop
              </p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">PDF saja</p>
            </div>
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        </div>

        {file && (
          <div className="text-sm text-[var(--foreground)] font-medium">
            File terpilih: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
          </div>
        )}

        <button
          type="submit"
          disabled={!file || loading}
          className="w-full flex items-center justify-center gap-2 bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2.5 rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <RefreshCw className="animate-spin w-4 h-4" /> Memproses...
            </>
          ) : (
            "Ekstrak Kurikulum"
          )}
        </button>
      </form>

      {message && (
        <div className={`p-3 rounded-lg text-sm font-medium ${message.startsWith("Error") ? "bg-[var(--error)]/10 text-[var(--error)]" : "bg-green-500/10 text-green-500"}`}>
          {message}
        </div>
      )}
    </div>
  );
}
