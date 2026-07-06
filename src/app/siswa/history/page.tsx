"use client";

import React from 'react';
import Link from 'next/link';
import { FileCheck2, Clock } from 'lucide-react';
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
              <th className="p-4 font-medium text-right">Detail</th>
            </tr>
          </thead>
          <tbody>
            {history.map(item => (
              <tr key={item.attemptId} className="border-b border-[var(--border)] last:border-0 text-[var(--card-foreground)]">
                <td className="p-4 font-medium">{item.title}</td>
                <td className="p-4 text-sm text-[var(--muted-foreground)]">{item.submittedAt}</td>
                <td className="p-4 text-center">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                    item.status === 'Dinilai' ? 'bg-[var(--success)] text-[var(--success)] bg-opacity-10' : 
                    'bg-[var(--warning)] text-[var(--warning)] bg-opacity-10'
                  }`}>
                    {item.status === 'Dinilai' ? <FileCheck2 size={12}/> : <Clock size={12}/>}
                    {item.status}
                  </span>
                </td>
                <td className="p-4 text-center font-bold text-lg text-[var(--primary)]">
                  {item.score !== null ? item.score : '-'}
                </td>
                <td className="p-4 text-right">
                  <Link href={`/siswa/history/${item.attemptId}`} className="text-sm text-[var(--secondary)] font-medium hover:underline">
                    Lihat Hasil
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
