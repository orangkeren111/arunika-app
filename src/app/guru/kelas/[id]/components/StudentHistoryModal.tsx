"use client";

import React from "react";
import { X } from "lucide-react";

interface StudentHistoryModalProps {
  selectedStudent: { id: string; name: string } | null;
  onClose: () => void;
  loadingHistory: boolean;
  studentHistory: Array<{
    attemptId: string;
    title: string;
    submittedAt: string;
    score: number | null;
  }>;
}

export const StudentHistoryModal: React.FC<StudentHistoryModalProps> = ({
  selectedStudent,
  onClose,
  loadingHistory,
  studentHistory,
}) => {
  if (!selectedStudent) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-[var(--card)] w-full max-w-xl p-6 rounded-xl border border-[var(--border)] shadow-xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition cursor-pointer"
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
            <p className="text-center text-sm text-[var(--muted-foreground)] p-4">
              Memuat riwayat...
            </p>
          ) : studentHistory.length === 0 ? (
            <p className="text-center text-sm text-[var(--muted-foreground)] p-4">
              Belum ada ujian yang dikerjakan oleh siswa ini.
            </p>
          ) : (
            <div className="divide-y divide-[var(--border)] border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--background)]">
              {studentHistory.map((history) => (
                <div
                  key={history.attemptId}
                  className="p-4 flex justify-between items-center hover:bg-[var(--muted)]/10"
                >
                  <div>
                    <h4 className="font-bold text-[var(--card-foreground)]">
                      {history.title}
                    </h4>
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                      Diselesaikan:{" "}
                      {history.submittedAt !== "Belum Selesai"
                        ? new Date(history.submittedAt).toLocaleString("id-ID")
                        : "Belum Selesai"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-extrabold text-[var(--primary)]">
                      {history.score !== null ? Math.round(history.score) : "-"}
                    </span>
                    <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                      Skor Akhir
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-[var(--primary-foreground)] bg-[var(--primary)] rounded-lg hover:opacity-90 transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
