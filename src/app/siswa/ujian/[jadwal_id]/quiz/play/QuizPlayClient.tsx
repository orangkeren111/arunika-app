"use client";

import React, { useState, useEffect } from "react";
import { useQuizPlayViewModel } from "./QuizPlayViewModel";
import {
  Timer,
  AlertTriangle,
  ChevronRight,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Gamepad2,
  Award,
  Send,
  MessageSquare,
  Sparkles,
  LogOut,
} from "lucide-react";
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
    }, 20);

    return () => clearInterval(timer);
  }, [text]);

  return (
    <p className="text-gray-800 font-bold leading-relaxed whitespace-pre-wrap text-xs md:text-sm">
      {displayedText}
    </p>
  );
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
    sessionState,
    currentComp,
    activeQuestions,
    userAnswers,
    currentQIdx,
    evaluating,
    agentFeedback,
    evaluatedBatch,
    failedTags,
    chatMessages,
    chatSending,
    levelCompleted,
    reviewStep,
    setReviewStep,
    timeLeft,
    showIdlePrompt,
    handleSelectAnswer,
    handleNextQuestion,
    handleSubmitBatch,
    handleSendMessage,
    handleProceedToNextLevel,
    handleKeepPlaying,
    handleContinueAfterReview,
    pendingPostReviewAction,
  } = useQuizPlayViewModel(sessionId, jadwalId, competencyId);

  const [inputMessage, setInputMessage] = useState("");

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-[#FDF5E6] text-[#8B5A2B] p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#8B5A2B] mb-4"></div>
        <p className="font-bold text-base text-center">Menyiapkan Capy Room & Autonomous Router...</p>
      </div>
    );
  }

  // Render WIN Overlay / Screen
  if (sessionState === "WIN") {
    return (
      <div className="min-h-screen bg-capy-dots flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 text-center space-y-6 shadow-2xl border-4 border-[#D2B48C]">
          <img src="/asset/capy-quiz/capy-excited.png" alt="Capy Win" className="w-36 h-36 mx-auto object-contain drop-shadow-lg bounce-anim" />
          <h1 className="text-2xl sm:text-3xl font-black text-[#6B8E23]">Luar Biasa, Selesai!</h1>
          <div className="p-4 bg-[#A2CDB0]/30 rounded-2xl border-2 border-[#6B8E23]/30 text-xs sm:text-sm text-[#8B5A2B] font-bold">
            🦫 {competencyId && currentComp
              ? `"Selamat, Kawan! Kamu telah menguasai kompetensi '${currentComp.name}' dengan gemilang! Kapten Chili sangat bangga!"`
              : `"Selamat, Kawan! Kamu telah menguasai kuis di room ini dengan gemilang! Kapten Chili sangat bangga!"`}
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <Link href={`/siswa/ujian/${jadwalId}/quiz/lobby`} className="btn-capy w-full flex items-center justify-center gap-2 bg-[#8B5A2B] text-white py-3.5 rounded-2xl text-sm sm:text-base font-black shadow-md">
              <ArrowLeft size={18} /> Kembali ke Capy Lounge
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Render FAIL Overlay / Screen
  if (sessionState === "FAIL") {
    return (
      <div className="min-h-screen bg-capy-dots flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 text-center space-y-6 shadow-2xl border-4 border-[#D2B48C]">
          <img src="/asset/capy-quiz/capy-sleep.png" alt="Capy Fail" className="w-36 h-36 mx-auto object-contain drop-shadow-lg" />
          <h1 className="text-2xl sm:text-3xl font-black text-red-500">Jangan Berkecil Hati!</h1>
          <div className="p-4 bg-red-50 rounded-2xl border-2 border-red-200 text-xs sm:text-sm text-red-700 font-bold">
            🦫 "Kita masih bisa belajar lagi. Pelajari materi bab, lalu kembali ke Capy Lounge saat kamu siap!"
          </div>
          <div className="pt-2">
            <Link href={`/siswa/ujian/${jadwalId}/quiz/lobby`} className="btn-capy w-full flex items-center justify-center gap-2 bg-[#8B5A2B] text-white py-3.5 rounded-2xl text-sm sm:text-base font-black shadow-md">
              <ArrowLeft size={18} /> Kembali ke Capy Lounge
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = activeQuestions[currentQIdx];
  const allAnswered = activeQuestions.every((q) => !!(userAnswers[q.id] && userAnswers[q.id].trim()));
  const correctCount = evaluatedBatch ? evaluatedBatch.filter((item: any) => item.isCorrect).length : 0;

  const onSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || chatSending) return;
    handleSendMessage(inputMessage);
    setInputMessage("");
  };

  return (
    <div className="min-h-screen bg-capy-dots text-[#8B5A2B] py-6 px-3 md:px-6 font-sans relative overflow-x-hidden">
      <div className="fixed top-6 left-4 text-4xl opacity-20 pointer-events-none -z-10 -rotate-12">🌿</div>
      <div className="fixed bottom-8 right-4 text-4xl opacity-20 pointer-events-none -z-10 rotate-12">🍊</div>

      {/* Top Session Bar (Added Emergency LogOut for exhausted students) */}
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6 bg-white px-5 py-4 rounded-3xl border-4 border-[#D2B48C] shadow-md">
        <div className="flex items-center gap-3">
          <Link href={`/siswa/ujian/${jadwalId}/quiz/lobby`} className="p-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl transition-colors shadow-sm" title="Keluar dari Sesi Kuis">
            <LogOut size={20} />
          </Link>
          <Gamepad2 size={26} className="text-[#6B8E23]" />
          <div>
            <span className="text-[10px] sm:text-xs text-[#8B5A2B]/70 font-black uppercase tracking-wider">Status Kompetensi</span>
            <p className="font-black text-sm sm:text-base text-[#8B5A2B]">ID: {session?.currentLevel || 'Selesai'}</p>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-4 text-xs sm:text-sm font-bold">
          <div className="flex items-center gap-1.5 bg-[#FDF5E6] px-3.5 py-1.5 rounded-full border border-[#D2B48C]">
            <Timer className="text-[#6B8E23] animate-pulse" size={16} />
            <span>Sisa Waktu: <strong className="text-[#8B5A2B]">{timeLeft}</strong></span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Active Competency Banner (Cleaned up manual resume button) */}
          {currentComp && (
            <div className="bg-white border-4 border-[#D2B48C] p-4 sm:p-5 rounded-3xl shadow-sm flex justify-between items-center">
              <div>
                <span className="text-[10px] sm:text-xs font-mono font-black bg-[#6B8E23]/20 text-[#6B8E23] px-2.5 py-1 rounded-full border border-[#6B8E23]/30">
                  {currentComp.code}
                </span>
                <h2 className="text-base sm:text-lg font-black text-[#8B5A2B] mt-2 leading-snug">{currentComp.name}</h2>
              </div>
            </div>
          )}

          {/* Progress Tracker Bar */}
          {sessionState === "QUIZ" && !evaluatedBatch && activeQuestions.length > 0 && (
            <div className="bg-white p-3 sm:p-4 rounded-3xl border-4 border-[#D2B48C] shadow-sm flex items-center justify-between gap-3">
              <span className="font-black text-xs sm:text-sm text-[#8B5A2B] whitespace-nowrap">Soal {currentQIdx + 1} dari {activeQuestions.length}</span>
              <div className="flex-1 bg-gray-200 rounded-full h-3 sm:h-3.5 overflow-hidden border border-[#D2B48C]">
                <div className="bg-[#6B8E23] h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(100, Math.max(10, ((currentQIdx + 1) / activeQuestions.length) * 100))}%` }}></div>
              </div>
            </div>
          )}

          {/* EVALUATION PHASES: Thought Process -> Results */}
          {sessionState === "QUIZ" && evaluatedBatch && pendingPostReviewAction ? (
            reviewStep === "THOUGHTS" ? (
              <div className="bg-white border-4 border-[#D2B48C] rounded-3xl p-6 sm:p-8 shadow-lg space-y-6 text-center">
                <img src="/asset/capy-quiz/capy-walk.png" alt="Capy Thinking" className="w-32 h-32 mx-auto object-contain drop-shadow-md animate-bounce" />
                <h3 className="text-xl sm:text-2xl font-black text-[#8B5A2B]">Supervisor Sedang Berpikir...</h3>
                <div className="bg-[#FDF5E6] p-5 rounded-2xl border-2 border-[#D2B48C] text-left min-h-[120px] shadow-inner">
                  <Typewriter text={pendingPostReviewAction.thoughtProcess} />
                </div>
                <div className="flex justify-end pt-2">
                  <button onClick={() => setReviewStep("RESULTS")} className="btn-capy bg-[#6B8E23] hover:bg-[#58771c] text-white px-6 py-3 rounded-2xl text-sm font-black shadow-md flex items-center gap-2">
                    <span>Lihat Keputusan</span> <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white border-4 border-[#D2B48C] rounded-3xl p-5 sm:p-7 shadow-lg space-y-5">
                <div className="text-center pb-3 border-b-2 border-gray-100">
                  <img src={correctCount >= 4 ? "/asset/capy-quiz/capy-clap.png" : "/asset/capy-quiz/capy-sleepy.png"} alt="Batch Result Capy" className="w-28 h-28 mx-auto object-contain drop-shadow-md mb-2" />
                  <h3 className="text-xl sm:text-2xl font-black text-[#8B5A2B] mt-1">
                    {correctCount === 5 ? "Skor Sempurna! 🎉" : correctCount >= 3 ? "Kerja Bagus! 👏" : "Perlu Pemanasan Lagi 🍂"}
                  </h3>
                  <p className="text-xs sm:text-sm font-bold text-gray-600">Hasil Batch: {correctCount} / {evaluatedBatch.length} Soal Benar</p>
                </div>

                <div className="space-y-3 max-h-80 overflow-y-auto pr-1 divide-y divide-gray-100">
                  {evaluatedBatch.map((item: any, idx: number) => (
                    <div key={item.id} className="pt-3 first:pt-0 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-xs sm:text-sm font-bold text-[#8B5A2B]">
                          {idx + 1}. <MathRenderer text={item.text} />
                          {item.type === "ESSAY" && (
                            <span className="ml-2 text-[10px] font-bold bg-[#8B5A2B]/10 text-[#8B5A2B] px-2 py-0.5 rounded border border-[#8B5A2B]/20">Esai</span>
                          )}
                        </div>
                        {item.isCorrect ? (
                          <span className="flex items-center gap-1 text-[10px] bg-green-100 text-green-800 border border-green-300 px-2 py-0.5 rounded-full font-black shrink-0"><CheckCircle2 size={12} /> Benar</span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] bg-red-100 text-red-800 border border-red-300 px-2 py-0.5 rounded-full font-black shrink-0"><XCircle size={12} /> Salah</span>
                        )}
                      </div>
                      {item.linkGambarSoal && (
                        <div className="my-1.5 flex justify-center bg-[#FDF5E6] p-2 rounded-xl border border-[#D2B48C]">
                          <img src={item.linkGambarSoal} alt="Gambar Soal" className="max-h-40 rounded-lg object-contain" />
                        </div>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium">
                        <div className={`p-2.5 rounded-xl border ${item.isCorrect ? "bg-green-50 border-green-200 text-green-900" : "bg-red-50 border-red-200 text-red-900"}`}>
                          <strong>Jawabanmu:</strong> <MathRenderer text={item.studentAnswer || "(Kosong)"} />
                        </div>
                        <div className="p-2.5 rounded-xl bg-green-50 border border-green-200 text-green-900">
                          <strong>Kunci / Referensi:</strong> <MathRenderer text={item.correctAnswer || "(Evaluasi Mentor)"} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t-2 border-gray-100 flex justify-end">
                  <button onClick={handleContinueAfterReview} className="btn-capy bg-[#8B5A2B] hover:bg-[#724922] text-white px-6 py-3 rounded-2xl text-sm font-black shadow-md flex items-center gap-2">
                    <span>Lanjutkan Sesuai Arahan Agent</span> <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )
          ) : sessionState === "QUIZ" ? (
            /* Active Question Card */
            activeQuestions.length > 0 && currentQ && (
              <div className="bg-white border-4 border-[#D2B48C] rounded-3xl p-5 sm:p-7 shadow-lg space-y-6">
                <div className="flex justify-between items-center pb-3 border-b-2 border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-extrabold uppercase tracking-wider">Pertanyaan Batch</span>
                    {currentQ.type === "ESSAY" && (
                      <span className="text-[10px] font-black bg-[#8B5A2B]/10 text-[#8B5A2B] px-2 py-0.5 rounded-full border border-[#8B5A2B]/20">Soal Esai</span>
                    )}
                  </div>
                  <span className="text-xs bg-[#A2CDB0]/40 text-[#8B5A2B] px-3 py-1 rounded-full font-black border border-[#6B8E23]/30">Soal {currentQIdx + 1} / {activeQuestions.length}</span>
                </div>

                {currentQ.linkGambarSoal && (
                  <div className="w-full flex justify-center bg-[#FDF5E6] p-3 rounded-2xl border-2 border-[#D2B48C]">
                    <img src={currentQ.linkGambarSoal} alt="Gambar Soal" className="max-h-72 max-w-full rounded-xl object-contain shadow-md" />
                  </div>
                )}

                <div className="text-base sm:text-lg font-bold leading-relaxed text-gray-800">
                  <MathRenderer text={currentQ.text} />
                </div>

                {currentQ.type === "ESSAY" || !currentQ.options || currentQ.options.length === 0 ? (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#8B5A2B] block">Tuliskan jawaban esaimu di bawah ini:</label>
                    <textarea rows={4} value={userAnswers[currentQ.id] || ""} onChange={(e) => handleSelectAnswer(currentQ.id, e.target.value)} disabled={!!agentFeedback} placeholder="Ketik jawaban esai di sini..." className="w-full bg-[#FDF5E6] border-2 border-[#D2B48C] rounded-2xl p-3.5 text-xs sm:text-sm text-[#8B5A2B] font-medium focus:outline-none focus:border-[#6B8E23] disabled:opacity-80" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentQ.options.map((opt, optIdx) => {
                      const selected = userAnswers[currentQ.id] === opt;
                      const letter = String.fromCharCode(65 + optIdx);
                      return (
                        <button key={opt} onClick={() => handleSelectAnswer(currentQ.id, opt)} disabled={!!agentFeedback} className={`btn-capy p-3.5 sm:p-4 text-left text-xs sm:text-sm rounded-2xl border-2 transition-all flex items-center gap-3 ${selected ? "bg-[#6B8E23] text-white border-[#556B2F] font-bold shadow-md" : "bg-[#FDF5E6] border-[#D2B48C] text-[#8B5A2B] hover:bg-[#A2CDB0]/30"} disabled:opacity-80`}>
                          <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${selected ? "bg-white text-[#6B8E23]" : "bg-[#D2B48C] text-white"}`}>{letter}</span>
                          <div className="leading-snug"><MathRenderer text={opt} /></div>
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="flex justify-between items-center pt-3 border-t-2 border-gray-100">
                  <div className="text-xs font-bold text-gray-500">{Object.keys(userAnswers).filter(k => !!userAnswers[Number(k)]?.trim()).length} dari {activeQuestions.length} Terjawab</div>
                  {currentQIdx < activeQuestions.length - 1 ? (
                    <button disabled={!userAnswers[currentQ.id]?.trim()} onClick={handleNextQuestion} className="btn-capy flex items-center gap-1.5 bg-[#8B5A2B] hover:bg-[#724922] text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black disabled:opacity-50">
                      <span>Berikutnya</span> <ChevronRight size={18} />
                    </button>
                  ) : (
                    !agentFeedback && (
                      <button disabled={!allAnswered || evaluating} onClick={handleSubmitBatch} className="btn-capy bg-[#6B8E23] hover:bg-[#58771c] text-white px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black disabled:opacity-50 shadow-md flex items-center gap-1.5">
                        <Sparkles size={16} /> <span>{evaluating ? "Supervisor Router..." : "Kumpulkan Jawaban"}</span>
                      </button>
                    )
                  )}
                </div>
              </div>
            )
          ) : null}

          {/* CHAT REMEDIATION (Manual escape buttons removed) */}
          {sessionState === "CHAT" && (
            <div className="bg-white border-4 border-[#D2B48C] rounded-3xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between pb-3 border-b-2 border-gray-100">
                <div className="flex items-center gap-2">
                  <MessageSquare className="text-[#8B5A2B]" size={22} />
                  <div>
                    <h3 className="font-black text-base text-[#8B5A2B]">1-on-1 Micro Tutoring (Kapten Chili)</h3>
                    <p className="text-[11px] text-gray-500 font-bold">Topik Perlu Remediasi: {failedTags.join(", ") || "Konsep Dasar"}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto pr-1 p-2 bg-[#FDF5E6]/60 rounded-2xl border border-[#D2B48C]">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex items-start gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "tutor" && (
                      <img src="/asset/capy-quiz/capy-idle.png" alt="Kapten Chili" className="w-8 h-8 object-contain shrink-0 drop-shadow" />
                    )}
                    <div className={`p-3 rounded-2xl text-xs sm:text-sm font-semibold max-w-[80%] leading-relaxed ${msg.role === "user" ? "bg-[#6B8E23] text-white rounded-tr-none shadow" : "bg-white text-gray-800 border border-[#D2B48C] rounded-tl-none shadow-sm"}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {chatSending && (
                  <div className="flex items-center gap-2 text-xs italic text-gray-500 font-semibold p-2">
                    <div className="animate-pulse">Kapten Chili sedang mengetik...</div>
                  </div>
                )}
              </div>

              <form onSubmit={onSendChat} className="flex gap-2">
                <input type="text" value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} placeholder="Tanyakan atau jelaskan pemahamanmu..." disabled={chatSending} className="flex-1 bg-[#FDF5E6] border-2 border-[#D2B48C] rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-[#8B5A2B] font-bold focus:outline-none focus:border-[#6B8E23]" />
                <button type="submit" disabled={chatSending || !inputMessage.trim()} className="btn-capy bg-[#8B5A2B] hover:bg-[#724922] text-white px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black disabled:opacity-50 shadow flex items-center justify-center">
                  <Send size={16} />
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Mascot & Buddy Sidebar (Cleaned up manual escape buttons) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border-4 border-[#D2B48C] rounded-3xl p-5 sm:p-6 shadow-md flex flex-col items-center text-center space-y-4">
            <img src={evaluating ? "/asset/capy-quiz/capy-sleepy.png" : sessionState === "CHAT" ? "/asset/capy-quiz/capy-excited.png" : agentFeedback && correctCount >= 4 ? "/asset/capy-quiz/capy-clap.png" : "/asset/capy-quiz/capy-idle.png"} alt="Capy Buddy" className="w-32 h-32 sm:w-40 sm:h-40 object-contain drop-shadow-md bounce-anim" />
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-black text-[#8B5A2B]/70 tracking-wider">Autonomous Mentor</span>
              <h4 className="text-sm sm:text-base font-black text-[#8B5A2B]">
                {evaluating ? "Router Machine..." : sessionState === "CHAT" ? "Sesi Tutoring Chat" : "Capy Supervisor"}
              </h4>
            </div>

            {sessionState === "QUIZ" && !evaluatedBatch && (
              <div className="bg-[#A2CDB0]/40 border-2 border-[#6B8E23]/30 p-3 rounded-2xl w-full text-center shadow-inner">
                <p className="font-extrabold text-[10px] uppercase tracking-wider text-[#8B5A2B]">Progress Batch</p>
                <p className="text-2xl sm:text-3xl font-black text-[#8B5A2B]">{Object.keys(userAnswers).length} / {activeQuestions.length || 5}</p>
              </div>
            )}

            <div className="w-full bg-[#FDF5E6] p-4 rounded-2xl text-xs text-left border-2 border-[#D2B48C] relative min-h-[110px]">
              {evaluating ? (
                <p className="text-gray-500 italic font-semibold">Mengkompilasi vectors evaluasi. Menunggu respon router...</p>
              ) : sessionState === "CHAT" ? (
                <p className="text-[#8B5A2B] font-bold">"Buktikan padaku bahwa kamu paham! Sesi chat ini hanya akan selesai ketika kamu benar-benar mengerti!"</p>
              ) : (
                <p className="text-[#8B5A2B] font-bold leading-relaxed">"Jawab batch ini dengan teliti ya, Kawan! Supervisor Router akan menentukan alur belajarmu!"</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {showIdlePrompt && (
        <div className="fixed inset-0 bg-[#8B5A2B]/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center space-y-5 shadow-2xl border-4 border-red-300">
            <h3 className="text-xl font-black text-[#8B5A2B]">Masih di Sana?</h3>
            <button onClick={handleKeepPlaying} className="btn-capy w-full bg-[#6B8E23] text-white py-3.5 rounded-2xl shadow-md font-black">Ya, Saya Masih Belajar!</button>
          </div>
        </div>
      )}
    </div>
  );
}
