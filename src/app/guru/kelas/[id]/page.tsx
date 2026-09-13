"use client";

import React, { use, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Users,
  Award,
  Play,
  Square,
  Plus,
  X,
  Clock,
  History,
} from "lucide-react";
import { useKelasDetailViewModel } from "./GuruKelasDetailViewModel";

export default function GuruKelasDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const {
    classDetail,
    loadingClass,
    classDashboard,
    loadingDashboard,
    exams,
    loadingExams,
    gradesReport,
    loadingGrades,
    templateList,
    tipeList,
    judulJadwal,
    setJudulJadwal,
    selectedTemplate,
    setSelectedTemplate,
    selectedTipe,
    setSelectedTipe,
    waktuMulai,
    setWaktuMulai,
    waktuSelesai,
    setWaktuSelesai,
    handleCreateJadwal,
    handleStartExam,
    handleStopExam,
    // Student History Modal states
    selectedStudent,
    setSelectedStudent,
    studentHistory,
    loadingHistory,
    viewStudentHistory,
  } = useKelasDetailViewModel(resolvedParams.id);

  const [activeTab, setActiveTab] = useState<"dashboard" | "exams" | "students" | "report">("dashboard");
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  if (loadingClass || !classDetail) {
    return (
      <div className="p-8 text-center text-[var(--muted-foreground)]">
        Memuat detail kelas...
      </div>
    );
  }

  return (
    <div className="space-y-6 relative px-4 md:px-0 font-sans">
      {/* Breadcrumb */}
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
              onClick={() => setShowQRModal(true)}
              className="flex items-center gap-2 border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)]/50 text-[var(--foreground)] px-4 py-2.5 rounded-lg text-sm font-bold shadow transition-all cursor-pointer"
            >
              Bagikan Kelas (QR)
            </button>
          )}

          <button
            onClick={() => setShowScheduleModal(true)}
            className="flex items-center gap-2 bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2.5 rounded-lg text-sm font-semibold hover:opacity-95 shadow transition"
          >
            <Plus size={18} /> Jadwalkan Ujian Baru
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--border)] gap-2">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === "dashboard"
            ? "border-[var(--primary)] text-[var(--primary)]"
            : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
        >
          <Calendar size={18} />
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab("exams")}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === "exams"
            ? "border-[var(--primary)] text-[var(--primary)]"
            : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
        >
          <Calendar size={18} />
          Jadwal Ujian
        </button>
        <button
          onClick={() => setActiveTab("students")}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === "students"
            ? "border-[var(--primary)] text-[var(--primary)]"
            : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
        >
          <Users size={18} />
          Daftar Siswa
        </button>
        <button
          onClick={() => setActiveTab("report")}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === "report"
            ? "border-[var(--primary)] text-[var(--primary)]"
            : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
        >
          <Award size={18} />
          Rapor Nilai Kelas
        </button>
      </div>

      {activeTab === "dashboard" && (
        <div className="space-y-6">

          {loadingDashboard ? (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-10 text-center text-sm text-[var(--muted-foreground)]">
              Memuat dashboard kelas...
            </div>
          ) : !classDashboard ? (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-10 text-center text-sm text-[var(--muted-foreground)]">
              Data dashboard kelas belum tersedia.
            </div>
          ) : (
            <>

              {/* =========================================================
            CLASS OVERVIEW
        ========================================================= */}
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
                    <p className="text-sm text-[var(--muted-foreground)]">
                      Siswa
                    </p>
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
                      className={`mt-1 text-2xl font-bold ${(classDashboard.overview?.trend ?? 0) >= 0
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


              {/* =========================================================
            CURRENT / UPCOMING EXAMS
        ========================================================= */}
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
                              className={`rounded-full px-2 py-1 text-xs font-semibold ${exam.status === "ONGOING"
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
                            {new Date(exam.startTime).toLocaleString("id-ID")}{" "}
                            -{" "}
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


              {/* =========================================================
            RECENT EVALUATIONS
        ========================================================= */}
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
                        <th className="pb-3 text-right font-semibold">
                          Rata-rata
                        </th>
                        <th className="pb-3 text-right font-semibold">
                          Partisipasi
                        </th>
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
                              {evaluation.participantCount} /{" "}
                              {evaluation.totalStudents}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </section>


              {/* =========================================================
            PERFORMANCE + BLOOM
        ========================================================= */}
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
                    {(classDashboard.bloomPerformance ?? []).map(
                      (bloom: any) => (
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
                      )
                    )}
                  </div>
                </section>
              </div>


              {/* =========================================================
            WEAK TOPICS + STUDENTS REQUIRING ATTENTION
        ========================================================= */}
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
                    {(classDashboard.studentsRequiringAttention ?? []).length ===
                      0 ? (
                      <div className="rounded-xl bg-[var(--success)]/10 p-4 text-sm text-[var(--success)]">
                        Tidak ada siswa yang membutuhkan perhatian khusus.
                      </div>
                    ) : (
                      classDashboard.studentsRequiringAttention.map(
                        (student: any) => (
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
                                  className={`text-xs font-semibold ${student.trend < 0
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
                        )
                      )
                    )}
                  </div>
                </section>
              </div>


              {/* =========================================================
            RECENT ACTIVITY
        ========================================================= */}
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
            </>
          )}
        </div>
      )}

      {/* --- EXAMS TAB --- */}
      {activeTab === "exams" && (
        <div className="space-y-4">
          {loadingExams ? (
            <p className="p-4 text-center text-sm text-[var(--muted-foreground)]">Memuat daftar ujian...</p>
          ) : exams.length === 0 ? (
            <div className="bg-[var(--card)] p-8 text-center text-[var(--muted-foreground)] rounded-xl border border-[var(--border)]">
              Belum ada ujian yang dijadwalkan untuk kelas ini.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {exams.map((exam) => (
                <div
                  key={exam.id}
                  className="bg-[var(--card)] p-5 rounded-xl border border-[var(--border)] flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-sm transition"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[var(--primary)] bg-[var(--primary)]/10 px-2 py-0.5 rounded">
                        {exam.type}
                      </span>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded ${exam.status === "ONGOING"
                          ? "bg-green-100 text-green-800"
                          : exam.status === "COMPLETED"
                            ? "bg-gray-100 text-gray-800"
                            : "bg-blue-100 text-blue-800"
                          }`}
                      >
                        {exam.status === "ONGOING"
                          ? "Berlangsung"
                          : exam.status === "COMPLETED"
                            ? "Selesai"
                            : "Terjadwal / Draft"}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-[var(--card-foreground)]">
                      {exam.title}
                    </h3>
                    <div className="flex flex-wrap gap-4 text-xs text-[var(--muted-foreground)]">
                      <span className="flex items-center gap-1">
                        <Clock size={14} /> Durasi: {exam.durationMinutes} Menit
                      </span>
                      <span>Mulai: {new Date(exam.startTime).toLocaleString("id-ID")}</span>
                      <span>Selesai: {new Date(exam.endTime).toLocaleString("id-ID")}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {exam.status !== "ONGOING" && exam.status !== "COMPLETED" && (
                      <button
                        onClick={() => handleStartExam(exam.id)}
                        className="flex items-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition"
                      >
                        <Play size={16} /> Mulai Ujian
                      </button>
                    )}
                    {exam.status === "ONGOING" && (
                      <button
                        onClick={() => handleStopExam(exam.id)}
                        className="flex items-center gap-1.5 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition"
                      >
                        <Square size={16} /> Hentikan Ujian
                      </button>
                    )}
                    <Link
                      href={`/guru/reports/${exam.id}`}
                      className="text-xs text-[var(--primary)] hover:underline border border-[var(--primary)]/20 px-3 py-2 rounded-lg hover:bg-[var(--primary)]/5 font-semibold text-center"
                    >
                      Buka Laporan
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- STUDENTS TAB --- */}
      {activeTab === "students" && (
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-[var(--muted)] text-[var(--foreground)] border-b border-[var(--border)]">
              <tr>
                <th className="p-4 font-bold">Nama Siswa</th>
                <th className="p-4 font-bold">Email</th>
                <th className="p-4 text-center font-bold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {classDetail.students.map((student: any) => (
                <tr key={student.id} className="hover:bg-[var(--muted)]/30 transition-colors">
                  <td className="p-4 font-medium text-[var(--card-foreground)]">{student.name}</td>
                  <td className="p-4 text-[var(--muted-foreground)]">{student.email}</td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => viewStudentHistory(student)}
                      className="inline-flex items-center gap-1.5 text-xs text-[var(--primary)] border border-[var(--primary)]/20 px-3 py-1.5 rounded-lg hover:bg-[var(--primary)]/5 font-semibold"
                    >
                      <History size={14} /> Riwayat Ujian
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* --- REPORT CLASS TAB (MATRIX) --- */}
      {activeTab === "report" && (
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
          {loadingGrades ? (
            <p className="p-4 text-center text-sm text-[var(--muted-foreground)]">Memuat matriks nilai...</p>
          ) : gradesReport.length === 0 ? (
            <p className="p-8 text-center text-sm text-[var(--muted-foreground)]">Belum ada ujian di kelas ini.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse min-w-[600px]">
                <thead className="bg-[var(--muted)] text-[var(--foreground)] border-b border-[var(--border)]">
                  <tr>
                    <th className="p-4 font-bold">Siswa</th>
                    {gradesReport.map((exam) => (
                      <th key={exam.jadwalId} className="p-4 font-bold text-center max-w-[200px]" title={exam.examTitle}>
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[10px] bg-[var(--primary)]/10 text-[var(--primary)] px-2 py-0.5 rounded font-bold uppercase">
                            {exam.type}
                          </span>
                          <span className="text-xs line-clamp-2">{exam.examTitle}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {classDetail.students.map((student: any) => (
                    <tr key={student.id} className="hover:bg-[var(--muted)]/30 transition-colors">
                      <td className="p-4 font-medium text-[var(--card-foreground)]">{student.name}</td>
                      {gradesReport.map((exam) => {
                        const gradeObj = exam.grades.find((g: any) => g.siswaId === student.id);
                        const score = gradeObj?.score;
                        return (
                          <td key={exam.jadwalId} className="p-4 text-center font-semibold text-[var(--card-foreground)]">
                            {score !== undefined && score !== null ? Math.round(score) : "-"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* --- MODAL SCHEDULING EXAM --- */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-[var(--card)] w-full max-w-md p-6 rounded-xl border border-[var(--border)] shadow-xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowScheduleModal(false)}
              className="absolute top-4 right-4 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-bold mb-6 text-[var(--foreground)]">
              Jadwalkan Ujian Baru
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[var(--foreground)] mb-1">
                  Nama / Judul Sesi Ujian
                </label>
                <input
                  type="text"
                  value={judulJadwal}
                  onChange={(e) => setJudulJadwal(e.target.value)}
                  placeholder="Contoh: Kuis Harian Bab 1 Sel / PTS Biologi 1"
                  className="w-full p-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] text-sm focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--foreground)] mb-1">
                  Pilih Template Ujian
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full p-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] text-sm focus:ring-2 focus:ring-[var(--primary)]"
                >
                  <option value="">-- Pilih Template --</option>
                  {templateList.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({t.questionCount} Soal)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--foreground)] mb-1">
                  Pilih Tipe Ujian
                </label>
                <select
                  value={selectedTipe}
                  onChange={(e) => setSelectedTipe(e.target.value)}
                  className="w-full p-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] text-sm focus:ring-2 focus:ring-[var(--primary)]"
                >
                  <option value="">-- Pilih Tipe --</option>
                  {tipeList.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.namaTipeUjian}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--foreground)] mb-1">
                  Waktu Mulai Aktif
                </label>
                <input
                  type="datetime-local"
                  value={waktuMulai}
                  onChange={(e) => setWaktuMulai(e.target.value)}
                  className="w-full p-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] text-sm focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--foreground)] mb-1">
                  Waktu Selesai Aktif (Opsional)
                </label>
                <input
                  type="datetime-local"
                  value={waktuSelesai}
                  onChange={(e) => setWaktuSelesai(e.target.value)}
                  className="w-full p-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] text-sm focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 text-sm font-medium text-[var(--foreground)] bg-[var(--muted)] rounded-lg hover:bg-opacity-80 transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleCreateJadwal();
                    setShowScheduleModal(false);
                  }}
                  className="px-4 py-2 text-sm font-bold text-white bg-[var(--primary)] rounded-lg hover:opacity-90 transition"
                >
                  Simpan Jadwal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL HISTORICAL EXAM MARKS --- */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-[var(--card)] w-full max-w-xl p-6 rounded-xl border border-[var(--border)] shadow-xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedStudent(null)}
              className="absolute top-4 right-4 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-bold mb-4 text-[var(--foreground)]">
              Riwayat Nilai: {selectedStudent.name}
            </h3>
            <p className="text-xs text-[var(--muted-foreground)] mb-6">
              Daftar seluruh pengerjaan ujian siswa di dalam kelas ini.
            </p>

            <div className="space-y-4">
              {loadingHistory ? (
                <p className="text-center text-sm text-[var(--muted-foreground)] p-4">Memuat riwayat...</p>
              ) : studentHistory.length === 0 ? (
                <p className="text-center text-sm text-[var(--muted-foreground)] p-4">Belum ada ujian yang dikerjakan oleh siswa ini.</p>
              ) : (
                <div className="divide-y divide-[var(--border)] border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--background)]">
                  {studentHistory.map((history) => (
                    <div key={history.attemptId} className="p-4 flex justify-between items-center hover:bg-[var(--muted)]/10">
                      <div>
                        <h4 className="font-bold text-[var(--card-foreground)]">{history.title}</h4>
                        <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                          Diselesaikan: {history.submittedAt !== "Belum Selesai" ? new Date(history.submittedAt).toLocaleString("id-ID") : "Belum Selesai"}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-extrabold text-[var(--primary)]">
                          {history.score !== null ? Math.round(history.score) : "-"}
                        </span>
                        <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">Skor Akhir</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-6">
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2 text-sm font-semibold text-[var(--primary-foreground)] bg-[var(--primary)] rounded-lg hover:opacity-90 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl max-w-sm w-full p-6 shadow-xl relative animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowQRModal(false)}
              className="absolute top-4 right-4 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              <X size={20} />
            </button>
            <div className="text-center space-y-4 pt-2">
              <h3 className="text-lg font-bold text-[var(--foreground)]">Bagikan Kelas</h3>
              <p className="text-sm text-[var(--muted-foreground)]">
                Scan QR Code di bawah atau gunakan kode kelas untuk bergabung ke kelas <b>{classDetail.name}</b>.
              </p>

              <div className="bg-white p-4 rounded-xl inline-block border border-[var(--border)] mx-auto">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                    `${origin}/siswa/join-kelas?code=${classDetail.classCode}`
                  )}`}
                  alt="QR Code Kelas"
                  width={200}
                  height={200}
                  className="mx-auto"
                />
              </div>

              <div className="bg-[var(--primary)]/5 p-3 rounded-lg border border-[var(--primary)]/10">
                <span className="text-xs text-[var(--muted-foreground)] block">Kode Kelas</span>
                <span className="text-2xl font-black tracking-widest text-[var(--primary)] block uppercase select-all">
                  {classDetail.classCode}
                </span>
              </div>

              <p className="text-[10px] text-[var(--muted-foreground)] break-all">
                Link: {origin}/siswa/join-kelas?code={classDetail.classCode}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
