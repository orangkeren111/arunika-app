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

import Link from "next/link";
import { AlertCircle, ArrowRight, BookOpen, CheckCircle2, Image as ImageIcon } from "lucide-react";

export default function GuruDashboardPage() {
  const { stats, validationBooks, currentUser } = useGuruDashboard();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          Selamat Pagi, {currentUser?.name || "Guru"}
        </h1>
        <p className="text-[var(--muted-foreground)]">
          Berikut adalah ringkasan aktivitas mengajar Anda hari ini.
        </p>
      </div>

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

      {/* VALIDATION NEEDED HIGHLIGHT BANNER & CARDS */}
      {validationBooks && validationBooks.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-600 rounded-xl">
              <AlertCircle size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-amber-700 dark:text-amber-400">
                Membutuhkan Validasi Guru ({validationBooks.length} Buku)
              </h2>
              <p className="text-sm text-amber-600/80 dark:text-amber-300/80">
                Pilih dan filter gambar serta kompetensi buku untuk melanjutkan ke tahap pembuatan soal AI yang presisi.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {validationBooks.map((buku: any) => {
              const isStage1 = buku.jobStatus === "WAITING_EXTRACTION_VALIDATION";
              const href = isStage1
                ? `/guru/buku/${buku.id}/validate-extraction`
                : `/guru/buku/${buku.id}/validate-captions`;

              return (
                <div
                  key={buku.id}
                  className="bg-[var(--card)] p-4 rounded-xl border border-[var(--border)] shadow-sm flex flex-col justify-between hover:border-amber-500 transition"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-[var(--muted)] text-[var(--primary)] rounded-lg">
                        <BookOpen size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[var(--card-foreground)] line-clamp-1">
                          {buku.title}
                        </h3>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          {buku.chapterCount} Bab • {buku.imageCount} Gambar Extracted
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                        isStage1
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                          : "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                      }`}
                    >
                      {isStage1 ? "Stage 1: Extracted & Kompetensi" : "Stage 2: AI Captions"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[var(--border)] mt-2">
                    <span className="text-xs font-medium text-[var(--muted-foreground)] flex items-center gap-1">
                      <ImageIcon size={14} />
                      {isStage1 ? "Pilih Gambar & Edit Kompetensi" : "Periksa & Edit Caption"}
                    </span>
                    <Link
                      href={href}
                      className="inline-flex items-center gap-1.5 bg-[var(--primary)] text-[var(--primary-foreground)] px-3 py-1.5 rounded-lg text-xs font-semibold hover:opacity-90 transition"
                    >
                      Validasi Sekarang <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
