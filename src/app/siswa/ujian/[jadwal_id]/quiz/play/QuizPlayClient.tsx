"use client";

import React, { useState, useEffect } from "react";
import { useQuizPlayViewModel } from "./QuizPlayViewModel";
import { Timer, AlertTriangle, ChevronRight, CheckCircle2, XCircle, ArrowLeft, Gamepad2, Award } from "lucide-react";
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

  return <p className="text-[#39434D]/90 font-medium leading-relaxed whitespace-pre-wrap">{displayedText}</p>;
}

export default function QuizPlayClient({
  sessionId,
  jadwalId,
}: {
  sessionId: number;
  jadwalId: string;
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
  } = useQuizPlayViewModel(sessionId, jadwalId);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-[#FAF8F3] text-[#39434D]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7FA88F] mb-4"></div>
        <p className="font-semibold text-sm">Menyiapkan tantangan kuis...</p>
      </div>
    );
  }

  // Render Game Over screen
  if (isGameOver) {
    return (
      <div className="min-h-screen bg-[#FAF8F3] flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-lg w-full p-8 text-center space-y-6 shadow-xl border border-[#7FA88F]/20">
          {gameOutcome === "WIN" ? (
            <>
              <div className="text-8xl select-none animate-bounce">🏆</div>
              <h1 className="text-3xl font-black text-[#39434D]">Kerja Bagus! Lulus!</h1>
              <div className="p-4 bg-[#7FA88F]/10 rounded-2xl border border-[#7FA88F]/20 text-sm text-[#39434D]/80">
                🦅 "Luar biasa, Kawan! Kamu telah menguasai seluruh kompetensi kuis di room ini dengan gemilang! Aku bangga padamu!"
              </div>
            </>
          ) : gameOutcome === "AFK" ? (
            <>
              <div className="text-8xl select-none">💤</div>
              <h1 className="text-3xl font-black text-[#39434D]">Sesi Berakhir (AFK)</h1>
              <div className="p-4 bg-gray-100 rounded-2xl text-sm text-gray-600">
                🦅 "Aduh, kamu tidak aktif terlalu lama. Sesi dikeluarkan untuk memberikan slot ke murid lain. Coba lagi nanti ya!"
              </div>
            </>
          ) : (
            <>
              <div className="text-8xl select-none">😢</div>
              <h1 className="text-3xl font-black text-red-500">Oh No, Kamu Gagal...</h1>
              <div className="p-4 bg-red-50 rounded-2xl border border-red-100 text-sm text-red-700">
                🦅 "Jangan berkecil hati, Kawan! Kita masih bisa belajar lagi. Pelajari materi bab, lalu kembali ke room ini saat kamu siap!"
              </div>
            </>
          )}

          <div className="pt-4">
            <Link
              href={`/siswa/ujian/${jadwalId}/lobby`}
              className="w-full flex items-center justify-center gap-2 bg-[#39434D] text-white py-3 rounded-2xl hover:opacity-95 transition text-base font-bold shadow-md"
            >
              <ArrowLeft size={18} />
              Kembali ke Lobby Ujian
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = activeQuestions[currentQIdx];
  const allAnswered = activeQuestions.every((q) => !!userAnswers[q.id]);

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#39434D] py-8 px-4 font-sans relative">
      
      {/* Top Session Stats Bar */}
      <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-4 mb-6 bg-white px-6 py-4 rounded-3xl border border-[#7FA88F]/20 shadow-sm">
        <div className="flex items-center gap-3">
          <Gamepad2 size={24} className="text-[#7FA88F]" />
          <div>
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Level Kompetensi</span>
            <p className="font-extrabold text-[#39434D]">
              {session?.currentLevel} dari {competencies.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Wrong streak indicator */}
          <div className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="text-red-500" size={18} />
            <span>Kesalahan: <strong className="text-red-500">{session?.wrongStreak}</strong> / 5</span>
          </div>

          {/* Time Left */}
          <div className="flex items-center gap-2 text-sm font-semibold bg-[#FAF8F3] px-3.5 py-1.5 rounded-full border border-gray-100">
            <Timer className="text-[#7FA88F] animate-pulse" size={18} />
            <span>Sisa Waktu: <strong className="text-[#39434D]">{timeLeft}</strong></span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Playboard Area */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active competency banner */}
          {currentComp && (
            <div className="bg-[#7FA88F]/10 border border-[#7FA88F]/20 p-5 rounded-3xl">
              <span className="text-xs font-mono font-bold bg-[#7FA88F]/20 text-[#7FA88F] px-2.5 py-0.5 rounded-full">
                {currentComp.code}
              </span>
              <h2 className="text-lg font-extrabold mt-2 leading-snug">{currentComp.name}</h2>
            </div>
          )}

          {/* Question breakdown review after evaluation */}
          {evaluatedBatch && agentFeedback && (
            <div className="bg-white border border-[#7FA88F]/20 rounded-3xl p-6 md:p-8 shadow-sm space-y-4">
              <h3 className="text-base font-extrabold text-[#39434D]">Evaluasi Detail 5 Soal Batch</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2 divide-y divide-gray-100">
                {evaluatedBatch.map((item: any, idx: number) => (
                  <div key={item.id} className="pt-3 first:pt-0 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-xs font-bold text-[#39434D]">
                        {idx + 1}. <MathRenderer text={item.text} />
                      </div>
                      {item.isCorrect ? (
                        <span className="flex items-center gap-1 text-[10px] bg-green-500/10 text-green-700 px-2 py-0.5 rounded-full font-bold shrink-0">
                          <CheckCircle2 size={12} /> Benar
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] bg-red-500/10 text-red-600 px-2 py-0.5 rounded-full font-bold shrink-0">
                          <XCircle size={12} /> Salah
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      <div className={`p-2 rounded-xl ${item.isCorrect ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
                        <strong>Jawabanmu:</strong> <MathRenderer text={item.studentAnswer || "(Kosong)"} />
                      </div>
                      <div className="p-2 rounded-xl bg-green-50 text-green-800">
                        <strong>Kunci Jawaban:</strong> <MathRenderer text={item.correctAnswer} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Question card */}
          {activeQuestions.length > 0 && currentQ && !agentFeedback && (
            <div className="bg-white border border-[#7FA88F]/20 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                  Pertanyaan Batch
                </span>
                <span className="text-xs bg-[#7FA88F]/10 text-[#7FA88F] px-2.5 py-1 rounded-full font-bold">
                  Soal {currentQIdx + 1} / {activeQuestions.length}
                </span>
              </div>

              <div className="text-base md:text-lg font-bold leading-relaxed">
                <MathRenderer text={currentQ.text} />
              </div>

              <div className="grid grid-cols-1 gap-3">
                {currentQ.options.map((opt) => {
                  const selected = userAnswers[currentQ.id] === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => handleSelectAnswer(currentQ.id, opt)}
                      disabled={!!agentFeedback}
                      className={`p-4 text-left text-sm rounded-2xl border transition-all ${
                        selected
                          ? "bg-[#7FA88F] text-white border-[#7FA88F] shadow-md font-medium"
                          : "bg-[#FAF8F3] border-gray-200 hover:border-[#7FA88F]/50"
                      } disabled:opacity-80`}
                    >
                      <MathRenderer text={opt} />
                    </button>
                  );
                })}
              </div>

              {/* Navigation controls */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <div className="text-xs text-gray-400">
                  {Object.keys(userAnswers).length} dari {activeQuestions.length} Terjawab
                </div>
                
                {currentQIdx < activeQuestions.length - 1 ? (
                  <button
                    disabled={!userAnswers[currentQ.id]}
                    onClick={handleNextQuestion}
                    className="flex items-center gap-1 bg-[#39434D] text-white px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition"
                  >
                    <span>Berikutnya</span>
                    <ChevronRight size={16} />
                  </button>
                ) : (
                  !agentFeedback && (
                    <button
                      disabled={!allAnswered || evaluating}
                      onClick={handleSubmitBatch}
                      className="bg-[#7FA88F] text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:opacity-95 disabled:opacity-50 transition shadow-sm"
                    >
                      {evaluating ? "Mengevaluasi..." : "Kumpulkan Jawaban"}
                    </button>
                  )
                )}
              </div>
            </div>
          )}
        </div>

        {/* Mascot Mascot & Agent Feedback Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-[#7FA88F]/20 rounded-3xl p-6 shadow-sm flex flex-col items-center text-center space-y-4">
            
            {/* Mascot expression */}
            <div className="text-7xl select-none animate-bounce">
              {evaluating ? "🤔" : levelCompleted ? "🎉" : agentFeedback ? "💡" : "🦅"}
            </div>
            
            <div className="space-y-1">
              <span className="text-xs uppercase font-extrabold text-gray-400 tracking-wider">Maskot Elang</span>
              <h4 className="text-base font-black text-[#39434D]">
                {evaluating ? "Sedang Menilai..." : levelCompleted ? "Hebat, Level Selesai!" : "Ayo Semangat!"}
              </h4>
            </div>

            {/* Speach bubble */}
            <div className="w-full bg-[#FAF8F3] p-4 rounded-2xl text-xs md:text-sm text-left border border-gray-100 relative min-h-[120px]">
              {evaluating ? (
                <p className="text-gray-400 italic">Menganalisis pola jawabanmu dan merumuskan feedback kognitif...</p>
              ) : agentFeedback ? (
                <Typewriter text={agentFeedback} />
              ) : (
                <p className="text-[#39434D]/80">
                  "Jawab kelima pertanyaan batch ini dengan teliti ya, Kawan! Aku telah memilihkan soal-soal kognitif khusus untuk menilai penguasaan kompetensimu."
                </p>
              )}
            </div>

            {/* Proceed buttons */}
            {levelCompleted && (
              <button
                onClick={handleProceedToNextLevel}
                className="w-full flex items-center justify-center gap-1.5 bg-[#7FA88F] text-white py-3 rounded-xl font-bold text-sm hover:opacity-95 transition shadow-sm"
              >
                <span>Lanjut ke Level Berikutnya</span>
                <Award size={18} />
              </button>
            )}

            {agentFeedback && !levelCompleted && (
              <button
                onClick={handleRetryBatch} // Retry same level with new batch of different questions
                className="w-full flex items-center justify-center gap-1.5 bg-[#39434D] text-white py-3 rounded-xl font-bold text-sm hover:opacity-95 transition shadow-sm"
              >
                <span>Coba Batch Baru</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* --- IDLE/AFK WARNING MODAL POPUP --- */}
      {showIdlePrompt && (
        <div className="fixed inset-0 bg-[#39434D]/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center space-y-5 shadow-2xl border border-red-200">
            <div className="text-6xl select-none">😴</div>
            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-[#39434D]">Apakah Kamu Masih di Sana?</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                "Hei! Sepertinya kamu sudah lama tidak beraktivitas. Konfirmasi keaktifanmu dalam 30 detik agar sesi belajarmu bersama Elang tidak ditutup!"
              </p>
            </div>

            <button
              onClick={handleKeepPlaying}
              className="w-full bg-[#7FA88F] text-white py-3 rounded-xl hover:opacity-95 transition text-sm font-bold shadow-sm"
            >
              Ya, Saya Masih Belajar!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
