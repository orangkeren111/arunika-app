"use client";

import React, { use, useState, useEffect } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Bot,
  Copy,
  Check,
} from "lucide-react";
import { useAttemptViewModel } from "./GuruReportsAttemptViewModel";
import { ReportTemplate } from "@/src/components/ReportTemplate";

export default function AttemptReviewPage({
  params,
}: {
  params: Promise<{ attempt_id: string }>;
}) {
  const resolvedParams = use(params);

  const {
    attempt,
    reportData,
    handleGradeAttempt,
    handleFinishAttempt,
  } = useAttemptViewModel(resolvedParams.attempt_id);

  const [grades, setGrades] = useState<
    Record<
      string,
      {
        nilaiPoin: number;
        catatanKoreksi: string;
        isCorrect: boolean;
      }
    >
  >({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  // Track which AI responses have been copied
  const [copiedAi, setCopiedAi] = useState<Record<string, boolean>>({});

  // Pre-fill grading state
  useEffect(() => {
    if (attempt?.answers) {
      const initialGrades: Record<
        string,
        {
          nilaiPoin: number;
          catatanKoreksi: string;
          isCorrect: boolean;
        }
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

  /**
   * MCQ options can come in slightly different JSON shapes.
   *
   * Supported examples:
   *
   * [
   *   { "id": "A", "text": "Jakarta", "isCorrect": true },
   *   { "id": "B", "text": "Bandung", "isCorrect": false }
   * ]
   *
   * or:
   *
   * [
   *   { "label": "A", "value": "Jakarta", "isCorrect": true }
   * ]
   *
   * or:
   *
   * {
   *   "A": "Jakarta",
   *   "B": "Bandung"
   * }
   */
  const parseMcqOptions = (rawOptions: unknown) => {
    if (!rawOptions) return [];

    let parsed = rawOptions;

    if (typeof rawOptions === "string") {
      try {
        parsed = JSON.parse(rawOptions);
      } catch {
        return [];
      }
    }

    if (Array.isArray(parsed)) {
      return parsed.map((option: any, index) => ({
        key:
          option?.id ??
          option?.key ??
          option?.label ??
          String.fromCharCode(65 + index),

        text:
          option?.text ??
          option?.value ??
          option?.jawaban ??
          option?.option ??
          String(option),

        isCorrect:
          option?.isCorrect ??
          option?.correct ??
          option?.benar ??
          false,
      }));
    }

    if (typeof parsed === "object") {
      return Object.entries(parsed as Record<string, unknown>).map(
        ([key, value]) => ({
          key,
          text:
            typeof value === "object" && value !== null
              ? String(
                (value as any).text ??
                (value as any).value ??
                (value as any).jawaban ??
                "",
              )
              : String(value),
          isCorrect:
            typeof value === "object" && value !== null
              ? Boolean(
                (value as any).isCorrect ??
                (value as any).correct ??
                (value as any).benar,
              )
              : false,
        }),
      );
    }

    return [];
  };

  /**
   * Determine whether an option is the student's selected answer.
   *
   * The student's answer may be:
   * - option key, e.g. "A"
   * - option text, e.g. "Jakarta"
   */
  const isStudentOption = (
    option: { key: string; text: string },
    studentAnswer: string,
  ) => {
    if (!studentAnswer) return false;

    const student = String(studentAnswer).trim().toLowerCase();

    return (
      student === String(option.key).trim().toLowerCase() ||
      student === String(option.text).trim().toLowerCase()
    );
  };

  /**
   * Copy AI recommendation into the teacher's correction comment.
   */
  const copyAiToComment = async (
    jawabanId: string,
    aiResponse: string,
  ) => {
    try {
      onGradeChange(
        jawabanId,
        "catatanKoreksi",
        aiResponse,
      );

      await navigator.clipboard.writeText(aiResponse);

      setCopiedAi((prev) => ({
        ...prev,
        [jawabanId]: true,
      }));

      setTimeout(() => {
        setCopiedAi((prev) => ({
          ...prev,
          [jawabanId]: false,
        }));
      }, 2000);
    } catch (error) {
      console.error("Gagal menyalin AI response:", error);
    }
  };

  /**
   * For MCQ:
   * - Correct => 100 points
   * - Incorrect => 0 points
   *
   * Essay keeps its manually assigned score.
   */
  const onCorrectToggle = (
    ans: any,
    checked: boolean,
  ) => {
    if (ans.type === "MCQ") {
      setGrades((prev) => ({
        ...prev,
        [ans.jawabanId]: {
          ...prev[ans.jawabanId],
          isCorrect: checked,
          nilaiPoin: checked ? 100 : 0,
        },
      }));

      return;
    }

    onGradeChange(
      ans.jawabanId,
      "isCorrect",
      checked,
    );
  };

  const onSave = async () => {
    setIsSubmitting(true);

    try {
      const payload = Object.entries(grades).map(
        ([jawabanId, data]) => ({
          jawabanId: parseInt(jawabanId),
          nilaiPoin: Number(data.nilaiPoin),
          catatanKoreksi: data.catatanKoreksi,
          isCorrect: data.isCorrect,
        }),
      );

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

      alert(
        "Pemeriksaan selesai dan laporan dipublikasikan ke siswa!",
      );
    } catch (error) {
      console.error(
        "Gagal menyelesaikan pemeriksaan",
        error,
      );

      alert(
        "Terjadi kesalahan saat menyelesaikan pemeriksaan.",
      );
    } finally {
      setIsFinishing(false);
    }
  };

  if (!attempt) {
    return (
      <p className="text-[var(--muted-foreground)]">
        Memuat percobaan...
      </p>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <button
        onClick={() => window.history.back()}
        className="inline-flex items-center gap-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition mb-2"
      >
        <ArrowLeft size={16} />
        Kembali ke Leaderboard
      </button>

      <div className="flex justify-between items-end pb-4 border-b border-[var(--border)]">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            Review Jawaban: {attempt.studentName}
          </h1>

          <p className="text-[var(--muted-foreground)] mt-1 flex items-center gap-2">
            Status saat ini:{" "}
            <span className="font-semibold text-[var(--foreground)]">
              {attempt.isChecked
                ? "Selesai Diperiksa (Publik)"
                : attempt.status}
            </span>
          </p>
        </div>

        <div className="text-right">
          <p className="text-sm text-[var(--muted-foreground)]">
            Total Skor
          </p>

          <p className="text-3xl font-bold text-[var(--primary)]">
            {attempt.score !== null
              ? `${attempt.score} / 100`
              : "0 / 100"}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {attempt.answers?.map((ans, index) => {
          const currentGrade = grades[ans.jawabanId];

          const mcqOptions =
            ans.type === "MCQ"
              ? parseMcqOptions(ans.opsiJawaban)
              : [];

          return (
            <div
              key={ans.jawabanId}
              className="bg-[var(--card)] p-6 rounded-xl border border-[var(--border)] shadow-sm space-y-4"
            >
              {/* Header */}
              <div className="flex justify-between items-start">
                <span className="bg-[var(--accent)] text-white text-xs px-2 py-1 rounded font-bold">
                  {ans.type || "SOAL"} #{index + 1}
                </span>

                <div className="flex items-center gap-4 text-sm">
                  <span className="text-[var(--muted-foreground)]">
                    Poin:{" "}
                    {currentGrade?.nilaiPoin ??
                      (ans.point || 0)}
                  </span>

                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold">
                    <input
                      type="checkbox"
                      checked={
                        currentGrade?.isCorrect ??
                        ans.isCorrect
                      }
                      onChange={(e) =>
                        onCorrectToggle(
                          ans,
                          e.target.checked,
                        )
                      }
                      className="rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--ring)]"
                    />

                    Status Benar
                  </label>
                </div>
              </div>

              {/* Question */}
              <p className="text-[var(--foreground)] font-medium">
                {ans.text}
              </p>

              {/* MCQ OPTIONS */}
              {ans.type === "MCQ" &&
                mcqOptions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-[var(--muted-foreground)]">
                      Pilihan Jawaban:
                    </p>

                    <div className="space-y-2">
                      {mcqOptions.map((option) => {
                        const studentSelected =
                          isStudentOption(
                            option,
                            ans.studentAnswer || "",
                          );

                        const correct = option.text === ans.jawabanBenarMCQ;
                        console.log(option.text, ans.jawabanBenarMCQ, correct);



                        let optionClass =
                          "border-[var(--border)] bg-[var(--background)]";

                        // Correct answer = green
                        if (correct) {
                          optionClass =
                            "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30";
                        }

                        // Student selected but wrong = red
                        if (
                          studentSelected &&
                          !correct
                        ) {
                          optionClass =
                            "border-red-400 bg-red-50 dark:bg-red-950/30";
                        }

                        return (
                          <div
                            key={option.key}
                            className={`flex items-start gap-3 p-3 rounded-lg border ${optionClass}`}
                          >
                            <span className="font-bold min-w-6">
                              {option.key}.
                            </span>

                            <span className="flex-1 text-sm text-[var(--foreground)]">
                              {option.text}
                            </span>

                            <div className="flex items-center gap-2 text-xs font-semibold">
                              {studentSelected && (
                                <span
                                  className={
                                    correct
                                      ? "text-emerald-600 dark:text-emerald-400"
                                      : "text-red-600 dark:text-red-400"
                                  }
                                >
                                  {correct
                                    ? "Jawaban Siswa ✓"
                                    : "Jawaban Siswa ✗"}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              {/* Essay answer key */}
              {ans.type === "ESSAY" &&
                ans.jawabanBenarEssay && (
                  <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 p-3 rounded-lg text-xs space-y-1">
                    <span className="font-bold text-emerald-700 dark:text-emerald-300 block">
                      Kunci / Panduan Jawaban Benar
                      (Referensi Soal):
                    </span>

                    <p className="text-[var(--foreground)] whitespace-pre-wrap">
                      {ans.jawabanBenarEssay}
                    </p>
                  </div>
                )}

              {/* Student answer */}
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

              {/* AI recommendation */}
              {ans.aiResponse && (
                <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg text-sm space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 font-semibold text-blue-700 dark:text-blue-300">
                      <Bot size={16} />
                      Analisis AI (Rekomendasi Penilaian)
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        copyAiToComment(
                          ans.jawabanId,
                          ans.aiResponse,
                        )
                      }
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition text-xs font-medium"
                    >
                      {copiedAi[ans.jawabanId] ? (
                        <>
                          <Check size={14} />
                          Disalin
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          Salin ke Catatan Guru
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-[var(--foreground)] whitespace-pre-wrap">
                    {ans.aiResponse}
                  </p>
                </div>
              )}

              {/* Manual grading */}
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
                      value={
                        currentGrade?.nilaiPoin ?? 0
                      }
                      onChange={(e) =>
                        onGradeChange(
                          ans.jawabanId,
                          "nilaiPoin",
                          e.target.value,
                        )
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
                      value={
                        currentGrade?.catatanKoreksi ??
                        ""
                      }
                      onChange={(e) =>
                        onGradeChange(
                          ans.jawabanId,
                          "catatanKoreksi",
                          e.target.value,
                        )
                      }
                      placeholder="Tambahkan feedback untuk siswa..."
                      className="w-full p-2 border border-[var(--border)] rounded text-[var(--foreground)] focus:ring-2 focus:ring-[var(--ring)] outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Teacher comment for MCQ too */}
              {ans.type === "MCQ" && (
                <div className="bg-[var(--muted)] p-4 rounded-lg space-y-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                      Catatan Koreksi Guru (opsional)
                    </label>

                    <textarea
                      rows={3}
                      value={
                        currentGrade?.catatanKoreksi ??
                        ""
                      }
                      onChange={(e) =>
                        onGradeChange(
                          ans.jawabanId,
                          "catatanKoreksi",
                          e.target.value,
                        )
                      }
                      placeholder="Tambahkan feedback untuk siswa..."
                      className="w-full p-2 border border-[var(--border)] rounded text-[var(--foreground)] focus:ring-2 focus:ring-[var(--ring)] outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4 mt-6">
        <button
          onClick={onSave}
          disabled={isSubmitting || isFinishing}
          className="bg-[var(--secondary)] text-[var(--secondary-foreground)] px-6 py-2.5 rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50"
        >
          {isSubmitting
            ? "Menyimpan..."
            : "Simpan Nilai Draf"}
        </button>

        <button
          onClick={onFinish}
          disabled={isSubmitting || isFinishing}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg font-medium inline-flex items-center gap-2 transition disabled:opacity-50"
        >
          <CheckCircle2 size={18} />

          {isFinishing
            ? "Memproses..."
            : "Selesai Review & Publikasikan"}
        </button>
      </div>

      {/* AI Report */}
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
