"use client";

import React, { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Clock } from 'lucide-react';
import { useReportDetailViewModel } from './GuruReportsDetailViewModel';

export default function ReportDetailPage({ params }: { params: Promise<{ jadwal_id: string }> }) {
  const resolvedParams = use(params);
  const { jadwal, attempts } = useReportDetailViewModel(resolvedParams.jadwal_id);

  if (!jadwal) return <p className="text-[var(--muted-foreground)]">Memuat data...</p>;

  return (
    <div className="space-y-6">
      <Link href="/guru/reports" className="inline-flex items-center gap-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition mb-2">
        <ArrowLeft size={16} /> Kembali ke Daftar Laporan
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Leaderboard: {jadwal.className}</h1>
        <p className="text-[var(--muted-foreground)] mt-1">{jadwal.type} | {jadwal.startTime}</p>
      </div>

      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[var(--muted)] text-[var(--muted-foreground)] border-b border-[var(--border)]">
              <th className="p-4 font-medium">Nama Siswa</th>
              <th className="p-4 font-medium text-center">Skor Akhir</th>
              <th className="p-4 font-medium text-center">Status Koreksi</th>
              <th className="p-4 font-medium text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {attempts.map(attempt => (
              <tr key={attempt.id} className="border-b border-[var(--border)] last:border-0 text-[var(--card-foreground)]">
                <td className="p-4 font-medium">{attempt.studentName}</td>
                <td className="p-4 text-center font-bold text-[var(--primary)]">{attempt.score !== null ? attempt.score : '-'}</td>
                <td className="p-4 flex justify-center">
                   {attempt.status === 'Graded' ? 
                      <span className="flex items-center gap-1 text-[var(--success)] text-xs"><CheckCircle size={14}/> Dinilai</span> :
                      <span className="flex items-center gap-1 text-[var(--warning)] text-xs"><Clock size={14}/> Menunggu Koreksi</span>
                   }
                </td>
                <td className="p-4 text-right">
                   <Link href={`/guru/reports/attempt/${attempt.id}`} className="text-sm text-[var(--secondary)] font-medium hover:underline">
                      Periksa Jawaban
                   </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
