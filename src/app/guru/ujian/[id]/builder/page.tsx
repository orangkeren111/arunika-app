"use client";

import React, { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, MoveRight, MoveLeft } from 'lucide-react';

export default function ExamBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  // Dalam realitas, ini menggunakan drag-and-drop. Disini kita simulasikan secara visual.
  return (
    <div className="space-y-6 flex flex-col h-[85vh]">
      <Link href="/guru/ujian" className="inline-flex items-center gap-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition mb-2">
        <ArrowLeft size={16} /> Kembali ke Template Ujian
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Exam Builder: UH 1 Biologi Kls X</h1>
        <p className="text-[var(--muted-foreground)] mt-1">Pilih soal dari kiri dan masukkan ke dalam ujian di kanan.</p>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
        {/* Kiri: Bank Soal */}
        <div className="flex flex-col bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
          <div className="p-4 border-b border-[var(--border)] bg-[var(--muted)]">
            <h3 className="font-semibold text-[var(--foreground)]">Bank Soal (Pilih Bab)</h3>
            <select className="mt-2 w-full p-2 text-sm border border-[var(--border)] rounded bg-white text-[var(--foreground)]">
              <option>Bab 1: Ruang Lingkup Biologi</option>
            </select>
          </div>
          <div className="p-4 overflow-y-auto flex-1 space-y-3">
            {/* Soal Dummy List */}
            <div className="p-3 border border-[var(--border)] rounded-lg flex justify-between items-center group hover:border-[var(--primary)]">
              <p className="text-sm text-[var(--card-foreground)] truncate pr-4">Cabang ilmu biologi yang memp...</p>
              <button className="text-[var(--primary)] p-1 rounded hover:bg-[var(--primary)] hover:text-white transition">
                <MoveRight size={18} />
              </button>
            </div>
            <div className="p-3 border border-[var(--border)] rounded-lg flex justify-between items-center group hover:border-[var(--primary)]">
              <p className="text-sm text-[var(--card-foreground)] truncate pr-4">Jelaskan perbedaan antara...</p>
              <button className="text-[var(--primary)] p-1 rounded hover:bg-[var(--primary)] hover:text-white transition">
                <MoveRight size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Kanan: Komposisi Ujian */}
        <div className="flex flex-col bg-[var(--card)] rounded-xl border border-[var(--primary)] overflow-hidden">
          <div className="p-4 border-b border-[var(--border)] bg-[#7FA88F10]">
            <h3 className="font-semibold text-[var(--primary)]">Soal Terpilih untuk Ujian (2)</h3>
          </div>
          <div className="p-4 overflow-y-auto flex-1 space-y-3">
             <div className="p-3 border border-[var(--border)] rounded-lg flex justify-between items-center">
              <button className="text-[var(--error)] p-1 rounded hover:bg-[var(--error)] hover:text-white transition">
                <MoveLeft size={18} />
              </button>
              <p className="text-sm text-[var(--card-foreground)] truncate pl-4 text-right">Soal sebelumnya yang terpilih...</p>
            </div>
          </div>
          <div className="p-4 border-t border-[var(--border)]">
             <button className="w-full bg-[var(--primary)] text-white py-2 rounded-lg font-medium hover:opacity-90">Simpan Template</button>
          </div>
        </div>
      </div>
    </div>
  );
}
