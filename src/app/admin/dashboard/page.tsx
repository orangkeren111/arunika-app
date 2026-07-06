"use client";

import React from 'react';
import { BookOpen, GraduationCap, UsersRound } from 'lucide-react';
import { useDashboardViewModel } from './DashboardViewModel'; // Sesuaikan dengan alias '@' project Anda
import { StatCard } from '../../../utils/StatCard';

export default function DashboardPage() {
  const { stats } = useDashboardViewModel();
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--foreground)]">Overview Statistik</h1>
      <p className="text-[var(--muted-foreground)]">Selamat datang di panel admin Arunika LMS. Berikut adalah ringkasan hari ini.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Kelas" value={stats?.totalClasses||0} icon={BookOpen} color="var(--primary)" />
        <StatCard title="Total Guru" value={stats?.totalTeachers||0} icon={GraduationCap} color="var(--secondary)" />
        <StatCard title="Total Siswa" value={stats?.totalStudents||0} icon={UsersRound} color="var(--accent)" />
      </div>
    </div>
  );
}
