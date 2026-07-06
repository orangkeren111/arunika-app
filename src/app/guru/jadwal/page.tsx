"use client";

import React from 'react';
import Link from 'next/link';
import { Plus, Calendar } from 'lucide-react';
import { useJadwalViewModel } from './GuruJadwalViewModel';

export default function JadwalPage() {
  const { jadwalList } = useJadwalViewModel();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Jadwal Ujian</h1>
          <p className="text-[var(--muted-foreground)] mt-1">Kelola sesi ujian (deploy) ke siswa dan kelas tertentu.</p>
        </div>
        <Link href="/guru/jadwal/create" className="flex items-center gap-2 bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 rounded-lg hover:opacity-90 transition">
          <Plus size={18} /> Jadwalkan Ujian
        </Link>
      </div>

      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[var(--muted)] text-[var(--muted-foreground)] border-b border-[var(--border)]">
              <th className="p-4 font-medium">Kelas</th>
              <th className="p-4 font-medium">Tipe Ujian</th>
              <th className="p-4 font-medium">Waktu Mulai</th>
              <th className="p-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {jadwalList.map(j => (
              <tr key={j.id} className="border-b border-[var(--border)] last:border-0 text-[var(--card-foreground)]">
                <td className="p-4 font-medium">{j.className}</td>
                <td className="p-4">{j.type}</td>
                <td className="p-4 flex items-center gap-2"><Calendar size={16} className="text-[var(--muted-foreground)]"/> {j.startTime}</td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    j.status === 'Active' ? 'bg-[var(--success)] text-[var(--success)] bg-opacity-20' : 
                    'bg-[var(--muted)] text-[var(--muted-foreground)]'
                  }`}>
                    {j.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
