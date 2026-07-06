"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function CreateJadwalPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <Link href="/guru/jadwal" className="inline-flex items-center gap-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition mb-2">
        <ArrowLeft size={16} /> Kembali ke Jadwal
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Jadwalkan Ujian Baru</h1>
        <p className="text-[var(--muted-foreground)] mt-1">Tentukan template, kelas, dan waktu pengerjaan.</p>
      </div>

      <form className="bg-[var(--card)] p-6 rounded-xl border border-[var(--border)] space-y-5">
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Pilih Template Ujian</label>
          <select className="w-full p-2 border border-[var(--input)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--ring)] outline-none">
            <option>UH 1 Biologi Kls X</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Pilih Kelas</label>
          <select className="w-full p-2 border border-[var(--input)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--ring)] outline-none">
            <option>10 MIPA 1</option>
            <option>10 MIPA 2</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Tipe Ujian</label>
          <select className="w-full p-2 border border-[var(--input)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--ring)] outline-none">
            <option>Ulangan Harian</option>
            <option>Ujian Tengah Semester</option>
            <option>Ujian Akhir Semester</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Waktu Pelaksanaan</label>
          <input type="datetime-local" className="w-full p-2 border border-[var(--input)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--ring)] outline-none" />
        </div>

        <button type="button" className="w-full bg-[var(--primary)] text-[var(--primary-foreground)] py-3 rounded-lg font-medium hover:opacity-90 transition mt-4">
          Tugaskan Ujian
        </button>
      </form>
    </div>
  );
}
