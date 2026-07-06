"use client";

import React, { use } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useAttemptViewModel } from './GuruReportsAttemptViewModel';

export default function AttemptReviewPage({ params }: { params: Promise<{ attempt_id: string }> }) {
  const resolvedParams = use(params);
  const { attempt } = useAttemptViewModel(resolvedParams.attempt_id);

  if (!attempt) return <p className="text-[var(--muted-foreground)]">Memuat percobaan...</p>;

  return (
    <div className="space-y-6 max-w-4xl">
      <button onClick={() => window.history.back()} className="inline-flex items-center gap-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition mb-2">
        <ArrowLeft size={16} /> Kembali ke Leaderboard
      </button>

      <div className="flex justify-between items-end pb-4 border-b border-[var(--border)]">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Review Jawaban: {attempt.studentName}</h1>
          <p className="text-[var(--muted-foreground)] mt-1">Status saat ini: <span className="font-medium text-[var(--foreground)]">{attempt.status}</span></p>
        </div>
        <div className="text-right">
          <p className="text-sm text-[var(--muted-foreground)]">Total Skor (Sementara)</p>
          <p className="text-3xl font-bold text-[var(--primary)]">{attempt.score || 'Menunggu'}</p>
        </div>
      </div>

      {/* Simulasi Pertanyaan Essay untuk dinilai */}
      <div className="bg-[var(--card)] p-6 rounded-xl border border-[var(--border)] shadow-sm space-y-4">
        <div className="flex justify-between items-start">
           <span className="bg-[var(--accent)] text-white text-xs px-2 py-1 rounded font-bold">ESSAY</span>
           <span className="text-sm text-[var(--muted-foreground)]">Bobot Maksimal: 20 poin</span>
        </div>
        
        <p className="text-[var(--foreground)] font-medium">Jelaskan perbedaan antara sel tumbuhan dan sel hewan!</p>
        
        <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--input)] text-sm text-[var(--foreground)]">
           <p className="font-semibold text-[var(--muted-foreground)] mb-2">Jawaban Siswa:</p>
           "Sel tumbuhan punya dinding sel sehingga bentuknya kaku, sedangkan sel hewan tidak punya jadi bisa berubah bentuk. Sel tumbuhan juga punya kloroplas untuk fotosintesis."
        </div>

        {/* Panel Penilaian Manual */}
        <div className="bg-[var(--muted)] p-4 rounded-lg space-y-4">
           <div>
             <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Berikan Poin (0 - 20)</label>
             <input type="number" min="0" max="20" placeholder="0" className="w-24 p-2 border border-[var(--border)] rounded text-[var(--foreground)] focus:ring-2 focus:ring-[var(--ring)] outline-none"/>
           </div>
           <div>
             <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Catatan Koreksi Guru (opsional)</label>
             <textarea rows={3} placeholder="Jawaban cukup bagus, tapi tambahkan mengenai vakuola..." className="w-full p-2 border border-[var(--border)] rounded text-[var(--foreground)] focus:ring-2 focus:ring-[var(--ring)] outline-none"></textarea>
           </div>
        </div>
      </div>

      <div className="flex justify-end gap-4 mt-6">
         <button className="bg-[var(--primary)] text-[var(--primary-foreground)] px-6 py-2 rounded-lg font-medium hover:opacity-90 transition">
            Simpan Nilai
         </button>
      </div>

    </div>
  );
}
