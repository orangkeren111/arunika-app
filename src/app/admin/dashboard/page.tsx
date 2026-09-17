"use client";

import React from 'react';
import { BookOpen, GraduationCap, UsersRound, LayoutGrid } from 'lucide-react';
import { useDashboardViewModel } from './DashboardViewModel';
import { StatCard } from '../../../utils/StatCard';
import { DashboardCharts } from './DashboardCharts';

export default function DashboardPage() {
  const { stats } = useDashboardViewModel();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Overview Statistik</h1>
        <p className="text-[var(--muted-foreground)] mt-1">
          Selamat datang di panel admin Arunika LMS. Berikut adalah ringkasan hari ini.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Kelas" value={stats?.totalClasses ?? 0} icon={BookOpen} color="var(--primary)" />
        <StatCard title="Total Guru" value={stats?.totalTeachers ?? 0} icon={GraduationCap} color="var(--secondary)" />
        <StatCard title="Total Siswa" value={stats?.totalStudents ?? 0} icon={UsersRound} color="var(--accent)" />
      </div>

      {/* Charts Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <LayoutGrid size={18} className="text-[var(--primary)]" />
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Analitik & Grafik</h2>
        </div>
        <DashboardCharts />
      </div>
    </div>
  );
}
