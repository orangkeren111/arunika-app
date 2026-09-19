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
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold bg-[var(--primary)]/10 text-[var(--primary)] px-2.5 py-0.5 rounded">
            {jadwal.type}
          </span>
          <span className="text-sm font-semibold text-[var(--muted-foreground)]">
            Kelas: {jadwal.className}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">{jadwal.title}</h1>
        <p className="text-xs text-[var(--muted-foreground)] mt-1">
          Waktu: {jadwal.startTime ? new Date(jadwal.startTime).toLocaleString("id-ID") : "-"}
        </p>
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
                  {attempt.status === 'Graded' || attempt.status === 'Checked' ?
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 border border-emerald-500/30 text-[var(--foreground)]"><CheckCircle size={14} className="text-emerald-500" /> Dinilai</span> : (
                      attempt.status === 'Generating' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 border border-amber-500/30 text-[var(--foreground)]"><Clock size={14} className="text-amber-500" /> Diproses AI</span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 border border-amber-500/30 text-[var(--foreground)]"><Clock size={14} className="text-amber-500" /> Menunggu Koreksi</span>
                      ))
                  }
                </td>
                <td className="p-4 text-right">
                  {attempt.status !== 'Generating' ? (
                    <Link href={`/guru/reports/attempt/${attempt.id}`} className="text-sm text-[var(--secondary)] font-medium hover:underline">
                      Periksa Jawaban
                    </Link>
                  ) : (<></>)
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
