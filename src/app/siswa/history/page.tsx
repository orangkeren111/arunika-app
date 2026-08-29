"use client";

import React from 'react';
import Link from 'next/link';
import { FileCheck2, Clock, Play, FileText } from 'lucide-react';
import { useSiswaHistory } from './SiswaHistoryViewModel';

export default function HistoryPage() {
  const { history } = useSiswaHistory();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Riwayat Ujian</h1>
        <p className="text-[var(--muted-foreground)] mt-1">Lihat hasil ujian, nilai, dan evaluasi dari guru.</p>
      </div>

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
            {history.map(item => (
              <tr key={item.attemptId} className="border-b border-[var(--border)] last:border-0 text-[var(--card-foreground)]">
                <td className="p-4 font-medium">{item.title}</td>
                <td className="p-4 text-sm text-[var(--muted-foreground)]">{item.submittedAt}</td>
                <td className="p-4 text-center">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-[var(--foreground)] border ${
                    item.status === 'Dinilai' || item.status === 'Checked' || item.status === 'Graded'
                      ? 'bg-emerald-500/15 border-emerald-500/30'
                      : 'bg-amber-500/15 border-amber-500/30'
                  }`}>
                    {item.status === 'Dinilai' || item.status === 'Checked' || item.status === 'Graded' ? (
                      <FileCheck2 size={12} className="text-emerald-500" />
                    ) : (
                      <Clock size={12} className="text-amber-500" />
                    )}
                    {item.status}
                  </span>
                </td>
                <td className="p-4 text-center font-bold text-lg text-[var(--primary)]">
                  {item.score !== null ? item.score : '-'}
                </td>
                <td className="p-4 text-right">
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
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
