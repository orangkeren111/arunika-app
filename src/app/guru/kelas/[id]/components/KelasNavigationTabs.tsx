"use client";

import React from "react";
import { Calendar, Users, Award } from "lucide-react";

export type TabType = "dashboard" | "exams" | "students" | "report";

interface KelasNavigationTabsProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const KelasNavigationTabs: React.FC<KelasNavigationTabsProps> = ({
  activeTab,
  setActiveTab,
}) => {
  return (
    <div className="flex border-b border-[var(--border)] gap-2">
      <button
        onClick={() => setActiveTab("dashboard")}
        className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
          activeTab === "dashboard"
            ? "border-[var(--primary)] text-[var(--primary)]"
            : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        }`}
      >
        <Calendar size={18} />
        Dashboard
      </button>
      <button
        onClick={() => setActiveTab("exams")}
        className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
          activeTab === "exams"
            ? "border-[var(--primary)] text-[var(--primary)]"
            : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        }`}
      >
        <Calendar size={18} />
        Jadwal Ujian
      </button>
      <button
        onClick={() => setActiveTab("students")}
        className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
          activeTab === "students"
            ? "border-[var(--primary)] text-[var(--primary)]"
            : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        }`}
      >
        <Users size={18} />
        Daftar Siswa
      </button>
      <button
        onClick={() => setActiveTab("report")}
        className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
          activeTab === "report"
            ? "border-[var(--primary)] text-[var(--primary)]"
            : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        }`}
      >
        <Award size={18} />
        Rapor Nilai Kelas
      </button>
    </div>
  );
};
