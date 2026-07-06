"use client";

import React, { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, MessageSquareQuote } from 'lucide-react';
import { useHistoryDetail } from './SiswaHistoryDetailViewModel';

export default function HistoryDetailPage({ params }: { params: Promise<{ attempt_id: string }> }) {
  const resolvedParams = use(params);
  const { detail } = useHistoryDetail(resolvedParams.attempt_id);

  if (!detail) return <p className="p-8 text-[var(--muted-foreground)]">Memuat detail...</p>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto mt-4">
      <Link href="/siswa/history" className="inline-flex items-center gap-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition mb-2">
        <ArrowLeft size={16} /> Kembali ke Riwayat
      </Link>

      <div className="bg-[var(--card)] p-8 rounded-2xl border border-[var(--border)] shadow-sm text-center">
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">{detail.title}</h1>
        <p className="text-[var(--muted-foreground)] text-sm mb-6">Diserahkan pada: {detail.submittedAt}</p>
        
        <div className="inline-block p-6 rounded-full border-4 border-[var(--muted)] mb-4">
           <span className="text-6xl font-black text-[var(--primary)]">{detail.score !== null ? detail.score : '⏳'}</span>
        </div>
        <p className="font-medium text-[var(--foreground)]">
          {detail.status === 'Dinilai' ? 'Ujian telah dinilai secara menyeluruh.' : 'Menunggu guru mengoreksi jawaban essay Anda.'}
        </p>
      </div>

      {detail.feedback && (
        <div className="bg-[#7BA4D915] border border-[var(--info)] p-6 rounded-2xl shadow-sm">
          <h3 className="font-bold text-[var(--info)] flex items-center gap-2 mb-3">
            <MessageSquareQuote size={20} /> Catatan dari Guru
          </h3>
          <p className="text-[var(--foreground)] leading-relaxed italic">"{detail.feedback}"</p>
        </div>
      )}

      {detail.aiSummary && (
        <div className="bg-gradient-to-r from-[#D79A8215] to-transparent border border-[var(--accent)] p-6 rounded-2xl shadow-sm">
          <h3 className="font-bold text-[var(--accent)] flex items-center gap-2 mb-3">
            <Sparkles size={20} /> AI Insight & Evaluasi
          </h3>
          <p className="text-[var(--foreground)] leading-relaxed">{detail.aiSummary}</p>
        </div>
      )}
    </div>
  );
}
