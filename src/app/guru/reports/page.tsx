"use client";

import React from "react";
import Link from "next/link";
import { useReportsViewModel } from "./GuruReportsViewModel";

export default function ReportsPage() {
  const {
    completedJadwal,
    loading,
    kelasList,
    startDate, setStartDate,
    endDate, setEndDate,
    selectedKelasFilter, setSelectedKelasFilter,
    resetFilters,
  } = useReportsViewModel();

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            Laporan Penilaian
          </h1>
          <p className="text-[var(--muted-foreground)] mt-1">
            Memuat laporan ujian...
          </p>
        </div>

        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--border)] border-t-[var(--primary)]" />
            <p className="text-sm text-[var(--muted-foreground)]">
              Memuat data...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          Laporan Penilaian
        </h1>

        <p className="text-[var(--muted-foreground)] mt-1">
          Daftar ujian yang telah selesai untuk dikoreksi atau dilihat hasilnya.
        </p>
      </div>

      {/* Filter */}
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <select
            value={selectedKelasFilter}
            onChange={(e) => setSelectedKelasFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]"
          >
            <option value="">Semua Kelas</option>
            {kelasList.map((k: any) => (
              <option key={k.id} value={k.id}>{k.name}</option>
            ))}
          </select>

          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />

          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />

          <button
            onClick={resetFilters}
            className="px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)] text-sm font-medium hover:bg-[var(--accent)] transition"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {completedJadwal.map((j) => {
          const content = (
            <div
              className={`bg-[var(--card)] p-6 rounded-xl border transition shadow-sm h-full flex flex-col justify-between ${j.isGenerating
                  ? "border-[var(--border)] opacity-70 cursor-not-allowed"
                  : "border-[var(--border)] hover:border-[var(--secondary)]"
                }`}
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold bg-[var(--primary)]/10 text-[var(--primary)] px-2.5 py-0.5 rounded">
                    {j.type}
                  </span>

                  <span className="text-xs text-[var(--muted-foreground)] font-medium">
                    {j.className}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-[var(--card-foreground)] mb-1">
                  {j.title}
                </h3>

                <p className="text-xs text-[var(--muted-foreground)] mb-4">
                  Selesai:{" "}
                  {j.startTime
                    ? new Date(j.startTime).toLocaleString("id-ID")
                    : "-"}
                </p>

                {j.isGenerating && (
                  <div className="flex items-center gap-2 mt-3 text-xs text-[var(--warning)]">
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-[var(--warning)] border-t-transparent" />

                    <span>
                      AI sedang membuat laporan siswa...
                    </span>
                  </div>
                )}

                {!j.isGenerating && (
                  <p className="text-xs text-green-600 mt-3">
                    Laporan AI siap
                  </p>
                )}
              </div>

              <div className="flex justify-between items-center text-sm pt-3 border-t border-[var(--border)] mt-4">
                {j.isGenerating ? (
                  <>
                    <span className="text-[var(--warning)] font-medium text-xs">
                      Sedang diproses
                    </span>

                    <span className="text-[var(--muted-foreground)] font-medium text-xs">
                      Mohon tunggu...
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-[var(--warning)] font-medium text-xs">
                      Periksa koreksi
                    </span>

                    <span className="text-[var(--secondary)] font-medium text-xs">
                      Lihat Detail →
                    </span>
                  </>
                )}
              </div>
            </div>
          );

          if (j.isGenerating) {
            return (
              <div key={j.id}>
                {content}
              </div>
            );
          }

          return (
            <Link
              key={j.id}
              href={`/guru/reports/${j.id}`}
              className="block group"
            >
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}