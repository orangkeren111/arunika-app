"use client";

import React, { use, useState, useEffect } from "react";
import { ArrowLeft, CheckCircle2, Bot } from "lucide-react";
import { useAttemptViewModel } from "./GuruReportsAttemptViewModel";
import { ReportTemplate } from "@/src/components/ReportTemplate";

export default function AttemptReviewPage({
  params,
}: {
  params: Promise<{ attempt_id: string }>;
}) {
  const resolvedParams = use(params);
  const { attempt, reportData, handleGradeAttempt, handleFinishAttempt } = useAttemptViewModel(
    resolvedParams.attempt_id,
  );

  // Local state to track inputs for each answer being graded
  const [grades, setGrades] = useState<
    Record<string, { nilaiPoin: number; catatanKoreksi: string; isCorrect: boolean }>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  // Pre-fill the local state if the answer already has points
  useEffect(() => {
    if (attempt?.answers) {
      const initialGrades: Record<
        string,
        { nilaiPoin: number; catatanKoreksi: string; isCorrect: boolean }
      > = {};
      attempt.answers.forEach((ans) => {
        initialGrades[ans.jawabanId] = {
          nilaiPoin: ans.point ?? 0,
          catatanKoreksi: ans.feedback || "",
          isCorrect: ans.isCorrect ?? (ans.point > 0),
        };
      });
      setGrades(initialGrades);
    }
  }, [attempt]);

  const onGradeChange = (
    jawabanId: string,
    field: "nilaiPoin" | "catatanKoreksi" | "isCorrect",
    value: string | number | boolean,
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
        isCorrect: data.isCorrect,
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

  const onFinish = async () => {
    setIsFinishing(true);
    try {
      await onSave();
      await handleFinishAttempt();
      alert("Pemeriksaan selesai dan laporan dipublikasikan ke siswa!");
    } catch (error) {
      console.error("Gagal menyelesaikan pemeriksaan", error);
      alert("Terjadi kesalahan saat menyelesaikan pemeriksaan.");
    } finally {
      setIsFinishing(false);
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
          <p className="text-[var(--muted-foreground)] mt-1 flex items-center gap-2">
            Status saat ini:{" "}
            <span className="font-semibold text-[var(--foreground)]">
              {attempt.isChecked ? "Selesai Diperiksa (Publik)" : attempt.status}
            </span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-[var(--muted-foreground)]">
            Total Skor
          </p>
          <p className="text-3xl font-bold text-[var(--primary)]">
            {attempt.score !== null ? attempt.score : "0"}
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
              <div className="flex items-center gap-4 text-sm">
                <span className="text-[var(--muted-foreground)]">
                  Poin: {grades[ans.jawabanId]?.nilaiPoin ?? (ans.point || 0)}
                </span>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={grades[ans.jawabanId]?.isCorrect ?? ans.isCorrect}
                    onChange={(e) =>
                      onGradeChange(ans.jawabanId, "isCorrect", e.target.checked)
                    }
                    className="rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--ring)]"
                  />
                  Status Benar
                </label>
              </div>
            </div>

            <p className="text-[var(--foreground)] font-medium">{ans.text}</p>

            {/* Kunci / Panduan Jawaban Essay Benar jika ada */}
            {ans.type === "ESSAY" && ans.jawabanBenarEssay && (
              <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 p-3 rounded-lg text-xs space-y-1">
                <span className="font-bold text-emerald-700 dark:text-emerald-300 block">
                  Kunci / Panduan Jawaban Benar (Referensi Soal):
                </span>
                <p className="text-[var(--foreground)] whitespace-pre-wrap">
                  {ans.jawabanBenarEssay}
                </p>
              </div>
            )}

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

            {/* Rekomendasi AI jika ada */}
            {ans.aiResponse && (
              <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg text-sm space-y-1">
                <div className="flex items-center gap-2 font-semibold text-blue-700 dark:text-blue-300">
                  <Bot size={16} /> Analisis AI (Rekomendasi Penilaian)
                </div>
                <p className="text-[var(--foreground)] whitespace-pre-wrap">
                  {ans.aiResponse}
                </p>
              </div>
            )}

            {/* Panel Penilaian Manual - Available for all / editable for essays */}
            {ans.type === "ESSAY" && (
              <div className="bg-[var(--muted)] p-4 rounded-lg space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Berikan Poin (0 - 100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={grades[ans.jawabanId]?.nilaiPoin ?? 0}
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
                    value={grades[ans.jawabanId]?.catatanKoreksi ?? ""}
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
          disabled={isSubmitting || isFinishing}
          className="bg-[var(--secondary)] text-[var(--secondary-foreground)] px-6 py-2.5 rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50"
        >
          {isSubmitting ? "Menyimpan..." : "Simpan Nilai Draf"}
        </button>
        <button
          onClick={onFinish}
          disabled={isSubmitting || isFinishing}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg font-medium inline-flex items-center gap-2 transition disabled:opacity-50"
        >
          <CheckCircle2 size={18} />
          {isFinishing ? "Memproses..." : "Selesai Review & Publikasikan"}
        </button>
      </div>

      {reportData && (
        <div className="mt-12 border-t border-[var(--border)] pt-8">
          <h2 className="text-xl font-bold mb-6 text-[var(--foreground)]">
            Laporan Analisis Hasil Belajar AI Siswa
          </h2>
          <ReportTemplate {...reportData} />
        </div>
      )}
    </div>
  );
}
