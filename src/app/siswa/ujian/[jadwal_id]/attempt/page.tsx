"use client";

/* STREAMING_CHUNK:Imports and Initial Setup... */
import React, { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Timer,
  CheckCircle,
  ChevronRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { MathRenderer } from "@/src/components/MathRenderer";
import { useExamAttempt } from "./SiswaUjianAttemptViewModel";

const MAX_QUESTIONS = 40; // Sync with the default in your viewmodel

export default function ExamAttemptPage({
  params,
}: {
  params: Promise<{ jadwal_id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);

  const {
    currentQ,
    currentIndex,
    answers,
    handleAnswer,
    nextQuestion,
    handleSubmitExam,
    timeLeft,
    progress,
    loading,
    isFinished,
    warnings,
  } = useExamAttempt(resolvedParams.jadwal_id, MAX_QUESTIONS);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  // Auto-redirect when the exam is officially finished (either by time out or manual submit)
  useEffect(() => {
    if (isFinished) {
      router.push("/siswa/history");
    }
  }, [isFinished, router]);

  /* STREAMING_CHUNK:Handling Custom Modals and Submissions... */
  const executeSubmit = async () => {
    setIsFinishing(true);
    await handleSubmitExam();
    setShowConfirmModal(false);
    // Note: The useEffect above will handle the redirect once isFinished becomes true
  };

  const handleNextClick = async () => {
    if (!answers[currentQ?.id || ""]) {
      // Optional: Prevent moving forward if no answer is selected.
      // For now, we allow empty answers if they want to skip, but you can enforce it here.
    }
    await nextQuestion();
  };

  return (
    <>
      <header className="p-4 md:p-6 bg-[var(--card)] border-b border-[var(--border)]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-[var(--error)] font-bold font-mono text-base md:text-lg bg-red-500/10 px-4 py-1.5 rounded-lg border border-red-500/20">
              <Timer size={20} />
              {timeLeft}
            </div>
            {warnings > 0 && (
              <div className="flex items-center gap-1.5 text-xs md:text-sm font-bold bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-lg">
                ⚠️ Pelanggaran Tab: {warnings}/3
              </div>
            )}
          </div>
          <button
            onClick={() => setShowConfirmModal(true)}
            className="w-full sm:w-auto bg-red-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-red-700 transition flex items-center justify-center gap-2 text-sm shadow-sm"
          >
            <CheckCircle size={16} /> Selesai & Kumpulkan
          </button>
        </div>
      </header>

      <div className="h-1.5 bg-[var(--muted)] w-full">
        <div
          className="h-full bg-blue-600 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      <div className="flex-1 flex flex-col overflow-y-auto bg-[#FAFAFA] dark:bg-[#121212] p-4 md:p-8">
        <div className="w-full max-w-3xl mx-auto">
          {loading && !currentQ ? (
            <div className="flex flex-col items-center justify-center py-20 text-[var(--muted-foreground)] gap-4">
              <Loader2 size={40} className="animate-spin text-blue-600" />
              <p className="font-medium animate-pulse">
                Menyiapkan soal adaptif Anda...
              </p>
            </div>
          ) : (
            <div className="w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-sm p-5 md:p-8 min-h-[500px] flex flex-col relative overflow-hidden">
              {/* Optional Loading Overlay for between-questions */}
              {loading && currentQ && (
                <div className="absolute inset-0 bg-[var(--card)]/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center">
                  <Loader2
                    size={32}
                    className="animate-spin text-blue-600 mb-2"
                  />
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    Menyimpan & Menghitung ELO...
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center mb-6 pb-4 border-b border-[var(--border)]">
                <h2 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">
                  Soal No. {currentIndex + 1}
                </h2>
                <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 text-xs px-3 py-1.5 rounded-md font-bold tracking-wide">
                  {currentQ?.type || "MCQ"}
                </span>
              </div>

              <div className="text-lg text-[var(--foreground)] leading-relaxed mb-10 prose dark:prose-invert max-w-none">
                <MathRenderer text={currentQ?.text || ""} />
              </div>

              <div className="flex-1">
                {currentQ?.type === "MCQ" && currentQ.options && (
                  <div className="space-y-3">
                    {currentQ.options.map((opt, idx) => {
                      const isSelected = answers[currentQ.id] === opt;
                      return (
                        <label
                          key={idx}
                          className={`flex items-center gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all duration-200
                        ${
                          isSelected
                            ? "border-blue-600 bg-blue-50 dark:bg-blue-900/10 shadow-sm"
                            : "border-[var(--border)] hover:border-gray-400 dark:hover:border-gray-500 bg-[var(--card)]"
                        }`}
                        >
                          <input
                            type="radio"
                            name={`question-${currentQ.id}`}
                            value={opt}
                            checked={isSelected}
                            onChange={() => handleAnswer(currentQ.id, opt)}
                            className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-600"
                          />
                          <span
                            className={`text-[var(--foreground)] font-medium ${isSelected ? "text-blue-900 dark:text-blue-100" : ""}`}
                          >
                            <span className="inline-block w-6 font-bold text-gray-400">
                              {String.fromCharCode(65 + idx)}.
                            </span>{" "}
                            <MathRenderer text={opt} />
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {currentQ?.type === "ESSAY" && (
                  <textarea
                    value={answers[currentQ.id] || ""}
                    onChange={(e) => handleAnswer(currentQ.id, e.target.value)}
                    placeholder="Ketik jawaban Anda secara detail di sini..."
                    className="w-full h-56 p-5 bg-[var(--background)] border-2 border-[var(--border)] rounded-xl text-[var(--foreground)] focus:ring-0 focus:border-blue-600 outline-none resize-none transition-colors text-lg"
                  ></textarea>
                )}
              </div>

              {/* STREAMING_CHUNK:Action Buttons... */}
              <div className="mt-10 pt-6 border-t border-[var(--border)] flex justify-end">
                {currentIndex >= MAX_QUESTIONS - 1 ? (
                  <button
                    onClick={() => setShowConfirmModal(true)}
                    disabled={loading}
                    className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-md disabled:opacity-50"
                  >
                    <CheckCircle size={20} /> Selesai Ujian
                  </button>
                ) : (
                  <button
                    onClick={handleNextClick}
                    disabled={loading || !answers[currentQ?.id || ""]}
                    className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    Selanjutnya
                    <ChevronRight
                      size={20}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* STREAMING_CHUNK:Custom Confirmation Modal... */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card)] rounded-2xl p-8 max-w-md w-full shadow-2xl border border-[var(--border)] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 mx-auto mb-6">
              <AlertCircle size={32} />
            </div>

            <h3 className="text-2xl font-bold text-center text-[var(--foreground)] mb-3">
              Kumpulkan Ujian?
            </h3>

            <p className="text-center text-[var(--muted-foreground)] mb-8">
              Apakah Anda yakin ingin menyelesaikan ujian ini? Anda tidak dapat
              kembali mengubah jawaban setelah disubmit.
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={isFinishing}
                className="flex-1 px-5 py-3 rounded-xl font-semibold text-[var(--foreground)] bg-[var(--muted)] hover:bg-gray-200 dark:hover:bg-gray-800 transition disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={executeSubmit}
                disabled={isFinishing}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition shadow-md disabled:opacity-50"
              >
                {isFinishing ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  "Ya, Kumpulkan"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
