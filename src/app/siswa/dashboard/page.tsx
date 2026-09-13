"use client";

import Link from "next/link";
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  FileText,
  Play,
  TrendingDown,
  TrendingUp,
  Trophy,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useSiswaDashboard } from "./SiswaDashboardViewModel";

export default function SiswaDashboardPage() {
  const {
    stats,
    upcoming,
    recentHistory,
    performanceHistory,
    learningInsight,
    greeting,
    currentUser,
    loading,
  } = useSiswaDashboard();

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="text-sm text-[var(--muted-foreground)]">
          Memuat dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] lg:h-[calc(100vh-8rem)] flex flex-col gap-5">
      {/* Greeting */}
      <section className="shrink-0 bg-[var(--primary)] text-[var(--primary-foreground)] p-5 sm:p-6 md:p-7 rounded-2xl shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">
            {greeting}, {currentUser?.name ?? ""}! 🌅
          </h1>

          <p className="opacity-90 text-sm sm:text-base max-w-2xl">
            Tetap fokus dan semangat belajar.
            {stats?.upcoming
              ? ` Kamu memiliki ${stats.upcoming} ujian yang sedang berlangsung.`
              : " Saat ini tidak ada ujian yang sedang berlangsung."}
          </p>
        </div>

        <div className="absolute right-3 sm:right-5 bottom-[-20px] opacity-10">
          <Trophy size={120} className="sm:w-[140px] sm:h-[140px]" />
        </div>
      </section>

      {/* Dashboard Content */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column */}
        <div className="lg:col-span-2 min-h-0 flex flex-col gap-5">
          {/* Performance Chart */}
          <section className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 sm:p-5 shadow-sm min-h-[300px] lg:flex-1 lg:min-h-0">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="min-w-0">
                <h2 className="font-bold text-base sm:text-lg text-[var(--card-foreground)]">
                  Performa Ujian
                </h2>

                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                  5 ujian terakhir yang sudah dinilai
                </p>
              </div>

              <div className="text-right shrink-0">
                <p className="text-xs text-[var(--muted-foreground)]">
                  Rata-rata
                </p>

                <p className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">
                  {learningInsight?.averageScore ?? 0}
                </p>
              </div>
            </div>

            {performanceHistory.length > 0 ? (
              <div className="h-[220px] sm:h-[260px] lg:h-[calc(100%-4rem)] min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={performanceHistory}
                    margin={{
                      top: 5,
                      right: 8,
                      left: -22,
                      bottom: 0,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="label"
                      tick={{
                        fill: "var(--muted-foreground)",
                        fontSize: 11,
                      }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <YAxis
                      domain={[0, 100]}
                      tick={{
                        fill: "var(--muted-foreground)",
                        fontSize: 10,
                      }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <Tooltip
                      cursor={{
                        fill: "var(--muted)",
                      }}
                      contentStyle={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "10px",
                        color: "var(--foreground)",
                      }}
                      formatter={(value) => [`${value}`, "Nilai"]}
                      labelFormatter={(label, payload) =>
                        payload?.[0]?.payload?.title ?? label
                      }
                    />

                    <Bar
                      dataKey="score"
                      fill="var(--primary)"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={48}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-center text-sm text-[var(--muted-foreground)]">
                Belum ada ujian yang selesai dinilai.
              </div>
            )}
          </section>

          {/* Upcoming Exams */}
          {upcoming.length > 0 && (
            <section className="shrink-0 bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 sm:p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <CalendarClock
                  size={19}
                  className="text-[var(--primary)] shrink-0"
                />

                <h2 className="font-bold text-base sm:text-lg text-[var(--card-foreground)]">
                  Ujian Mendatang
                </h2>
              </div>

              <div className="flex gap-3 overflow-x-auto pb-1 snap-x">
                {upcoming.slice(0, 5).map((exam) => (
                  <div
                    key={exam.jadwalId}
                    className="min-w-[250px] sm:min-w-[280px] lg:min-w-0 lg:flex-1 snap-start border border-[var(--border)] rounded-xl p-3"
                  >
                    <div className="flex justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-semibold truncate text-sm text-[var(--card-foreground)]">
                          {exam.title}
                        </h3>

                        <div className="flex items-center gap-2 mt-1 text-xs text-[var(--muted-foreground)]">
                          <Clock size={12} />
                          <span className="truncate">
                            {exam.startTime}
                          </span>
                        </div>

                        <p className="text-xs text-[var(--muted-foreground)] mt-1">
                          {exam.durationMinutes} menit
                        </p>
                      </div>

                      <Link
                        href={`/siswa/ujian/${exam.jadwalId}/lobby`}
                        className="shrink-0 bg-[var(--primary)] text-[var(--primary-foreground)] px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:opacity-90 transition"
                      >
                        <Play size={13} fill="currentColor" />
                        Mulai
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Column */}
        <div className="min-h-0 flex flex-col gap-5">
          {/* Learning Insight */}
          <section className="shrink-0 bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 sm:p-5 shadow-sm">
            <h2 className="font-bold text-base sm:text-lg text-[var(--card-foreground)]">
              Perkembangan Belajar
            </h2>

            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              Ringkasan dari hasil ujianmu
            </p>

            <div className="mt-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Rata-rata nilai
                </p>

                <p className="text-4xl font-bold text-[var(--foreground)]">
                  {learningInsight?.averageScore ?? 0}
                </p>
              </div>

              {learningInsight &&
                learningInsight.totalGraded >= 2 &&
                learningInsight.scoreTrend !== 0 && (
                  <div
                    className={`flex items-center gap-1 text-sm font-semibold ${learningInsight.scoreTrend > 0
                        ? "text-[var(--success)]"
                        : "text-[var(--error)]"
                      }`}
                  >
                    {learningInsight.scoreTrend > 0 ? (
                      <TrendingUp size={17} />
                    ) : (
                      <TrendingDown size={17} />
                    )}

                    {Math.abs(learningInsight.scoreTrend)} poin
                  </div>
                )}
            </div>

            <div className="mt-4 p-3 rounded-xl bg-[var(--muted)] text-sm text-[var(--foreground)]">
              {learningInsight?.totalGraded === 0
                ? "🌱 Selesaikan ujian pertamamu untuk mulai melihat perkembangan belajar."
                : learningInsight?.scoreTrend &&
                  learningInsight.scoreTrend > 0
                  ? "🚀 Performa terakhirmu meningkat. Pertahankan ritmenya!"
                  : learningInsight?.scoreTrend &&
                    learningInsight.scoreTrend < 0
                    ? "💡 Nilaimu sedikit menurun. Coba review kembali materi sebelum ujian berikutnya."
                    : "✨ Performa kamu cukup konsisten. Terus pertahankan kebiasaan belajarmu!"}
            </div>
          </section>

          {/* Recent Exams */}
          <section className="min-h-[360px] lg:flex-1 lg:min-h-0 bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-sm flex flex-col overflow-hidden">
            <div className="shrink-0 p-4 sm:p-5 pb-3">
              <h2 className="font-bold text-base sm:text-lg text-[var(--card-foreground)]">
                Ujian Terbaru
              </h2>

              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                Aktivitas ujian terakhir
              </p>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-5 pb-5 space-y-3">
              {recentHistory.length > 0 ? (
                recentHistory.map((hist) => {
                  const isGraded = hist.status === "Dinilai";
                  const isFinished = hist.status !== "Belum Selesai";

                  return (
                    <div
                      key={hist.attemptId}
                      className="border border-[var(--border)] rounded-xl p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-sm text-[var(--card-foreground)] truncate">
                            {hist.title}
                          </h3>

                          <p className="text-xs text-[var(--muted-foreground)] mt-1">
                            {hist.submittedAt
                              ? new Date(
                                hist.submittedAt,
                              ).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                              : "Belum selesai"}
                          </p>
                        </div>

                        {hist.score !== null && (
                          <span className="text-lg font-bold text-[var(--foreground)] shrink-0">
                            {hist.score}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full border inline-flex items-center gap-1.5 ${isGraded
                              ? "bg-[var(--success)]/15 border-[var(--success)]/30 text-[var(--foreground)]"
                              : "bg-[var(--warning)]/15 border-[var(--warning)]/30 text-[var(--foreground)]"
                            }`}
                        >
                          {isGraded ? (
                            <CheckCircle2 size={12} />
                          ) : (
                            <Clock size={12} />
                          )}

                          {hist.status}
                        </span>

                        {isGraded ? (
                          <Link
                            href={`/siswa/ujian/${hist.attemptId}/laporan`}
                            className="text-xs font-semibold text-[var(--primary)] hover:opacity-75 transition flex items-center gap-1"
                          >
                            <FileText size={13} />
                            Buka Laporan
                          </Link>
                        ) : isFinished ? (
                          <span className="text-xs text-[var(--muted-foreground)]">
                            Menunggu penilaian
                          </span>
                        ) : (
                          <Link
                            href={`/siswa/ujian/${hist.jadwalId}/lobby`}
                            className="text-xs font-semibold text-[var(--primary)] hover:opacity-75 transition"
                          >
                            Lanjutkan →
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center px-5">
                  <Trophy
                    size={32}
                    className="text-[var(--muted-foreground)] mb-3"
                  />

                  <p className="text-sm font-medium text-[var(--foreground)]">
                    Belum ada riwayat ujian
                  </p>

                  <p className="text-xs text-[var(--muted-foreground)] mt-1">
                    Hasil ujianmu akan muncul di sini.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
