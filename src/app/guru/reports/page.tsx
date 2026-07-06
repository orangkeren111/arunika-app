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
        {completedJadwal.map(j => (
          <Link key={j.id} href={`/guru/reports/${j.id}`} className="block group">
            <div className="bg-[var(--card)] p-6 rounded-xl border border-[var(--border)] group-hover:border-[var(--secondary)] transition shadow-sm h-full">
              <h3 className="text-lg font-semibold text-[var(--card-foreground)] mb-1">{j.className} - {j.type}</h3>
              <p className="text-sm text-[var(--muted-foreground)] mb-4">Selesai pada: {j.startTime}</p>
              <div className="flex justify-between items-center text-sm">
                 <span className="text-[var(--warning)] font-medium">Ada Essay menunggu</span>
                 <span className="text-[var(--secondary)] font-medium">Lihat Detail &rarr;</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
