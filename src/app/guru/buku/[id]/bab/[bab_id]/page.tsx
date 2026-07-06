"use client";

import React, { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';
import { useSoalViewModel } from './GuruSoalViewModel';

export default function BankSoalPage({ params }: { params: Promise<{ id: string, bab_id: string }> }) {
  const resolvedParams = use(params);
  const { bab, soalList } = useSoalViewModel(resolvedParams.bab_id);

  if (!bab) return <p className="text-[var(--muted-foreground)]">Memuat bank soal...</p>;

  return (
    <div className="space-y-6">
      <Link href={`/guru/buku/${resolvedParams.id}`} className="inline-flex items-center gap-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition mb-2">
        <ArrowLeft size={16} /> Kembali ke Daftar Bab
      </Link>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">{bab.title}</h1>
          <p className="text-[var(--muted-foreground)] mt-1">Kelola Soal Pilihan Ganda dan Essay.</p>
        </div>
        <div className="flex gap-2">
          <button className="bg-[var(--secondary)] text-[var(--secondary-foreground)] px-4 py-2 rounded-lg text-sm hover:opacity-90 transition">
            + Essay
          </button>
          <button className="bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 rounded-lg text-sm hover:opacity-90 transition">
            + Pilihan Ganda
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {soalList.map((soal, i) => (
          <div key={soal.id} className="bg-[var(--card)] p-5 rounded-xl border border-[var(--border)] shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <span className={`text-xs font-bold px-2 py-1 rounded ${soal.type === 'MCQ' ? 'bg-[var(--info)] text-white' : 'bg-[var(--accent)] text-white'}`}>
                {soal.type}
              </span>
              <button className="text-[var(--muted-foreground)] hover:text-[var(--primary)] text-sm font-medium">Edit</button>
            </div>
            <p className="text-[var(--card-foreground)] mb-4">{i + 1}. {soal.text}</p>
            
            {soal.type === 'MCQ' && soal.options && (
              <ul className="space-y-2">
                {soal.options.map((opt, idx) => (
                  <li key={idx} className={`text-sm p-2 rounded-lg border ${opt === soal.correctAnswer ? 'border-[var(--success)] bg-[#74A97F15] text-[var(--success)] font-medium' : 'border-[var(--border)] text-[var(--muted-foreground)]'}`}>
                    {String.fromCharCode(65 + idx)}. {opt}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
