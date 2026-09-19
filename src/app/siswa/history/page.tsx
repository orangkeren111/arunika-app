"use client";

import React from "react";
import Link from "next/link";
import { FileCheck2, Clock, Play, FileText, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useSiswaHistory } from "./SiswaHistoryViewModel";

export default function HistoryPage() {
  const {
    history,
    loading,
    search,
    setSearch,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    page,
    totalPages,
    setPage,
    resetFilters,
  } = useSiswaHistory();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          Riwayat Ujian
        </h1>
        <p className="text-[var(--muted-foreground)] mt-1">
          Lihat hasil ujian, nilai, dan evaluasi dari guru.
        </p>
      </div>

      {/* Filter */}
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
            />
            <input
              type="text"
              placeholder="Cari nama ujian..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>

          {/* Start Date */}
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />

          {/* End Date */}
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />

          {/* Reset */}
          <button
            onClick={resetFilters}
            className="px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)] text-sm font-medium hover:bg-[var(--accent)] transition"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[var(--muted)] text-[var(--muted-foreground)] border-b border-[var(--border)]">
              <th className="p-4 font-medium">Nama Ujian</th>
              <th className="p-4 font-medium">Tanggal Selesai</th>
              <th className="p-4 font-medium text-center">Status</th>
              <th className="p-4 font-medium text-center">Nilai</th>
              <th className="p-4 font-medium text-right">Aksi</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={5}
                  className="p-8 text-center text-sm text-[var(--muted-foreground)]"
                >
                  Memuat riwayat...
                </td>
              </tr>
            ) : history.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="p-8 text-center text-sm text-[var(--muted-foreground)]"
                >
                  Tidak ada riwayat ujian yang ditemukan.
                </td>
              </tr>
            ) : (
              history.map((item) => (
                <tr
                  key={item.attemptId}
                  className="border-b border-[var(--border)] last:border-0 text-[var(--card-foreground)]"
                >
                  <td className="p-4 font-medium">{item.title}</td>

                  <td className="p-4 text-sm text-[var(--muted-foreground)]">
                    {item.submittedAt}
                  </td>

                  <td className="p-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-[var(--foreground)] border ${item.status === "Dinilai" ||
                        item.status === "Checked" ||
                        item.status === "Graded"
                        ? "bg-emerald-500/15 border-emerald-500/30"
                        : "bg-amber-500/15 border-amber-500/30"
                        }`}
                    >
                      {item.status === "Dinilai" ||
                        item.status === "Checked" ||
                        item.status === "Graded" ? (
                        <FileCheck2 size={12} className="text-emerald-500" />
                      ) : (
                        <Clock size={12} className="text-amber-500" />
                      )}

                      {item.status}
                    </span>
                  </td>

                  <td className="p-4 text-center font-bold text-lg text-[var(--primary)]">
                    {item.score !== null && item.status === "Dinilai" ||
                      item.status === "Checked" ||
                      item.status === "Graded" ? item.score : "-"}
                  </td>

                  <td className="p-4 text-right">
                    {item.status === "Dinilai" ||
                      item.status === "Checked" ||
                      item.status === "Graded"
                      ? (
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/siswa/history/${item.attemptId}`}
                            className="text-xs md:text-sm bg-[var(--muted)] text-[var(--foreground)] border border-[var(--border)] px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-[var(--accent)] transition font-bold"
                          >
                            <FileText size={14} /> Lihat Hasil
                          </Link>

                          <Link
                            href={`/siswa/ujian/${item.jadwalId}/quiz/lobby`}
                            className="text-xs md:text-sm bg-[var(--primary)] text-[var(--primary-foreground)] px-3 py-1.5 rounded-lg flex items-center gap-1 hover:opacity-90 transition font-bold shadow-sm"
                          >
                            <Play size={14} /> Lobby Quiz
                          </Link>
                        </div>) : (<></>)
                    }
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 0 && (
          <div className="flex items-center justify-between p-4 border-t border-[var(--border)]">
            <span className="text-sm text-[var(--muted-foreground)]">
              Halaman {page} dari {totalPages}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="p-2 rounded-lg border border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--accent)] transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>

              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
                className="p-2 rounded-lg border border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--accent)] transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}