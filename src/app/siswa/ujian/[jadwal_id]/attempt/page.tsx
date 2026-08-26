"use client";

import React, { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Timer,
  CheckCircle,
  ChevronRight,
  Loader2,
  AlertCircle,
  Sparkles,
  ShieldAlert,
} from "lucide-react";
import { MathRenderer } from "@/src/components/MathRenderer";
import { useExamAttempt } from "./SiswaUjianAttemptViewModel";

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
    totalQuestions,
    answers,
    handleAnswer,
    nextQuestion,
    handleSubmitExam,
    timeLeft,
    progress,
    loading,
    isFinished,
    warnings,
  } = useExamAttempt(resolvedParams.jadwal_id);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  useEffect(() => {
    if (isFinished) {
      router.push("/siswa/history");
    }
  }, [isFinished, router]);

  const executeSubmit = async () => {
    setIsFinishing(true);
    await handleSubmitExam();
    setShowConfirmModal(false);
  };

  const handleNextClick = async () => {
    await nextQuestion();
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col font-sans relative overflow-hidden select-none">
      {/* Subtle Background Glow Spheres */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none -z-0"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none -z-0"></div>

      {/* Floating Liquid Glass Header */}
      <header className="px-4 py-4 md:px-8 md:py-5 relative z-10">
        <div className="max-w-5xl mx-auto backdrop-blur-xl bg-white/10 border border-white/15 rounded-2xl p-4 md:p-5 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-rose-300 font-extrabold font-mono text-base md:text-lg bg-rose-500/20 px-4 py-2 rounded-xl border border-rose-500/30 backdrop-blur-md shadow-inner">
              <Timer size={20} className="animate-pulse text-rose-400" />
              <span>{timeLeft}</span>
            </div>
            {warnings > 0 && (
              <div className="flex items-center gap-1.5 text-xs md:text-sm font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3.5 py-2 rounded-xl backdrop-blur-md">
                <ShieldAlert size={16} />
                <span>Pelanggaran Tab: {warnings}/3</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => setShowConfirmModal(true)}
              className="w-full sm:w-auto bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all duration-300 shadow-[0_0_15px_rgba(225,29,72,0.4)] flex items-center justify-center gap-2 text-sm border border-rose-400/30 cursor-pointer active:scale-95"
            >
              <CheckCircle size={18} /> Selesai & Kumpulkan
            </button>
          </div>
        </div>
      </header>

      {/* Sleek Liquid Gradient Progress Bar */}
      <div className="max-w-5xl mx-auto w-full px-4 md:px-8 mb-4 relative z-10">
        <div className="h-2.5 bg-slate-800/80 rounded-full overflow-hidden border border-white/10 p-0.5 backdrop-blur-md">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 rounded-full transition-all duration-500 ease-out shadow-[0_0_12px_rgba(59,130,246,0.6)]"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col px-4 pb-8 md:px-8 max-w-5xl mx-auto w-full relative z-10 overflow-y-auto">
        {loading && !currentQ ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
            <Loader2 size={48} className="animate-spin text-blue-400" />
            <p className="font-semibold text-base animate-pulse tracking-wide">
              Menyiapkan Soal Adaptif Anda...
            </p>
          </div>
        ) : (
          /* Liquid Glass Question Box */
          <div className="w-full backdrop-blur-2xl bg-white/10 border border-white/20 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] p-6 md:p-10 flex flex-col relative overflow-hidden transition-all duration-300 my-auto">
            {/* Loading Overlay between turns */}
            {loading && currentQ && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md z-30 flex flex-col items-center justify-center gap-3">
                <Loader2 size={36} className="animate-spin text-blue-400" />
                <span className="text-sm font-bold text-slate-200 tracking-wide">
                  Menyimpan & Menghitung ELO...
                </span>
              </div>
            )}

            {/* Question Header */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/15">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/40 text-blue-300 flex items-center justify-center font-black text-sm shadow-inner">
                  {currentIndex + 1}
                </span>
                <h2 className="text-xl md:text-2xl font-black text-slate-100 tracking-tight">
                  Soal No. {currentIndex + 1}
                </h2>
              </div>
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-xs px-3.5 py-1.5 rounded-xl font-black tracking-wider uppercase backdrop-blur-md">
                {currentQ?.type || "MCQ"}
              </span>
            </div>

            {/* Question Text */}
            <div className="text-base md:text-lg text-slate-100 leading-relaxed mb-8 prose prose-invert max-w-none font-medium bg-slate-900/30 p-5 rounded-2xl border border-white/10 backdrop-blur-md">
              <MathRenderer text={currentQ?.text || ""} />
            </div>

            {/* Answer Options */}
            <div className="flex-1 space-y-3.5">
              {currentQ?.type === "MCQ" && currentQ.options && (
                <div className="space-y-3.5">
                  {currentQ.options.map((opt, idx) => {
                    const isSelected = answers[currentQ.id] === opt;
                    const optionLetter = String.fromCharCode(65 + idx);

                    return (
                      <label
                        key={idx}
                        onClick={() => handleAnswer(currentQ.id, opt)}
                        className={`flex items-center gap-4 p-4 md:p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 backdrop-blur-md relative overflow-hidden ${
                          isSelected
                            ? "bg-gradient-to-r from-blue-600/30 to-indigo-600/30 border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)] text-white"
                            : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-slate-400/40 text-slate-200"
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs transition-all duration-300 shrink-0 ${
                            isSelected
                              ? "bg-blue-500 text-white shadow-md"
                              : "bg-slate-800/80 text-slate-400 border border-white/10"
                          }`}
                        >
                          {optionLetter}
                        </div>
                        <div className="flex-1 text-sm md:text-base font-semibold leading-snug">
                          <MathRenderer text={opt} />
                        </div>
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
                  className="w-full h-56 p-5 bg-slate-900/40 border-2 border-white/15 focus:border-blue-400 rounded-2xl text-slate-100 placeholder-slate-500 focus:outline-none resize-none transition-colors text-base md:text-lg backdrop-blur-md shadow-inner"
                ></textarea>
              )}
            </div>

            {/* Action Footer */}
            <div className="mt-8 pt-6 border-t border-white/15 flex justify-end">
              {currentIndex >= totalQuestions - 1 ? (
                <button
                  onClick={() => setShowConfirmModal(true)}
                  disabled={loading}
                  className="flex items-center gap-2 px-8 py-3.5 rounded-2xl font-black text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.4)] border border-emerald-400/30 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle size={20} /> Selesai Ujian
                </button>
              ) : (
                <button
                  onClick={handleNextClick}
                  disabled={loading || !answers[currentQ?.id || ""]}
                  className="flex items-center gap-2 px-8 py-3.5 rounded-2xl font-black text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all duration-300 shadow-[0_0_20px_rgba(59,130,246,0.4)] border border-blue-400/30 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed group active:scale-95"
                >
                  <span>Selanjutnya</span>
                  <ChevronRight
                    size={20}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Confirmation Modal overlay (Liquid Glass) */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-slate-900/90 border border-white/20 rounded-3xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(0,0,0,0.7)] text-center space-y-6 relative backdrop-blur-2xl">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto shadow-inner">
              <AlertCircle size={32} />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-100">Kumpulkan Ujian?</h3>
              <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
                Apakah Anda yakin ingin menyelesaikan ujian ini? Anda tidak dapat kembali mengubah jawaban setelah disubmit.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={isFinishing}
                className="flex-1 px-5 py-3 rounded-2xl font-bold text-slate-300 bg-white/10 hover:bg-white/20 border border-white/10 transition backdrop-blur-md cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={executeSubmit}
                disabled={isFinishing}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-extrabold text-white bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 transition shadow-[0_0_20px_rgba(225,29,72,0.4)] border border-rose-400/30 cursor-pointer disabled:opacity-50"
              >
                {isFinishing ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  "Ya, Kumpulkan"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
