"use client";

import React, { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldAlert, Timer, FileText } from 'lucide-react';
import { useExamLobby } from './SiswaUjianLobbyViewModel';

export default function ExamLobbyPage({ params }: { params: Promise<{ jadwal_id: string }> }) {
  const resolvedParams = use(params);
  const { exam } = useExamLobby(resolvedParams.jadwal_id);

  if (!exam) return <p className="p-8 text-center text-[var(--muted-foreground)]">Memuat jadwal...</p>;

  return (
    <div className="max-w-3xl mx-auto space-y-6 mt-8">
      <Link href="/siswa/dashboard" className="inline-flex items-center gap-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition mb-2">
        <ArrowLeft size={16} /> Kembali ke Dashboard
      </Link>

      <div className="bg-[var(--card)] p-8 rounded-2xl border border-[var(--border)] shadow-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">{exam.title}</h1>
          <p className="text-[var(--muted-foreground)]">{exam.className} • {exam.type}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-[var(--muted)] p-4 rounded-xl flex items-center gap-4">
             <div className="p-3 bg-white rounded-lg text-[var(--primary)]"><Timer size={24}/></div>
             <div>
               <p className="text-xs text-[var(--muted-foreground)]">Durasi Waktu</p>
               <p className="font-bold text-[var(--foreground)]">{exam.durationMinutes} Menit</p>
             </div>
          </div>
          <div className="bg-[var(--muted)] p-4 rounded-xl flex items-center gap-4">
             <div className="p-3 bg-white rounded-lg text-[var(--secondary)]"><FileText size={24}/></div>
             <div>
               <p className="text-xs text-[var(--muted-foreground)]">Format Ujian</p>
               <p className="font-bold text-[var(--foreground)]">Pilihan Ganda & Essay</p>
             </div>
          </div>
        </div>

        <div className="bg-[#E5B56715] border border-[var(--warning)] p-5 rounded-xl mb-8">
          <h3 className="font-bold text-[var(--warning)] flex items-center gap-2 mb-2">
            <ShieldAlert size={18} /> Peraturan Ujian
          </h3>
          <ul className="text-sm text-[var(--foreground)] space-y-2 ml-6 list-disc opacity-90">
            <li>Pastikan koneksi internet Anda stabil sebelum menekan tombol mulai.</li>
            <li>Waktu akan terus berjalan meskipun Anda menutup tab peramban.</li>
            <li>Dilarang membuka tab lain atau melakukan kecurangan. Sistem akan mencatat aktivitas Anda.</li>
            <li>Ujian akan otomatis tersubmit jika waktu habis.</li>
          </ul>
        </div>

        <Link 
          href={`/siswa/ujian/${exam.jadwalId}/attempt`}
          className="w-full block text-center bg-[var(--primary)] text-[var(--primary-foreground)] py-4 rounded-xl font-bold text-lg hover:opacity-90 transition shadow-md"
        >
          Saya Siap, Mulai Ujian Sekarang
        </Link>
      </div>
    </div>
  );
}
