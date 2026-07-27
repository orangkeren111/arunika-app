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
import { useExamAttempt } from "./SiswaUjianAttemptViewModel";

const MAX_QUESTIONS = 40; // Sync with the default in your viewmodel

export default function ExamAttemptPage({
  params,
}: {
  params: Promise<{ jadwal_id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);

  /* STREAMING_CHUNK:Initializing Viewmodel and UI State... */
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
      <header>
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2 text-[var(--error)] font-bold font-mono text-lg bg-red-500/10 px-4 py-1.5 rounded-lg border border-red-500/20">
            <Timer size={20} />
            {timeLeft}
          </div>
          <button
            onClick={() => setShowConfirmModal(true)}
            className="bg-red-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-red-700 transition flex items-center gap-2 text-sm shadow-sm"
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

      <div className="flex-1 flex overflow-hidden">
        <div className="w-72 bg-[var(--card)] border-r border-[var(--border)] p-5 flex flex-col gap-4 overflow-y-auto shrink-0 shadow-[2px_0_10px_-4px_rgba(0,0,0,0.05)]">
          <h3 className="font-semibold text-sm text-[var(--muted-foreground)] uppercase tracking-wider mb-2">
            Status Perjalanan
          </h3>

          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: MAX_QUESTIONS }).map((_, idx) => {
              const isPast = idx < currentIndex;
              const isActive = idx === currentIndex;
              const isFuture = idx > currentIndex;

              let boxClass =
                "h-10 rounded-md font-medium text-sm flex items-center justify-center transition-all ";

              if (isActive) {
                boxClass +=
                  "bg-blue-600 text-white ring-4 ring-blue-600/20 shadow-md scale-105 z-10";
              } else if (isPast) {
                boxClass += "bg-emerald-500 text-white opacity-80";
              } else if (isFuture) {
                boxClass +=
                  "bg-[var(--muted)] text-[var(--muted-foreground)] opacity-50 cursor-not-allowed";
              }

              return (
                <div key={idx} className={boxClass}>
                  {idx + 1}
                </div>
              );
            })}
          </div>

          <div className="mt-auto pt-6 border-t border-[var(--border)] space-y-3 text-xs text-[var(--muted-foreground)]">
            <p className="leading-relaxed">
              * Ujian ini menggunakan sistem adaptif. Anda tidak dapat kembali
              ke soal sebelumnya.
            </p>
            <div className="flex items-center gap-2 mt-4">
              <span className="w-3 h-3 rounded-full bg-emerald-500 block"></span>{" "}
              Selesai
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-600 block"></span>{" "}
              Saat Ini
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[var(--muted)] block"></span>{" "}
              Terkunci
            </div>
          </div>
        </div>

        {/* STREAMING_CHUNK:Rendering the Active Question Area... */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10 bg-[#FAFAFA] dark:bg-[#121212]">
          {loading && !currentQ ? (
            <div className="flex flex-col items-center justify-center h-full text-[var(--muted-foreground)] gap-4">
              <Loader2 size={40} className="animate-spin text-blue-600" />
              <p className="font-medium animate-pulse">
                Menyiapkan soal adaptif Anda...
              </p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-sm p-8 min-h-[550px] flex flex-col relative overflow-hidden">
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
                {currentQ?.text}
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
                            {opt}
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
