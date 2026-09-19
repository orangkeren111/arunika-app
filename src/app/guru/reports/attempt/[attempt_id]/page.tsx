"use client";

import React, { use, useState, useEffect } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Bot,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  PenTool,
  FileText,
} from "lucide-react";
import { useAttemptViewModel } from "./GuruReportsAttemptViewModel";
import { ReportTemplate } from "@/src/components/ReportTemplate";
import { useRouter } from "next/navigation";

export default function AttemptReviewPage({
  params,
}: {
  params: Promise<{ attempt_id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();

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

  // Pagination & Tabs State
  const [activeView, setActiveView] = useState<"koreksi" | "laporan">("koreksi");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // Changed to 6 so it balances nicely in 2 columns (3 rows of 2)

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

  const copyAiToComment = async (
    jawabanId: string,
    aiResponse: string,
  ) => {
    try {
      onGradeChange(jawabanId, "catatanKoreksi", aiResponse);
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

  const onCorrectToggle = (ans: any, checked: boolean) => {
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

    onGradeChange(ans.jawabanId, "isCorrect", checked);
  };

  const onSave = async () => {
    setIsSubmitting(true);

    try {
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
      router.back();
    } catch (error) {
      console.error("Gagal menyelesaikan pemeriksaan", error);
      alert("Terjadi kesalahan saat menyelesaikan pemeriksaan.");
    } finally {
      setIsFinishing(false);
    }
  };

  if (!attempt) {
    return (
      <div className="w-full h-40 flex items-center justify-center">
        <p className="text-[var(--muted-foreground)]">Memuat percobaan...</p>
      </div>
    );
  }

  // --- Pagination Logic ---
  const totalQuestions = attempt.answers?.length || 0;
  const totalPages = Math.ceil(totalQuestions / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentAnswers = attempt.answers?.slice(startIndex, startIndex + itemsPerPage) || [];

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header & Back Button */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition mb-2"
      >
        <ArrowLeft size={16} />
        Kembali ke Leaderboard
      </button>

      {/* Responsive Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-4 border-b border-[var(--border)]">
        <div className="w-full sm:w-auto">
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">
            Review Jawaban: {attempt.studentName}
          </h1>

          <p className="text-sm sm:text-base text-[var(--muted-foreground)] mt-1 flex items-center gap-2">
            Status saat ini:{" "}
            <span className="font-semibold text-[var(--foreground)]">
              {attempt.isChecked
                ? "Selesai Diperiksa (Publik)"
                : attempt.status}
            </span>
          </p>
        </div>

        <div className="w-full sm:w-auto flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-end bg-[var(--muted)] sm:bg-transparent p-3 sm:p-0 rounded-lg sm:rounded-none">
          <p className="text-sm text-[var(--muted-foreground)]">Total Skor</p>
          <p className="text-2xl sm:text-3xl font-bold text-[var(--primary)]">
            {attempt.score !== null ? `${attempt.score} / 100` : "0 / 100"}
          </p>
        </div>
      </div>

      {/* Tabs / Switch Control */}
      <div className="flex bg-[var(--muted)] p-1.5 rounded-lg w-full sm:w-fit mt-4">
        <button
          onClick={() => setActiveView("koreksi")}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-md text-sm font-semibold transition-all ${activeView === "koreksi"
              ? "bg-[var(--background)] text-[var(--foreground)] shadow-sm"
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
        >
          <PenTool size={16} />
          Koreksi Manual
        </button>
        <button
          onClick={() => setActiveView("laporan")}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-md text-sm font-semibold transition-all ${activeView === "laporan"
              ? "bg-[var(--background)] text-[var(--foreground)] shadow-sm"
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
        >
          <FileText size={16} />
          Laporan AI
        </button>
      </div>

      {/* VIEW RENDERER */}
      {activeView === "koreksi" ? (
        <div className="space-y-6">
          {/* Question List (Responsive Grid: 1 col on mobile, 2 cols on desktop) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {currentAnswers.map((ans, index) => {
              const currentGrade = grades[ans.jawabanId];
              const globalIndex = startIndex + index;
              const mcqOptions =
                ans.type === "MCQ" ? parseMcqOptions(ans.opsiJawaban) : [];

              return (
                <div
                  key={ans.jawabanId}
                  className="bg-[var(--card)] p-4 sm:p-6 rounded-xl border border-[var(--border)] shadow-sm space-y-4 w-full"
                >
                  {/* Item Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                    <span className="bg-[var(--accent)] text-[var(--accent-foreground)] text-xs px-2 py-1 rounded font-bold whitespace-nowrap">
                      {ans.type || "SOAL"} #{globalIndex + 1}
                    </span>

                    <div className="flex items-center gap-3 sm:gap-4 text-sm w-full sm:w-auto justify-between sm:justify-end">
                      <span className="text-[var(--muted-foreground)]">
                        Poin: {currentGrade?.nilaiPoin ?? (ans.point || 0)}
                      </span>

                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={currentGrade?.isCorrect ?? ans.isCorrect}
                          onChange={(e) =>
                            onCorrectToggle(ans, e.target.checked)
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
                  {ans.type === "MCQ" && mcqOptions.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-[var(--muted-foreground)]">
                        Pilihan Jawaban:
                      </p>

                      <div className="space-y-2">
                        {mcqOptions.map((option) => {
                          const studentSelected = isStudentOption(
                            option,
                            ans.studentAnswer || "",
                          );
                          const correct = option.text === ans.jawabanBenarMCQ;

                          let optionClass =
                            "border-[var(--border)] bg-[var(--background)]";

                          if (correct) {
                            optionClass =
                              "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30";
                          }

                          if (studentSelected && !correct) {
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
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2 font-semibold text-blue-700 dark:text-blue-300">
                          <Bot size={16} />
                          Analisis AI
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            copyAiToComment(ans.jawabanId, ans.aiResponse)
                          }
                          className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-3 py-1.5 rounded-md border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition text-xs font-medium"
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

                  {/* Manual grading / Feedback Editor */}
                  <div className="bg-[var(--muted)] p-4 rounded-lg space-y-4 mt-4">
                    {ans.type === "ESSAY" && (
                      <div>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                          Berikan Poin (0 - 100)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={currentGrade?.nilaiPoin ?? 0}
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
                    )}

                    <div>
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                        Catatan Koreksi Guru (opsional)
                      </label>
                      <textarea
                        rows={3}
                        value={currentGrade?.catatanKoreksi ?? ""}
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
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[var(--border)] pt-6 mt-6">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-full sm:w-auto justify-center inline-flex items-center gap-2 px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-[var(--muted)] transition-colors"
              >
                <ChevronLeft size={16} />
                Sebelumnya
              </button>

              <span className="text-sm font-medium text-[var(--muted-foreground)]">
                Halaman {currentPage} dari {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-full sm:w-auto justify-center inline-flex items-center gap-2 px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-[var(--muted)] transition-colors"
              >
                Selanjutnya
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* Action Buttons (Responsive Bottom) */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-6 pb-12">
            <button
              onClick={onSave}
              disabled={isSubmitting || isFinishing}
              className="w-full sm:w-auto justify-center bg-[var(--secondary)] text-[var(--secondary-foreground)] px-6 py-2.5 rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Nilai Draf"}
            </button>

            <button
              onClick={onFinish}
              disabled={isSubmitting || isFinishing}
              className="w-full sm:w-auto justify-center bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg font-medium inline-flex items-center gap-2 transition disabled:opacity-50"
            >
              <CheckCircle2 size={18} />
              {isFinishing ? "Memproses..." : "Selesai Review & Publikasikan"}
            </button>
          </div>
        </div>
      ) : (
        /* Report View */
        <div className="bg-[var(--card)] p-4 sm:p-8 rounded-xl border border-[var(--border)] shadow-sm min-h-[400px]">
          {reportData ? (
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-6 text-[var(--foreground)] flex items-center gap-2">
                <Bot className="text-blue-500" /> Laporan Analisis Hasil Belajar AI
              </h2>
              <ReportTemplate {...reportData} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
              <FileText size={48} className="text-[var(--muted-foreground)] mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-[var(--foreground)]">Belum ada laporan</h3>
              <p className="text-[var(--muted-foreground)] max-w-md mt-2">
                Laporan analisis AI untuk percobaan ini belum tersedia atau sedang diproses.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}