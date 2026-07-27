"use client";

import React, { use, useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useAttemptViewModel } from "./GuruReportsAttemptViewModel";

export default function AttemptReviewPage({
  params,
}: {
  params: Promise<{ attempt_id: string }>;
}) {
  const resolvedParams = use(params);
  const { attempt, handleGradeAttempt } = useAttemptViewModel(
    resolvedParams.attempt_id,
  );

  // Local state to track inputs for each answer being graded
  const [grades, setGrades] = useState<
    Record<string, { nilaiPoin: number; catatanKoreksi: string }>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-fill the local state if the answer already has points
  useEffect(() => {
    if (attempt?.answers) {
      const initialGrades: Record<
        string,
        { nilaiPoin: number; catatanKoreksi: string }
      > = {};
      attempt.answers.forEach((ans) => {
        // We only pre-fill for ESSAY to allow grading overrides
        if (ans.type === "ESSAY") {
          initialGrades[ans.jawabanId] = {
            nilaiPoin: ans.point || 0,
            catatanKoreksi: attempt.feedback || "", // Using top-level feedback if specific isn't mapped yet
          };
        }
      });
      setGrades(initialGrades);
    }
  }, [attempt]);

  const onGradeChange = (
    jawabanId: string,
    field: "nilaiPoin" | "catatanKoreksi",
    value: string | number,
  ) => {
    setGrades((prev) => ({
      ...prev,
      [jawabanId]: {
        ...prev[jawabanId],
        [field]: value,
      },
    }));
  };

  const onSave = async () => {
    setIsSubmitting(true);
    try {
      // Convert the grades object into the array format expected by the ViewModel
      const payload = Object.entries(grades).map(([jawabanId, data]) => ({
        jawabanId: parseInt(jawabanId),
        nilaiPoin: Number(data.nilaiPoin),
        catatanKoreksi: data.catatanKoreksi,
      }));

      await handleGradeAttempt(payload);
      alert("Nilai berhasil disimpan!");
    } catch (error) {
      console.error("Gagal menyimpan nilai", error);
      alert("Terjadi kesalahan saat menyimpan nilai.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!attempt)
    return (
      <p className="text-[var(--muted-foreground)]">Memuat percobaan...</p>
    );

  return (
    <div className="space-y-6 max-w-4xl">
      <button
        onClick={() => window.history.back()}
        className="inline-flex items-center gap-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition mb-2"
      >
        <ArrowLeft size={16} /> Kembali ke Leaderboard
      </button>

      <div className="flex justify-between items-end pb-4 border-b border-[var(--border)]">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            Review Jawaban: {attempt.studentName}
          </h1>
          <p className="text-[var(--muted-foreground)] mt-1">
            Status saat ini:{" "}
            <span className="font-medium text-[var(--foreground)]">
              {attempt.status}
            </span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-[var(--muted-foreground)]">
            Total Skor (Sementara)
          </p>
          <p className="text-3xl font-bold text-[var(--primary)]">
            {attempt.score || "0"}
          </p>
        </div>
      </div>

      {/* Loop through the actual answers from the DTO */}
      <div className="space-y-6">
        {attempt.answers?.map((ans, index) => (
          <div
            key={ans.jawabanId}
            className="bg-[var(--card)] p-6 rounded-xl border border-[var(--border)] shadow-sm space-y-4"
          >
            <div className="flex justify-between items-start">
              <span className="bg-[var(--accent)] text-white text-xs px-2 py-1 rounded font-bold">
                {ans.type || "SOAL"} #{index + 1}
              </span>
              <span className="text-sm text-[var(--muted-foreground)]">
                Poin Saat Ini: {ans.point || 0}
              </span>
            </div>

            <p className="text-[var(--foreground)] font-medium">{ans.text}</p>

            <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--input)] text-sm text-[var(--foreground)]">
              <p className="font-semibold text-[var(--muted-foreground)] mb-2">
                Jawaban Siswa:
              </p>
              {ans.studentAnswer || (
                <i className="text-[var(--muted-foreground)]">
                  Tidak ada jawaban
                </i>
              )}
            </div>

            {/* Panel Penilaian Manual - Only show for essays */}
            {ans.type === "ESSAY" && (
              <div className="bg-[var(--muted)] p-4 rounded-lg space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Berikan Poin
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={grades[ans.jawabanId].nilaiPoin}
                    onChange={(e) =>
                      onGradeChange(ans.jawabanId, "nilaiPoin", e.target.value)
                    }
                    placeholder="0"
                    className="w-24 p-2 border border-[var(--border)] rounded text-[var(--foreground)] focus:ring-2 focus:ring-[var(--ring)] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Catatan Koreksi Guru (opsional)
                  </label>
                  <textarea
                    rows={3}
                    value={grades[ans.jawabanId].catatanKoreksi}
                    onChange={(e) =>
                      onGradeChange(
                        ans.jawabanId,
                        "catatanKoreksi",
                        e.target.value,
                      )
                    }
                    placeholder="Tambahkan feedback untuk siswa..."
                    className="w-full p-2 border border-[var(--border)] rounded text-[var(--foreground)] focus:ring-2 focus:ring-[var(--ring)] outline-none"
                  ></textarea>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-4 mt-6">
        <button
          onClick={onSave}
          disabled={isSubmitting}
          className="bg-[var(--primary)] text-[var(--primary-foreground)] px-6 py-2 rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50"
        >
          {isSubmitting ? "Menyimpan..." : "Simpan Nilai"}
        </button>
      </div>
    </div>
  );
}
