"use client";

import React, { use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  Play,
  Square,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Users,
  FileText,
} from "lucide-react";
import { useExamMonitoringViewModel } from "./GuruExamMonitoringViewModel";

export default function LiveExamMonitoringPage({
  params,
}: {
  params: Promise<{ id: string; jadwal_id: string }>;
}) {
  const resolvedParams = use(params);
  const {
    examData,
    loading,
    autoRefresh,
    setAutoRefresh,
    lastRefreshedAt,
    fetchProgress,
    handleStartExam,
    handleStopExam,
  } = useExamMonitoringViewModel(resolvedParams.jadwal_id);

  if (loading && !examData) {
    return (
      <div className="p-8 text-center text-[var(--muted-foreground)] font-sans">
        Memuat data pemantauan ujian...
      </div>
    );
  }

  if (!examData) {
    return (
      <div className="p-8 text-center text-[var(--muted-foreground)] font-sans space-y-4">
        <p>Jadwal ujian tidak ditemukan.</p>
        <Link
          href={`/guru/kelas/${resolvedParams.id}`}
          className="inline-flex items-center gap-2 text-sm text-[var(--primary)] font-bold hover:underline"
        >
          <ArrowLeft size={16} /> Kembali ke Kelas
        </Link>
      </div>
    );
  }

  const totalStudents = examData.studentsProgress.length;
  const inProgressCount = examData.studentsProgress.filter(
    (s) => s.status === "IN_PROGRESS"
  ).length;
  const completedCount = examData.studentsProgress.filter(
    (s) => s.status === "COMPLETED"
  ).length;
  const flaggedCount = examData.studentsProgress.filter(
    (s) => s.cheatCount > 0
  ).length;

  return (
    <div className="space-y-6 px-4 md:px-0 font-sans">
      {/* Breadcrumb */}
      <Link
        href={`/guru/kelas/${resolvedParams.id}`}
        className="inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition mb-2"
      >
        <ArrowLeft size={16} /> Kembali ke Detail Kelas ({examData.kelasName})
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold bg-[var(--primary)]/10 text-[var(--primary)] px-2.5 py-0.5 rounded uppercase">
              {examData.type}
            </span>
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded ${examData.status === "ONGOING"
                ? "bg-green-100 text-green-800"
                : examData.status === "COMPLETED"
                  ? "bg-gray-100 text-gray-800"
                  : "bg-blue-100 text-blue-800"
                }`}
            >
              {examData.status === "ONGOING"
                ? "Sedang Berlangsung"
                : examData.status === "COMPLETED"
                  ? "Ujian Selesai"
                  : "Terjadwal"}
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--foreground)] tracking-tight">
            Pemantauan Ujian: {examData.title}
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1 flex flex-wrap items-center gap-3">
            <span>Total Soal: {examData.totalQuestions} Soal</span>
            <span>•</span>
            <span>Kelas: {examData.kelasName}</span>
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => fetchProgress()}
            className="flex items-center gap-2 border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)]/50 text-[var(--foreground)] px-3.5 py-2 rounded-lg text-sm font-semibold shadow transition cursor-pointer"
            title="Perbarui Data"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Perbarui
          </button>

          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`text-xs px-3 py-2 rounded-lg border font-semibold transition cursor-pointer ${autoRefresh
              ? "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400"
              : "border-[var(--border)] text-[var(--muted-foreground)]"
              }`}
          >
            Auto-refresh: {autoRefresh ? "ON (7s)" : "OFF"}
          </button>

          {examData.status !== "ONGOING" && examData.status !== "COMPLETED" && (
            <button
              onClick={handleStartExam}
              className="flex items-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition cursor-pointer"
            >
              <Play size={16} /> Mulai Sesi Ujian
            </button>
          )}

          {examData.status === "ONGOING" && (
            <button
              onClick={handleStopExam}
              className="flex items-center gap-1.5 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition cursor-pointer"
            >
              <Square size={16} /> Hentikan Ujian
            </button>
          )}
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[var(--card)] border border-[var(--border)] p-4 rounded-xl shadow-sm">
          <div className="flex items-center gap-2 text-[var(--muted-foreground)] text-xs font-semibold">
            <Users size={16} /> Total Siswa
          </div>
          <p className="text-2xl font-black text-[var(--foreground)] mt-2">
            {totalStudents}
          </p>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] p-4 rounded-xl shadow-sm">
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-xs font-semibold">
            <Clock size={16} /> Mengerjakan
          </div>
          <p className="text-2xl font-black text-green-600 dark:text-green-400 mt-2">
            {inProgressCount}
          </p>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] p-4 rounded-xl shadow-sm">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-xs font-semibold">
            <CheckCircle2 size={16} /> Selesai
          </div>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-2">
            {completedCount}
          </p>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] p-4 rounded-xl shadow-sm">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-semibold">
            <AlertTriangle size={16} /> Terdeteksi Kecurangan
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
            {flaggedCount}
          </p>
        </div>
      </div>

      {/* Realtime Student Progress Table */}
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--muted)]/20">
          <h3 className="font-bold text-[var(--foreground)] text-base">
            Daftar Status Siswa Realtime
          </h3>
          <span className="text-xs text-[var(--muted-foreground)]">
            Terakhir diperbarui: {lastRefreshedAt.toLocaleTimeString("id-ID")}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse min-w-[700px]">
            <thead className="bg-[var(--muted)] text-[var(--foreground)] border-b border-[var(--border)] text-xs">
              <tr>
                <th className="p-4 font-bold">Nama Siswa</th>
                <th className="p-4 font-bold text-center">Status</th>
                <th className="p-4 font-bold text-center">Waktu Mulai</th>
                <th className="p-4 font-bold text-center">Soal Terjawab</th>
                <th className="p-4 font-bold text-center">Indikasi Kecurangan</th>
                <th className="p-4 font-bold text-center">Aksi / Nilai</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {examData.studentsProgress.map((student) => {
                const isFinished = student.status === "COMPLETED";
                const isInProgress = student.status === "IN_PROGRESS";
                const isNotStarted = student.status === "NOT_STARTED";

                return (
                  <tr
                    key={student.studentId}
                    className="hover:bg-[var(--muted)]/30 transition-colors"
                  >
                    <td className="p-4">
                      <p className="font-semibold text-[var(--card-foreground)]">
                        {student.studentName}
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {student.studentEmail}
                      </p>
                    </td>

                    <td className="p-4 text-center">
                      {isInProgress && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-500/15 text-green-700 dark:text-green-400 border border-green-500/30">
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          Mengerjakan
                        </span>
                      )}
                      {isFinished && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30">
                          Selesai
                        </span>
                      )}
                      {isNotStarted && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-500/10 text-gray-500 border border-gray-500/20">
                          Belum Mulai
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-center text-xs text-[var(--muted-foreground)]">
                      {student.waktuMulai
                        ? new Date(student.waktuMulai).toLocaleTimeString(
                          "id-ID",
                          { hour: "2-digit", minute: "2-digit", second: "2-digit" }
                        )
                        : "-"}
                    </td>

                    <td className="p-4 text-center">
                      <span className="font-bold text-[var(--foreground)]">
                        {student.answeredCount}
                      </span>
                      <span className="text-xs text-[var(--muted-foreground)]">
                        {" "}
                        / {examData.totalQuestions}
                      </span>
                    </td>

                    <td className="p-4 text-center">
                      {student.cheatCount > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30">
                          <AlertTriangle size={14} /> {student.cheatCount} kali
                        </span>
                      ) : (
                        <span className="text-xs text-[var(--muted-foreground)]">
                          -
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-center">
                      {isFinished ? (
                        <div className="flex items-center justify-center gap-2">
                          <span className="font-black text-[var(--primary)] text-base">
                            {student.nilaiAkhir !== null
                              ? Math.round(student.nilaiAkhir)
                              : "-"}
                          </span>
                          {student.attemptId && (
                            student.isAIResponded ? (
                              <Link
                                href={`/guru/reports/attempt/${student.attemptId}`}
                                className="inline-flex items-center gap-1 text-xs text-[var(--primary)] hover:underline border border-[var(--primary)]/20 px-2.5 py-1 rounded-md hover:bg-[var(--primary)]/5 font-semibold"
                              >
                                <FileText size={12} /> Hasil
                              </Link>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-gray-500/15 text-gray-600 dark:text-gray-400 border border-gray-500/30">
                                Sedang diperiksa AI
                              </span>
                            )
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-[var(--muted-foreground)]">
                          -
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
