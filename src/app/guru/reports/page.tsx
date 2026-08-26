"use client";

import React from 'react';
import Link from 'next/link';
import { useReportsViewModel } from './GuruReportsViewModel';

export default function ReportsPage() {
  const { completedJadwal } = useReportsViewModel();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Laporan Penilaian</h1>
        <p className="text-[var(--muted-foreground)] mt-1">Daftar ujian yang telah selesai untuk dikoreksi atau dilihat hasilnya.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {completedJadwal.map((j: any) => (
          <Link key={j.id} href={`/guru/reports/${j.id}`} className="block group">
            <div className="bg-[var(--card)] p-6 rounded-xl border border-[var(--border)] group-hover:border-[var(--secondary)] transition shadow-sm h-full flex flex-col justify-between">
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
                  Selesai: {j.startTime ? new Date(j.startTime).toLocaleString("id-ID") : "-"}
                </p>
              </div>
              <div className="flex justify-between items-center text-sm pt-3 border-t border-[var(--border)]">
                <span className="text-[var(--warning)] font-medium text-xs">Periksa koreksi</span>
                <span className="text-[var(--secondary)] font-medium text-xs">Lihat Detail &rarr;</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
