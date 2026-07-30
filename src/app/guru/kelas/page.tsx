"use client";

import React from "react";
import Link from "next/link";
import { FolderOpen, ArrowRight } from "lucide-react";
import { useKelasViewModel } from "./GuruKelasViewModel";

export default function GuruKelasListPage() {
  const { kelasList, loading } = useKelasViewModel();

  if (loading) {
    return (
      <div className="p-8 text-center text-[var(--muted-foreground)]">
        Memuat daftar kelas...
      </div>
    );
  }

  return (
    <div className="space-y-6 relative px-4 md:px-0">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          Daftar Ruang Kelas
        </h1>
        <p className="text-[var(--muted-foreground)] mt-1">
          Pilih kelas untuk mengelola ujian, melihat rapor nilai, dan memantau siswa.
        </p>
      </div>

      {kelasList.length === 0 ? (
        <div className="bg-[var(--card)] p-8 text-center text-[var(--muted-foreground)] rounded-xl border border-[var(--border)]">
          Belum ada kelas yang ditugaskan kepada Anda.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {kelasList.map((kelas) => (
            <div
              key={kelas.id}
              className="bg-[var(--card)] p-6 rounded-xl border border-[var(--border)] hover:border-[var(--primary)] transition shadow-sm flex flex-col justify-between h-full group relative"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-[var(--muted)] text-[var(--primary)] rounded-lg">
                  <FolderOpen size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--card-foreground)]">
                    {kelas.name}
                  </h3>
                  <p className="text-sm text-[var(--muted-foreground)] mt-1">
                    {kelas.studentCount} Siswa terdaftar
                  </p>
                </div>
              </div>

              <div className="mt-6 border-t border-[var(--border)] pt-4 flex justify-between items-center">
                <span className="text-xs text-[var(--muted-foreground)]">
                  Kelas ID: {kelas.id}
                </span>
                <Link
                  href={`/guru/kelas/${kelas.id}`}
                  className="flex items-center gap-1.5 text-sm font-medium text-[var(--primary)] hover:underline group"
                >
                  Masuk Kelas
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
