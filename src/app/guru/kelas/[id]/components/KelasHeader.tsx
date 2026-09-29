"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";

interface KelasHeaderProps {
  classDetail: {
    name: string;
    teacherName: string;
    studentCount: number;
    classCode?: string | null;
  };
  onOpenQRModal: () => void;
  onOpenScheduleModal: () => void;
}

export const KelasHeader: React.FC<KelasHeaderProps> = ({
  classDetail,
  onOpenQRModal,
  onOpenScheduleModal,
}) => {
  return (
    <>
      <Link
        href="/guru/kelas"
        className="inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition mb-2"
      >
        <ArrowLeft size={16} /> Kembali ke Daftar Kelas
      </Link>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--foreground)] tracking-tight">
            {classDetail.name}
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1 flex flex-wrap items-center gap-2">
            <span>Wali Kelas: {classDetail.teacherName}</span>
            <span>•</span>
            <span>{classDetail.studentCount} Siswa</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {classDetail.classCode && (
            <button
              onClick={onOpenQRModal}
              className="flex items-center gap-2 border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)]/50 text-[var(--foreground)] px-4 py-2.5 rounded-lg text-sm font-bold shadow transition-all cursor-pointer"
            >
              Bagikan Kelas (QR)
            </button>
          )}

          <button
            onClick={onOpenScheduleModal}
            className="flex items-center gap-2 bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2.5 rounded-lg text-sm font-semibold hover:opacity-95 shadow transition cursor-pointer"
          >
            <Plus size={18} /> Jadwalkan Ujian Baru
          </button>
        </div>
      </div>
    </>
  );
};
