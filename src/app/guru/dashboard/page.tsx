"use client";

import React from "react";
import { CalendarClock, FilePenLine, UsersRound } from "lucide-react";
import { useGuruDashboard } from "./GuruDashboardViewModel";

const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  icon: any;
  color: string;
}) => (
  <div className="bg-[var(--card)] p-6 rounded-xl border border-[var(--border)] flex items-center gap-4 shadow-sm">
    <div
      className="p-4 rounded-full"
      style={{ backgroundColor: `${color}20`, color: color }}
    >
      <Icon size={24} />
    </div>
    <div>
      <p className="text-[var(--muted-foreground)] text-sm font-medium">
        {title}
      </p>
      <h3 className="text-2xl font-bold text-[var(--card-foreground)] mt-1">
        {value}
      </h3>
    </div>
  </div>
);

export default function GuruDashboardPage() {
  const { stats, currentUser } = useGuruDashboard();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--foreground)]">
        Selamat Pagi, {currentUser?.name}
      </h1>
      <p className="text-[var(--muted-foreground)]">
        Berikut adalah ringkasan aktivitas mengajar Anda hari ini.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Ujian Aktif Hari Ini"
          value={stats?.activeExams || 0}
          icon={CalendarClock}
          color="var(--primary)"
        />
        <StatCard
          title="Essay Menunggu Koreksi"
          value={stats?.pendingEssays || 0}
          icon={FilePenLine}
          color="var(--warning)"
        />
        <StatCard
          title="Kelas Aktif"
          value={stats?.recentClasses || 0}
          icon={UsersRound}
          color="var(--info)"
        />
      </div>
    </div>
  );
}
