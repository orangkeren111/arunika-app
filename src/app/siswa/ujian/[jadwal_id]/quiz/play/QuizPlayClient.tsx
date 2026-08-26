"use client";

import React, { useState, useEffect } from "react";
import { useQuizPlayViewModel } from "./QuizPlayViewModel";
import { Timer, AlertTriangle, ChevronRight, CheckCircle2, XCircle, ArrowLeft, Gamepad2, Award, Sparkles, RefreshCw } from "lucide-react";
import Link from "next/link";
import { MathRenderer } from "@/src/components/MathRenderer";

function Typewriter({ text }: { text: string }) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let index = 0;
    setDisplayedText("");
    const timer = setInterval(() => {
      setDisplayedText((prev) => prev + text.charAt(index));
      index++;
      if (index >= text.length) {
        clearInterval(timer);
      }
    }, 20); // 20ms per character

    return () => clearInterval(timer);
  }, [text]);

  return <p className="text-gray-800 font-bold leading-relaxed whitespace-pre-wrap text-xs md:text-sm">{displayedText}</p>;
}

export default function QuizPlayClient({
  sessionId,
  jadwalId,
  competencyId,
}: {
  sessionId: number;
  jadwalId: string;
  competencyId?: number | null;
}) {
  const {
    loading,
    session,
    competencies,
    currentComp,
    activeQuestions,
    userAnswers,
    currentQIdx,
    evaluating,
    agentFeedback,
    evaluatedBatch,
    levelCompleted,
    isGameOver,
    gameOutcome,
    timeLeft,
    showIdlePrompt,
    handleSelectAnswer,
    handleNextQuestion,
    handleSubmitBatch,
    handleRetryBatch,
    handleProceedToNextLevel,
    handleKeepPlaying,
  } = useQuizPlayViewModel(sessionId, jadwalId, competencyId);

  // Local mascot expression state based on current interactions
  const [mascotMood, setMascotMood] = useState<"idle" | "happy" | "sad" | "thinking">("idle");

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-[#FDF5E6] text-[#8B5A2B] p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#8B5A2B] mb-4"></div>
        <p className="font-bold text-base text-center">Menyiapkan Capy Room & Kuis Kognitif...</p>
      </div>
    );
  }

  // Render Game Over screen
  if (isGameOver) {
    return (
      <div className="min-h-screen bg-capy-dots flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 text-center space-y-6 shadow-2xl border-4 border-[#D2B48C]">
          {gameOutcome === "WIN" ? (
            <>
              <img
                src="/asset/capy-quiz/capy-excited.png"
                alt="Capy Win"
                className="w-36 h-36 mx-auto object-contain drop-shadow-lg bounce-anim"
              />
              <h1 className="text-2xl sm:text-3xl font-black text-[#6B8E23]">Luar Biasa, Selesai!</h1>
              <div className="p-4 bg-[#A2CDB0]/30 rounded-2xl border-2 border-[#6B8E23]/30 text-xs sm:text-sm text-[#8B5A2B] font-bold">
                🦫 "Selamat, Kawan! Kamu telah menguasai seluruh kompetensi kuis di room ini dengan gemilang! Capy sangat bangga!"
              </div>
            </>
          ) : gameOutcome === "AFK" ? (
            <>
              <img
                src="/asset/capy-quiz/capy-sleepy.png"
                alt="Capy AFK"
                className="w-36 h-36 mx-auto object-contain drop-shadow-lg"
              />
              <h1 className="text-2xl sm:text-3xl font-black text-[#8B5A2B]">Sesi Berakhir (AFK)</h1>
              <div className="p-4 bg-gray-100 rounded-2xl text-xs sm:text-sm text-gray-700 font-semibold">
                🦫 "Aduh, kamu tidak aktif terlalu lama. Sesi dikeluarkan untuk memberikan slot ke murid lain. Coba lagi nanti ya!"
              </div>
            </>
          ) : (
            <>
              <img
                src="/asset/capy-quiz/capy-sleep.png"
                alt="Capy Fail"
                className="w-36 h-36 mx-auto object-contain drop-shadow-lg"
              />
              <h1 className="text-2xl sm:text-3xl font-black text-red-500">Jangan Berkecil Hati!</h1>
              <div className="p-4 bg-red-50 rounded-2xl border-2 border-red-200 text-xs sm:text-sm text-red-700 font-bold">
                🦫 "Kita masih bisa belajar lagi. Pelajari materi bab, lalu kembali ke Capy Lounge saat kamu siap!"
              </div>
            </>
          )}

          <div className="pt-2">
            <Link
              href={`/siswa/ujian/${jadwalId}/quiz/lobby`}
              className="btn-capy w-full flex items-center justify-center gap-2 bg-[#8B5A2B] text-white py-3.5 rounded-2xl text-sm sm:text-base font-black shadow-md"
            >
              <ArrowLeft size={18} />
              Kembali ke Capy Lounge
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = activeQuestions[currentQIdx];
  const allAnswered = activeQuestions.every((q) => !!userAnswers[q.id]);

  // Calculate current score from evaluated batch if available, or answered questions count
  const correctCount = evaluatedBatch ? evaluatedBatch.filter((item: any) => item.isCorrect).length : 0;
  const progressPercentage = activeQuestions.length > 0 ? ((currentQIdx + (evaluatedBatch ? 5 : 0)) / (activeQuestions.length + (evaluatedBatch ? 0 : 0))) * 100 : 0;

  const getMascotImage = () => {
    if (evaluating) return { src: "/asset/capy-quiz/capy-sleepy.png", alt: "Capy Thinking" };
    if (levelCompleted) return { src: "/asset/capy-quiz/capy-excited.png", alt: "Capy Excited" };
    if (agentFeedback) return correctCount >= 4 ? { src: "/asset/capy-quiz/capy-clap.png", alt: "Capy Clap" } : { src: "/asset/capy-quiz/capy-sleepy.png", alt: "Capy Sad" };
    if (mascotMood === "happy") return { src: "/asset/capy-quiz/capy-clap.png", alt: "Capy Happy" };
    if (mascotMood === "sad") return { src: "/asset/capy-quiz/capy-sleepy.png", alt: "Capy Sad" };
    return { src: "/asset/capy-quiz/capy-idle.png", alt: "Capy Idle" };
  };

  const mascotAsset = getMascotImage();

  return (
    <div className="min-h-screen bg-capy-dots text-[#8B5A2B] py-6 px-3 md:px-6 font-sans relative">
      {/* Floating Decor */}
      <div className="fixed top-6 left-4 text-4xl opacity-20 pointer-events-none -z-10 -rotate-12">🌿</div>
      <div className="fixed bottom-8 right-4 text-4xl opacity-20 pointer-events-none -z-10 rotate-12">🍊</div>

      {/* Top Session Bar (Fully Responsive) */}
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6 bg-white px-5 py-4 rounded-3xl border-4 border-[#D2B48C] shadow-md">
        <div className="flex items-center gap-3">
          <Gamepad2 size={26} className="text-[#6B8E23]" />
          <div>
            <span className="text-[10px] sm:text-xs text-[#8B5A2B]/70 font-black uppercase tracking-wider">Level Kompetensi</span>
            <p className="font-black text-sm sm:text-base text-[#8B5A2B]">
              Level {session?.currentLevel || 1} dari {competencies.length || 1}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-4 text-xs sm:text-sm font-bold">
          {/* Wrong Streak Counter */}
          <div className="flex items-center gap-1.5 bg-red-50 px-3 py-1.5 rounded-full border border-red-200">
            <AlertTriangle className="text-red-500" size={16} />
            <span>Kesalahan: <strong className="text-red-600">{session?.wrongStreak || 0}</strong> / 5</span>
          </div>

          {/* Time Left Timer */}
          <div className="flex items-center gap-1.5 bg-[#FDF5E6] px-3.5 py-1.5 rounded-full border border-[#D2B48C]">
            <Timer className="text-[#6B8E23] animate-pulse" size={16} />
            <span>Sisa Waktu: <strong className="text-[#8B5A2B]">{timeLeft}</strong></span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Playboard Area */}
        <div className="lg:col-span-2 space-y-6">

          {/* Active Competency Banner */}
          {currentComp && (
            <div className="bg-white border-4 border-[#D2B48C] p-4 sm:p-5 rounded-3xl shadow-sm">
              <span className="text-[10px] sm:text-xs font-mono font-black bg-[#6B8E23]/20 text-[#6B8E23] px-2.5 py-1 rounded-full border border-[#6B8E23]/30">
                {currentComp.code}
              </span>
              <h2 className="text-base sm:text-lg font-black text-[#8B5A2B] mt-2 leading-snug">{currentComp.name}</h2>
            </div>
          )}

          {/* Progress Tracker Bar */}
          {!evaluatedBatch && activeQuestions.length > 0 && (
            <div className="bg-white p-3 sm:p-4 rounded-3xl border-4 border-[#D2B48C] shadow-sm flex items-center justify-between gap-3">
              <span className="font-black text-xs sm:text-sm text-[#8B5A2B] whitespace-nowrap">
                Soal {currentQIdx + 1} dari {activeQuestions.length}
              </span>
              <div className="flex-1 bg-gray-200 rounded-full h-3 sm:h-3.5 overflow-hidden border border-[#D2B48C]">
                <div
                  className="bg-[#6B8E23] h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(10, ((currentQIdx + 1) / activeQuestions.length) * 100))}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Batch Recap Screen (Triggered when evaluatedBatch & agentFeedback present) */}
          {evaluatedBatch && agentFeedback ? (
            <div className="bg-white border-4 border-[#D2B48C] rounded-3xl p-5 sm:p-7 shadow-lg space-y-5">
              <div className="text-center pb-3 border-b-2 border-gray-100">
                <img
                  src={correctCount >= 4 ? "/asset/capy-quiz/capy-clap.png" : "/asset/capy-quiz/capy-sleepy.png"}
                  alt="Batch Result Capy"
                  className="w-28 h-28 mx-auto object-contain drop-shadow-md mb-2"
                />
                <h3 className="text-xl sm:text-2xl font-black text-[#8B5A2B] mt-1">
                  {correctCount === 5 ? "Skor Sempurna! 🎉" : correctCount >= 3 ? "Kerja Bagus! 👏" : "Perlu Pemanasan Lagi 🍂"}
                </h3>
                <p className="text-xs sm:text-sm font-bold text-gray-600">
                  Hasil Batch: {correctCount} / {evaluatedBatch.length} Soal Benar
                </p>
              </div>

              {/* Question list breakdown */}
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1 divide-y divide-gray-100">
                {evaluatedBatch.map((item: any, idx: number) => (
                  <div key={item.id} className="pt-3 first:pt-0 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-xs sm:text-sm font-bold text-[#8B5A2B]">
                        {idx + 1}. <MathRenderer text={item.text} />
                      </div>
                      {item.isCorrect ? (
                        <span className="flex items-center gap-1 text-[10px] bg-green-100 text-green-800 border border-green-300 px-2 py-0.5 rounded-full font-black shrink-0">
                          <CheckCircle2 size={12} /> Benar
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] bg-red-100 text-red-800 border border-red-300 px-2 py-0.5 rounded-full font-black shrink-0">
                          <XCircle size={12} /> Salah
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium">
                      <div className={`p-2.5 rounded-xl border ${item.isCorrect ? "bg-green-50 border-green-200 text-green-900" : "bg-red-50 border-red-200 text-red-900"}`}>
                        <strong>Jawabanmu:</strong> <MathRenderer text={item.studentAnswer || "(Kosong)"} />
                      </div>
                      <div className="p-2.5 rounded-xl bg-green-50 border border-green-200 text-green-900">
                        <strong>Kunci Jawaban:</strong> <MathRenderer text={item.correctAnswer} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Active Question Card */
            activeQuestions.length > 0 && currentQ && (
              <div className="bg-white border-4 border-[#D2B48C] rounded-3xl p-5 sm:p-7 shadow-lg space-y-6">
                <div className="flex justify-between items-center pb-3 border-b-2 border-gray-100">
                  <span className="text-xs text-gray-500 font-extrabold uppercase tracking-wider">
                    Pertanyaan Batch
                  </span>
                  <span className="text-xs bg-[#A2CDB0]/40 text-[#8B5A2B] px-3 py-1 rounded-full font-black border border-[#6B8E23]/30">
                    Soal {currentQIdx + 1} / {activeQuestions.length}
                  </span>
                </div>

                <div className="text-base sm:text-lg font-bold leading-relaxed text-gray-800">
                  <MathRenderer text={currentQ.text} />
                </div>

                {/* Option Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentQ.options.map((opt, optIdx) => {
                    const selected = userAnswers[currentQ.id] === opt;
                    const letter = String.fromCharCode(65 + optIdx);
                    return (
                      <button
                        key={opt}
                        onClick={() => {
                          handleSelectAnswer(currentQ.id, opt);
                        }}
                        disabled={!!agentFeedback}
                        className={`btn-capy p-3.5 sm:p-4 text-left text-xs sm:text-sm rounded-2xl border-2 transition-all flex items-center gap-3 ${
                          selected
                            ? "bg-[#6B8E23] text-white border-[#556B2F] font-bold shadow-md"
                            : "bg-[#FDF5E6] border-[#D2B48C] text-[#8B5A2B] hover:bg-[#A2CDB0]/30"
                        } disabled:opacity-80`}
                      >
                        <span
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                            selected ? "bg-white text-[#6B8E23]" : "bg-[#D2B48C] text-white"
                          }`}
                        >
                          {letter}
                        </span>
                        <div className="leading-snug">
                          <MathRenderer text={opt} />
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Question Navigation Footer */}
                <div className="flex justify-between items-center pt-3 border-t-2 border-gray-100">
                  <div className="text-xs font-bold text-gray-500">
                    {Object.keys(userAnswers).length} dari {activeQuestions.length} Terjawab
                  </div>

                  {currentQIdx < activeQuestions.length - 1 ? (
                    <button
                      disabled={!userAnswers[currentQ.id]}
                      onClick={handleNextQuestion}
                      className="btn-capy flex items-center gap-1.5 bg-[#8B5A2B] hover:bg-[#724922] text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black disabled:opacity-50"
                    >
                      <span>Berikutnya</span>
                      <ChevronRight size={18} />
                    </button>
                  ) : (
                    !agentFeedback && (
                      <button
                        disabled={!allAnswered || evaluating}
                        onClick={handleSubmitBatch}
                        className="btn-capy bg-[#6B8E23] hover:bg-[#58771c] text-white px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black disabled:opacity-50 shadow-md"
                      >
                        {evaluating ? "Mengevaluasi..." : "Kumpulkan Jawaban"}
                      </button>
                    )
                  )}
                </div>
              </div>
            )
          )}
        </div>

        {/* Mascot & Agent Feedback Sidebar ("Your Buddy") */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border-4 border-[#D2B48C] rounded-3xl p-5 sm:p-6 shadow-md flex flex-col items-center text-center space-y-4">

            {/* Mascot Expression Clean PNG Image */}
            <img
              src={mascotAsset.src}
              alt={mascotAsset.alt}
              className="w-32 h-32 sm:w-40 sm:h-40 object-contain drop-shadow-md bounce-anim"
            />

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-black text-[#8B5A2B]/70 tracking-wider">Teman Belajarmu</span>
              <h4 className="text-sm sm:text-base font-black text-[#8B5A2B]">
                {evaluating ? "Sedang Menilai..." : levelCompleted ? "Hebat, Level Selesai!" : "Capy Buddy"}
              </h4>
            </div>

            {/* Live Score Display Badge */}
            <div className="bg-[#A2CDB0]/40 border-2 border-[#6B8E23]/30 p-3 rounded-2xl w-full text-center shadow-inner">
              <p className="font-extrabold text-[10px] uppercase tracking-wider text-[#8B5A2B]">Terjawab</p>
              <p className="text-2xl sm:text-3xl font-black text-[#8B5A2B]">
                {Object.keys(userAnswers).length} / {activeQuestions.length || 5}
              </p>
            </div>

            {/* Speech Bubble / AI Feedback */}
            <div className="w-full bg-[#FDF5E6] p-4 rounded-2xl text-xs text-left border-2 border-[#D2B48C] relative min-h-[110px]">
              {evaluating ? (
                <p className="text-gray-500 italic font-semibold">Menganalisis pola jawabanmu dan merumuskan feedback kognitif...</p>
              ) : agentFeedback ? (
                <Typewriter text={agentFeedback} />
              ) : (
                <p className="text-[#8B5A2B] font-bold leading-relaxed">
                  "Jawab kelima pertanyaan batch ini dengan teliti ya, Kawan! Aku telah memilihkan soal-soal kognitif khusus untukmu!"
                </p>
              )}
            </div>

            {/* Action Buttons in Sidebar */}
            {levelCompleted && (
              <button
                onClick={handleProceedToNextLevel}
                className="btn-capy w-full flex items-center justify-center gap-1.5 bg-[#6B8E23] hover:bg-[#58771c] text-white py-3 rounded-xl font-black text-xs sm:text-sm shadow"
              >
                <span>Lanjut ke Level Berikutnya</span>
                <Award size={18} />
              </button>
            )}

            {agentFeedback && !levelCompleted && (
              <button
                onClick={handleRetryBatch}
                className="btn-capy w-full flex items-center justify-center gap-1.5 bg-[#8B5A2B] hover:bg-[#724922] text-white py-3 rounded-xl font-black text-xs sm:text-sm shadow"
              >
                <RefreshCw size={16} />
                <span>Coba Batch Baru</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* --- IDLE/AFK WARNING MODAL POPUP --- */}
      {showIdlePrompt && (
        <div className="fixed inset-0 bg-[#8B5A2B]/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center space-y-5 shadow-2xl border-4 border-red-300">
            <img
              src="/asset/capy-quiz/capy-sleepy.png"
              alt="Capy AFK Warning"
              className="w-32 h-32 mx-auto object-contain drop-shadow-md animate-bounce"
            />
            <div className="space-y-2">
              <h3 className="text-xl font-black text-[#8B5A2B]">Apakah Kamu Masih di Sana?</h3>
              <p className="text-xs sm:text-sm text-gray-600 font-semibold leading-relaxed">
                "Hei! Sepertinya kamu sudah lama tidak beraktivitas. Konfirmasi keaktifanmu dalam 30 detik agar sesi belajarmu tidak ditutup!"
              </p>
            </div>

            <button
              onClick={handleKeepPlaying}
              className="btn-capy w-full bg-[#6B8E23] hover:bg-[#58771c] text-white py-3.5 rounded-2xl text-sm font-black shadow-md"
            >
              Ya, Saya Masih Belajar!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
