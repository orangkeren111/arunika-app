"use client";

import React from "react";
import Link from "next/link";
import { Clock, Play, Square } from "lucide-react";

interface ExamItem {
  id: string;
  type: string;
  status: string;
  title: string;
  durationMinutes: number;
  startTime: string;
  endTime: string;
}

interface ExamsTabProps {
  loadingExams: boolean;
  exams: ExamItem[];
  classId: string;
  handleStartExam: (id: string) => void;
  handleStopExam: (id: string) => void;
}

export const ExamsTab: React.FC<ExamsTabProps> = ({
  loadingExams,
  exams,
  classId,
  handleStartExam,
  handleStopExam,
}) => {

  if (loadingExams) {
    return (
      <p className="p-4 text-center text-sm text-[var(--muted-foreground)]">
        Memuat daftar ujian...
      </p>
    );
  }

  if (exams.length === 0) {
    return (
      <div className="bg-[var(--card)] p-8 text-center text-[var(--muted-foreground)] rounded-xl border border-[var(--border)]">
        Belum ada ujian yang dijadwalkan untuk kelas ini.
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
                  className={`text-xs font-semibold px-2 py-0.5 rounded ${
                    exam.status === "ONGOING"
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
                <span>
                  Mulai: {new Date(exam.startTime).toLocaleString("id-ID")}
                </span>
                <span>
                  Selesai: {new Date(exam.endTime).toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/guru/kelas/${classId}/ujian/${exam.id}`}
                className="text-xs text-[var(--foreground)] bg-[var(--muted)] hover:bg-[var(--muted)]/80 px-3 py-2 rounded-lg font-semibold flex items-center gap-1 transition"
              >
                Pantau Ujian
              </Link>

              {exam.status !== "ONGOING" && exam.status !== "COMPLETED" && (
                <button
                  onClick={() => handleStartExam(exam.id)}
                  className="flex items-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition cursor-pointer"
                >
                  <Play size={16} /> Mulai Ujian
                </button>
              )}
              {exam.status === "ONGOING" && (
                <button
                  onClick={() => handleStopExam(exam.id)}
                  className="flex items-center gap-1.5 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition cursor-pointer"
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
    </div>
  );
};
