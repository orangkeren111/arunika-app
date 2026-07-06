"use client";

import React from 'react';
import Link from 'next/link';
import { BookOpen, Users } from 'lucide-react';
import { useSiswaKelas } from './SiswaKelasViewModel';

export default function SiswaKelasPage() {
  const { kelasList } = useSiswaKelas();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Ruang Kelas Anda</h1>
        <p className="text-[var(--muted-foreground)] mt-1">Daftar kelas di mana Anda terdaftar.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kelasList.map(kelas => (
          <Link key={kelas.id} href={`/siswa/kelas/${kelas.id}`} className="block group">
            <div className="bg-[var(--card)] p-6 rounded-xl border border-[var(--border)] group-hover:border-[var(--primary)] transition shadow-sm h-full flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-[var(--muted)] text-[var(--primary)] rounded-lg">
                  <BookOpen size={24} />
                </div>
                <h3 className="text-xl font-semibold text-[var(--card-foreground)]">{kelas.name}</h3>
              </div>
              <div className="space-y-2 mt-auto">
                <p className="text-sm text-[var(--muted-foreground)] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--info)]"></span> {kelas.teacherName}
                </p>
                <p className="text-sm text-[var(--muted-foreground)] flex items-center gap-2">
                  <Users size={14} /> {kelas.studentCount} Siswa
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
