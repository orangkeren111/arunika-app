"use client";

import Link from "next/link";
import { CalendarClock, Play, Trophy, Clock } from "lucide-react";
import { useSiswaDashboard } from "./SiswaDashboardViewModel";

export default function SiswaDashboardPage() {
  const { stats, upcoming, recentHistory, currentUser } = useSiswaDashboard();

  return (
    <div className="space-y-8">
      <div className="bg-[var(--primary)] text-[var(--primary-foreground)] p-8 rounded-2xl shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">
            Selamat Pagi, {currentUser?.name ?? ""}! 🌅
          </h1>
          <p className="opacity-90 max-w-lg">
            Tetap fokus dan semangat belajar. Kamu memiliki {stats?.upcoming}{" "}
            jadwal ujian yang akan datang. Persiapkan dirimu dengan baik!
          </p>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10">
          <Trophy size={160} className="-mb-8 -mr-8" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2">
            <CalendarClock className="text-[var(--primary)]" /> Ujian Mendatang
          </h2>

          <div className="space-y-4">
            {upcoming.map((exam) => (
              <div
                key={exam.jadwalId}
                className="bg-[var(--card)] p-5 rounded-xl border border-[var(--border)] shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
              >
                <div>
                  <h3 className="font-semibold text-[var(--card-foreground)] text-lg">
                    {exam.title}
                  </h3>
                  <div className="flex gap-4 mt-2 text-sm text-[var(--muted-foreground)]">
                    <span className="flex items-center gap-1">
                      <Clock size={14} /> {exam.startTime}
                    </span>
                    <span>Durasi: {exam.durationMinutes} Menit</span>
                  </div>
                </div>
                <Link
                  href={`/siswa/ujian/${exam.jadwalId}/lobby`}
                  className="w-full sm:w-auto bg-[var(--primary)] text-[var(--primary-foreground)] px-6 py-2.5 rounded-lg font-medium hover:opacity-90 transition flex items-center justify-center gap-2"
                >
                  <Play size={16} fill="currentColor" /> Mulai Ujian
                </Link>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold text-[var(--foreground)]">
            Nilai Terakhir
          </h2>
          <div className="space-y-4">
            {recentHistory.map((hist) => (
              <div
                key={hist.attemptId}
                className="bg-[var(--card)] p-5 rounded-xl border border-[var(--border)] shadow-sm text-center"
              >
                <p className="text-sm text-[var(--muted-foreground)] mb-2 line-clamp-1">
                  {hist.title}
                </p>
                <div className="text-4xl font-bold text-[var(--foreground)] mb-2">
                  {hist.score !== null ? (
                    hist.score
                  ) : (
                    <span className="text-2xl text-[var(--warning)]">⏳</span>
                  )}
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${hist.status === "Dinilai" ? "bg-[var(--success)] text-[var(--foreground)] bg-opacity-10" : "bg-[var(--warning)] text-[var(--foreground)] bg-opacity-10"}`}
                >
                  {hist.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
