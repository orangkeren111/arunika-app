"use client";

import React from 'react';
import Link from 'next/link';
import { Plus, Calendar, Search } from 'lucide-react';
import { useJadwalViewModel } from './GuruJadwalViewModel';

export default function JadwalPage() {
  const {
    jadwalList,
    startDate, setStartDate,
    endDate, setEndDate,
    selectedKelasFilter, setSelectedKelasFilter,
    kelasList,
    resetFilters,
  } = useJadwalViewModel();

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

      {/* Filter */}
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Class Filter */}
          <select
            value={selectedKelasFilter}
            onChange={(e) => setSelectedKelasFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]"
          >
            <option value="">Semua Kelas</option>
            {kelasList.map((k: any) => (
              <option key={k.id} value={k.id}>{k.name}</option>
            ))}
          </select>

          {/* Start Date */}
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />

          {/* End Date */}
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />

          {/* Reset */}
          <button
            onClick={resetFilters}
            className="px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)] text-sm font-medium hover:bg-[var(--accent)] transition"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[var(--muted)] text-[var(--muted-foreground)] border-b border-[var(--border)] text-sm font-semibold">
              <th className="p-4 font-bold">Nama Sesi Ujian</th>
              <th className="p-4 font-bold">Kelas</th>
              <th className="p-4 font-bold">Tipe Ujian</th>
              <th className="p-4 font-bold">Waktu Mulai</th>
              <th className="p-4 font-bold text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {jadwalList.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-sm text-[var(--muted-foreground)]">
                  Tidak ada jadwal ujian yang ditemukan.
                </td>
              </tr>
            ) : (
              jadwalList.map((j: any) => (
                <tr key={j.id} className="border-b border-[var(--border)] last:border-0 text-[var(--card-foreground)] hover:bg-[var(--muted)]/20 transition">
                  <td className="p-4 font-bold text-[var(--foreground)]">{j.title}</td>
                  <td className="p-4 font-medium">{j.className}</td>
                  <td className="p-4">
                    <span className="text-xs bg-[var(--primary)]/10 text-[var(--primary)] px-2.5 py-1 rounded-md font-bold">
                      {j.type}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-[var(--muted-foreground)] flex items-center gap-2">
                    <Calendar size={14} /> {j.startTime ? new Date(j.startTime).toLocaleString("id-ID") : "Langsung/Aktif"}
                  </td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                      j.status === 'Active' || j.status === 'ONGOING'
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-[var(--foreground)]'
                        : j.status === 'Upcoming' || j.status === 'SCHEDULED'
                        ? 'bg-blue-500/15 border-blue-500/30 text-[var(--foreground)]'
                        : 'bg-[var(--muted)] border-[var(--border)] text-[var(--muted-foreground)]'
                    }`}>
                      {j.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
