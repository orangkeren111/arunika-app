"use client";

import React from "react";
import Link from "next/link";
import {
  FolderOpen,
  ArrowRight,
  Search,
  ArrowUpDown,
} from "lucide-react";
import { useKelasViewModel } from "./GuruKelasViewModel";

export default function GuruKelasListPage() {
  const {
    kelasList,
    loading,
    search,
    setSearch,
    orderBy,
    setOrderBy,
    status,
    setStatus,
  } = useKelasViewModel();

  return (
    <div className="space-y-6 relative px-4 md:px-0">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          Daftar Ruang Kelas
        </h1>

        <p className="text-[var(--muted-foreground)] mt-1">
          Pilih kelas untuk mengelola ujian, melihat rapor nilai, dan
          memantau siswa.
        </p>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
          />

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama kelas..."
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] py-2.5 pl-10 pr-4 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--primary)]"
          />
        </div>

        {/* Order */}
        <div className="relative">
          <ArrowUpDown
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
          />

          <select
            value={orderBy}
            onChange={(e) =>
              setOrderBy(
                e.target.value as
                | "name_asc"
                | "name_desc"
                | "students_desc"
                | "students_asc"
              )
            }
            className="w-full appearance-none rounded-xl border border-[var(--border)] bg-[var(--card)] py-2.5 pl-10 pr-8 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)] lg:w-auto"
          >
            <option value="name_asc">Nama A-Z</option>
            <option value="name_desc">Nama Z-A</option>
            <option value="students_desc">Siswa terbanyak</option>
            <option value="students_asc">Siswa tersedikit</option>
          </select>
        </div>

        {/* Status */}
        <div className="flex rounded-xl border border-[var(--border)] bg-[var(--card)] p-1">
          <button
            type="button"
            onClick={() => setStatus("active")}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${status === "active"
              ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
              : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
              }`}
          >
            Aktif
          </button>

          <button
            type="button"
            onClick={() => setStatus("retired")}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${status === "retired"
              ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
              : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
              }`}
          >
            Pensiun
          </button>

          <button
            type="button"
            onClick={() => setStatus("all")}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${status === "all"
              ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
              : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
              }`}
          >
            Semua
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-[var(--muted-foreground)]">
          Memuat daftar kelas...
        </div>
      ) : kelasList.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center text-[var(--muted-foreground)]">
          {search
            ? `Tidak ada kelas yang cocok dengan "${search}".`
            : status === "retired"
              ? "Belum ada kelas yang dipensiunkan."
              : status === "active"
                ? "Belum ada kelas aktif yang ditugaskan kepada Anda."
                : "Belum ada kelas yang ditugaskan kepada Anda."}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {kelasList.map((kelas) => (
            <div
              key={kelas.id}
              className="group relative flex h-full flex-col justify-between rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm transition hover:border-[var(--primary)]"
            >
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-[var(--muted)] p-3 text-[var(--primary)]">
                  <FolderOpen size={24} />
                </div>

                <div className="min-w-0">
                  <h3 className="truncate text-lg font-semibold text-[var(--card-foreground)]">
                    {kelas.name}
                  </h3>

                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                    {kelas.studentCount} Siswa terdaftar
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-[var(--border)] pt-4">

                <Link
                  href={`/guru/kelas/${kelas.id}`}
                  className="flex items-center gap-1.5 text-sm font-medium text-[var(--primary)] hover:underline"
                >
                  Masuk Kelas
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}