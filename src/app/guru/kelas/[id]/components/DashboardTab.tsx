"use client";

import React from "react";
import Link from "next/link";

interface DashboardTabProps {
  loadingDashboard: boolean;
  classDashboard: any;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  loadingDashboard,
  classDashboard,
}) => {
  if (loadingDashboard) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-10 text-center text-sm text-[var(--muted-foreground)]">
        Memuat dashboard kelas...
      </div>
    );
  }

  if (!classDashboard) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-10 text-center text-sm text-[var(--muted-foreground)]">
        Data dashboard kelas belum tersedia.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* CLASS OVERVIEW */}
      <section>
        <div className="mb-3">
          <h3 className="text-lg font-bold text-[var(--card-foreground)]">
            Ringkasan Kelas
          </h3>
          <p className="text-sm text-[var(--muted-foreground)]">
            Gambaran umum performa kelas saat ini.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
            <p className="text-sm text-[var(--muted-foreground)]">Siswa</p>
            <p className="mt-2 text-3xl font-bold text-[var(--card-foreground)]">
              {classDashboard.class?.studentCount ?? 0}
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
            <p className="text-sm text-[var(--muted-foreground)]">
              Rata-rata Nilai
            </p>
            <p className="mt-2 text-3xl font-bold text-[var(--primary)]">
              {classDashboard.overview?.averageScore ?? 0}%
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
            <p className="text-sm text-[var(--muted-foreground)]">
              Partisipasi
            </p>
            <p className="mt-2 text-3xl font-bold text-[var(--card-foreground)]">
              {classDashboard.overview?.participation ?? 0}%
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
            <p className="text-xs font-medium text-[var(--muted-foreground)]">
              Evaluasi Terbaru
            </p>
            <p className="mt-1 text-2xl font-bold text-[var(--card-foreground)]">
              {classDashboard.overview?.latestEvaluation ?? 0}%
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
            <p className="text-xs font-medium text-[var(--muted-foreground)]">
              Evaluasi Sebelumnya
            </p>
            <p className="mt-1 text-2xl font-bold text-[var(--card-foreground)]">
              {classDashboard.overview?.previousEvaluation ?? 0}%
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
            <p className="text-xs font-medium text-[var(--muted-foreground)]">
              Tren
            </p>
            <p
              className={`mt-1 text-2xl font-bold ${
                (classDashboard.overview?.trend ?? 0) >= 0
                  ? "text-[var(--success)]"
                  : "text-[var(--error)]"
              }`}
            >
              {(classDashboard.overview?.trend ?? 0) >= 0 ? "↑" : "↓"}{" "}
              {Math.abs(classDashboard.overview?.trend ?? 0)}%
            </p>
          </div>
        </div>
      </section>

      {/* CURRENT / UPCOMING EXAMS */}
      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-[var(--card-foreground)]">
              Evaluasi Saat Ini & Mendatang
            </h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              Aktivitas evaluasi kelas.
            </p>
          </div>

          <Link
            href="#exams"
            className="shrink-0 text-sm font-semibold text-[var(--primary)] hover:underline"
          >
            Lihat semua
          </Link>
        </div>

        <div className="space-y-3">
          {(classDashboard.exams ?? []).length === 0 ? (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 text-center text-sm text-[var(--muted-foreground)]">
              Belum ada evaluasi.
            </div>
          ) : (
            classDashboard.exams.map((exam: any) => (
              <div
                key={exam.id}
                className="flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-[var(--primary)]/10 px-2 py-1 text-xs font-bold text-[var(--primary)]">
                      📝 Ujian
                    </span>

                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        exam.status === "ONGOING"
                          ? "bg-[var(--success)]/10 text-[var(--success)]"
                          : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                      }`}
                    >
                      {exam.status === "ONGOING"
                        ? "Berlangsung"
                        : "Terjadwal"}
                    </span>
                  </div>

                  <h4 className="mt-2 truncate text-base font-bold text-[var(--card-foreground)]">
                    {exam.title}
                  </h4>

                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                    {new Date(exam.startTime).toLocaleString("id-ID")} -{" "}
                    {new Date(exam.endTime).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>

                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    {exam.participantCount ?? 0} siswa berpartisipasi
                  </p>
                </div>

                <Link
                  href={`/guru/reports/${exam.id}`}
                  className="shrink-0 rounded-lg border border-[var(--primary)]/20 px-4 py-2 text-sm font-semibold text-[var(--primary)] transition hover:bg-[var(--primary)]/5"
                >
                  Lihat Evaluasi →
                </Link>
              </div>
            ))
          )}
        </div>
      </section>

      {/* RECENT EVALUATIONS */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 md:p-6">
        <div className="mb-5">
          <h3 className="text-lg font-bold text-[var(--card-foreground)]">
            📊 Hasil Evaluasi Terbaru
          </h3>
          <p className="text-sm text-[var(--muted-foreground)]">
            Perbandingan hasil evaluasi kelas.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--muted-foreground)]">
                <th className="pb-3 font-semibold">Evaluasi</th>
                <th className="pb-3 text-right font-semibold">Rata-rata</th>
                <th className="pb-3 text-right font-semibold">Partisipasi</th>
              </tr>
            </thead>

            <tbody>
              {(classDashboard.recentEvaluations ?? []).map(
                (evaluation: any) => (
                  <tr
                    key={evaluation.id}
                    className="border-b border-[var(--border)] last:border-0"
                  >
                    <td className="py-4 font-semibold text-[var(--card-foreground)]">
                      {evaluation.title}
                    </td>

                    <td className="py-4 text-right font-bold text-[var(--primary)]">
                      {evaluation.averageScore}%
                    </td>

                    <td className="py-4 text-right text-[var(--muted-foreground)]">
                      {evaluation.participantCount} / {evaluation.totalStudents}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* PERFORMANCE + BLOOM */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Performance Trend */}
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 md:p-6">
          <div className="mb-5">
            <h3 className="text-lg font-bold text-[var(--card-foreground)]">
              📈 Performa Kelas
            </h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              Perkembangan rata-rata nilai evaluasi.
            </p>
          </div>

          <div className="flex h-56 items-end gap-3 overflow-x-auto border-b border-l border-[var(--border)] px-4 pb-0 pt-4">
            {(classDashboard.performanceTrend ?? []).map(
              (point: any, index: number) => (
                <div
                  key={`${point.label}-${index}`}
                  className="flex h-full min-w-[48px] flex-1 flex-col justify-end"
                >
                  <div className="group relative flex flex-1 items-end justify-center">
                    <div
                      className="w-full max-w-[42px] rounded-t-lg bg-[var(--primary)] transition-opacity group-hover:opacity-80"
                      style={{
                        height: `${Math.max(
                          4,
                          Math.min(100, point.averageScore ?? 0)
                        )}%`,
                      }}
                      title={`${point.averageScore}%`}
                    />
                  </div>

                  <div className="pt-2 text-center text-xs text-[var(--muted-foreground)]">
                    {point.label}
                  </div>
                </div>
              )
            )}
          </div>

          {classDashboard.performanceTrend?.length > 1 && (
            <p className="mt-4 text-sm text-[var(--muted-foreground)]">
              Performa kelas{" "}
              <span className="font-semibold text-[var(--card-foreground)]">
                {(
                  classDashboard.performanceTrend[
                    classDashboard.performanceTrend.length - 1
                  ].averageScore -
                  classDashboard.performanceTrend[0].averageScore
                ).toFixed(0)}%
              </span>{" "}
              dibandingkan evaluasi pertama.
            </p>
          )}
        </section>

        {/* Bloom Performance */}
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 md:p-6">
          <div className="mb-5">
            <h3 className="text-lg font-bold text-[var(--card-foreground)]">
              🧠 Performa Bloom
            </h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              Kemampuan kelas berdasarkan level kognitif.
            </p>
          </div>

          <div className="space-y-4">
            {(classDashboard.bloomPerformance ?? []).map((bloom: any) => (
              <div key={bloom.level}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-semibold text-[var(--card-foreground)]">
                    {bloom.level}
                  </span>

                  <span className="font-bold text-[var(--muted-foreground)]">
                    {bloom.averageScore}%
                  </span>
                </div>

                <div className="h-2.5 overflow-hidden rounded-full bg-[var(--muted)]">
                  <div
                    className="h-full rounded-full bg-[var(--primary)] transition-all"
                    style={{
                      width: `${Math.max(
                        0,
                        Math.min(100, bloom.averageScore ?? 0)
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* WEAK TOPICS + STUDENTS REQUIRING ATTENTION */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Weak Topics */}
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 md:p-6">
          <div className="mb-5">
            <h3 className="text-lg font-bold text-[var(--card-foreground)]">
              📚 Topik yang Perlu Diperhatikan
            </h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              Materi dengan tingkat akurasi terendah.
            </p>
          </div>

          <div className="space-y-3">
            {(classDashboard.weakTopics ?? []).length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">
                Belum cukup data untuk menentukan topik yang perlu
                diperhatikan.
              </p>
            ) : (
              classDashboard.weakTopics.map((topic: any) => (
                <div
                  key={topic.id}
                  className="flex flex-col gap-3 rounded-xl bg-[var(--muted)]/50 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-[var(--card-foreground)]">
                      {topic.name}
                    </p>

                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      {topic.accuracy}% akurasi
                    </p>
                  </div>

                  <Link
                    href={`/guru/buku/${topic.bukuId}/bab/${topic.id}`}
                    className="shrink-0 text-sm font-semibold text-[var(--primary)] hover:underline"
                  >
                    Lihat Soal →
                  </Link>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Students Requiring Attention */}
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 md:p-6">
          <div className="mb-5">
            <h3 className="text-lg font-bold text-[var(--card-foreground)]">
              👀 Siswa yang Perlu Diperhatikan
            </h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              Siswa dengan performa yang membutuhkan perhatian.
            </p>
          </div>

          <div className="space-y-3">
            {(classDashboard.studentsRequiringAttention ?? []).length === 0 ? (
              <div className="rounded-xl bg-[var(--success)]/10 p-4 text-sm text-[var(--success)]">
                Tidak ada siswa yang membutuhkan perhatian khusus.
              </div>
            ) : (
              classDashboard.studentsRequiringAttention.map((student: any) => (
                <div
                  key={student.id}
                  className="flex flex-col gap-2 rounded-xl bg-[var(--muted)]/50 p-4 transition hover:bg-[var(--muted)] sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-[var(--card-foreground)]">
                      {student.name}
                    </p>

                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      {student.issue || "Perlu perhatian"}
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="font-bold text-[var(--card-foreground)]">
                      {student.averageScore}%
                    </p>

                    {student.trend !== undefined && (
                      <p
                        className={`text-xs font-semibold ${
                          student.trend < 0
                            ? "text-[var(--error)]"
                            : "text-[var(--success)]"
                        }`}
                      >
                        {student.trend < 0 ? "↓" : "↑"}{" "}
                        {Math.abs(student.trend)}%
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* RECENT ACTIVITY */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 md:p-6">
        <div className="mb-5">
          <h3 className="text-lg font-bold text-[var(--card-foreground)]">
            🕐 Aktivitas Terbaru
          </h3>
        </div>

        <div className="space-y-4">
          {(classDashboard.recentActivity ?? []).length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)]">
              Belum ada aktivitas terbaru.
            </p>
          ) : (
            classDashboard.recentActivity.map((activity: any) => (
              <div
                key={activity.id}
                className="flex gap-3 border-b border-[var(--border)] pb-4 last:border-0 last:pb-0"
              >
                <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--primary)]" />

                <div>
                  <p className="text-sm font-medium text-[var(--card-foreground)]">
                    {activity.description}
                  </p>

                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    {new Date(activity.createdAt).toLocaleString("id-ID")}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};
