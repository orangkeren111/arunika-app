"use client";

import React, { useState } from "react";
import { useQuizLobbyViewModel } from "./QuizLobbyViewModel";
import { HelpCircle, ChevronRight, Play, RefreshCw, Trophy, Users, ShieldAlert, X, Sparkles } from "lucide-react";

export default function QuizLobbyClient({
  jadwalId,
  ujianId,
  siswaId,
}: {
  jadwalId: string;
  ujianId: number;
  siswaId: number;
}) {
  const {
    loading,
    activeSessions,
    sessionId,
    sessionStatus,
    competencies,
    lobbyQuestions,
    currentQIndex,
    userAnswers,
    showResults,
    slotClaimed,
    checkingAvailability,
    handleSelectAnswer,
    handleNextQuestion,
    handleResetLobbyGame,
    handleCheckRoomAvailability,
    handleCloseClaimModal,
  } = useQuizLobbyViewModel(jadwalId, ujianId, siswaId);

  // Local Mascot interactive state
  const [mascotAction, setMascotAction] = useState<"idle" | "sleep" | "dance" | "eat">("idle");
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [quickFeedback, setQuickFeedback] = useState<string | null>(null);

  const triggerMascotAction = (action: "idle" | "sleep" | "dance" | "eat") => {
    setMascotAction(action);
    setTimeout(() => {
      setMascotAction("idle");
    }, 3500);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-[#FDF5E6] text-[#8B5A2B] p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#8B5A2B] mb-4"></div>
        <p className="font-bold text-base text-center">Menghubungkan ke CapyQuiz Lounge...</p>
      </div>
    );
  }

  const currentQ = lobbyQuestions[currentQIndex];

  const getMascotDisplay = () => {
    switch (mascotAction) {
      case "sleep":
        return { src: "/asset/capy-quiz/capy-sleep.png", label: "Capy Ketiduran... Zzz", bg: "bg-blue-100 border-blue-400" };
      case "dance":
        return { src: "/asset/capy-quiz/capy-dance.png", label: "Capy Joget Santai!", bg: "bg-amber-100 border-amber-400" };
      case "eat":
        return { src: "/asset/capy-quiz/capy-eat.png", label: "Capy Nyam-nyam Semangka!", bg: "bg-green-100 border-green-400" };
      default:
        return { src: "/asset/capy-quiz/capy-idle.png", label: "Capy Chill Mode", bg: "bg-[#A2CDB0] border-[#6B8E23]" };
    }
  };

  const mascot = getMascotDisplay();

  return (
    <div className="min-h-screen bg-capy-dots text-[#8B5A2B] py-6 px-3 md:px-6 font-sans relative overflow-x-hidden">
      {/* Floating Decor Icons (Responsive background) */}
      <div className="fixed top-6 left-4 text-4xl md:text-6xl opacity-20 pointer-events-none -z-10 -rotate-12">🌿</div>
      <div className="fixed bottom-12 right-4 text-4xl md:text-6xl opacity-20 pointer-events-none -z-10 rotate-12">🍉</div>
      <div className="fixed top-1/3 right-6 text-3xl md:text-4xl opacity-20 pointer-events-none -z-10">🍊</div>
      <div className="fixed bottom-1/4 left-6 text-4xl md:text-5xl opacity-20 pointer-events-none -z-10">🛁</div>

      <div className="max-w-4xl mx-auto space-y-6 relative z-10">

        {/* Header Container */}
        <header className="bg-white rounded-3xl p-5 md:p-6 border-4 border-[#D2B48C] shadow-xl text-center relative overflow-hidden">
          <div className="bg-[#A2CDB0] -mx-6 -mt-6 p-4 border-b-4 border-[#D2B48C] mb-4">
            <h1 className="text-2xl md:text-4xl font-black text-[#8B5A2B] tracking-wider drop-shadow-sm">
              CapyQuiz Chill Zone
            </h1>
            <p className="text-xs md:text-sm font-bold text-[#8B5A2B]/90 mt-1">
              Bersantai, Asah Otak, dan Bersiap Ujian Bersama Capybara!
            </p>
          </div>
          <p className="text-xs md:text-sm text-gray-700 leading-relaxed max-w-xl mx-auto">
            "Nilai ujianmu telah disintesis. Mari pemanasan dan persiapkan kompetensimu di lounge santai ini!"
          </p>
        </header>

        {/* Interactive Mascot Lounge Area */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border-4 border-[#D2B48C] shadow-lg flex flex-col items-center justify-center relative min-h-[300px]">
          <div className="text-center mb-4">
            <span className="inline-block bg-[#A2CDB0]/40 text-[#8B5A2B] text-xs px-3 py-1 rounded-full font-black border border-[#6B8E23]/30">
              Lounge Maskot Capy
            </span>
            <h2 className="text-lg md:text-xl font-bold mt-1 text-[#8B5A2B]">Sapa Maskot Capy Sebelum Beraksi!</h2>
          </div>

          {/* Mascot Stage */}
          <div className="relative w-full max-w-md flex justify-center items-end h-56 mb-6">
            {/* Interactive Action Buttons (Stacked on mobile, side menu on desktop) */}
            <div className="absolute left-0 sm:left-2 top-1/2 -translate-y-1/2 flex flex-col gap-2 sm:gap-3 z-20">
              <button
                onClick={() => triggerMascotAction("sleep")}
                className="btn-capy bg-[#D2B48C] hover:bg-[#c4a47c] text-white font-bold py-1.5 px-3 sm:py-2 sm:px-4 rounded-full text-xs sm:text-sm flex items-center gap-1.5 shadow"
              >
                <span>💤</span> Sleep
              </button>
              <button
                onClick={() => triggerMascotAction("dance")}
                className="btn-capy bg-[#D2B48C] hover:bg-[#c4a47c] text-white font-bold py-1.5 px-3 sm:py-2 sm:px-4 rounded-full text-xs sm:text-sm flex items-center gap-1.5 shadow"
              >
                <span>💃</span> Dance
              </button>
              <button
                onClick={() => triggerMascotAction("eat")}
                className="btn-capy bg-[#D2B48C] hover:bg-[#c4a47c] text-white font-bold py-1.5 px-3 sm:py-2 sm:px-4 rounded-full text-xs sm:text-sm flex items-center gap-1.5 shadow"
              >
                <span>🍉</span> Eat
              </button>
            </div>

            {/* Main Capybara Mascot Avatar (Clean PNG Image) */}
            <div className="relative z-10 flex flex-col items-center bounce-anim">
              <img
                src={mascot.src}
                alt="Capybara Mascot"
                className="w-40 h-40 sm:w-52 sm:h-52 object-contain drop-shadow-md transition-all duration-300"
              />
            </div>

            {/* Grass Carpet Floor */}
            <div className="absolute bottom-[-10px] w-3/4 sm:w-2/3 h-14 carpet -z-0"></div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md mt-2">
            <button
              onClick={handleCheckRoomAvailability}
              disabled={checkingAvailability}
              className="btn-capy flex-1 bg-[#6B8E23] hover:bg-[#58771c] text-white text-base sm:text-lg font-black py-3.5 px-5 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <RefreshCw size={20} className={checkingAvailability ? "animate-spin" : ""} />
              <span>{checkingAvailability ? "Memeriksa Room..." : "Cek Ready (Play)"}</span>
            </button>
            <button
              onClick={() => setShowQuickModal(true)}
              className="btn-capy bg-[#8B5A2B] hover:bg-[#724922] text-white font-bold py-3.5 px-4 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-1.5"
            >
              <Sparkles size={18} />
              <span>Pemanasan Modal</span>
            </button>
          </div>
        </div>

        {/* Rules & Room Status Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Rules Card */}
          <div className="md:col-span-2 bg-[#FDF5E6] border-4 border-[#D2B48C] rounded-3xl p-5 md:p-6 space-y-3 shadow-md">
            <h3 className="text-base md:text-lg font-black flex items-center gap-2 text-[#8B5A2B]">
              <ShieldAlert className="text-[#6B8E23]" size={22} />
              Aturan Main Lounge CapyQuiz
            </h3>
            <ul className="text-xs md:text-sm space-y-2 text-gray-800 font-medium">
              <li className="flex items-start gap-2">
                <span className="bg-[#6B8E23] text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-md mt-0.5">1</span>
                <span>Maksimal durasi per sesi room kuis kognitif adalah 15 menit.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-[#6B8E23] text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-md mt-0.5">2</span>
                <span>Toleransi kesalahan beruntun (wrong streak) maksimal 5 kali.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-[#6B8E23] text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-md mt-0.5">3</span>
                <span>Tunjukkan pemahaman kognitifmu hingga tuntas di setiap batch!</span>
              </li>
            </ul>
          </div>

          {/* Queue Widget */}
          <div className="bg-white border-4 border-[#D2B48C] rounded-3xl p-5 md:p-6 flex flex-col justify-between shadow-md">
            <div className="space-y-2">
              <span className="text-xs uppercase font-black text-[#8B5A2B]/70 tracking-wider">Kapasitas Room</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl md:text-4xl font-black text-[#8B5A2B]">{activeSessions}</span>
                <span className="text-gray-500 font-bold text-sm">/ 20 Aktif</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Slot room dibatasi untuk pengalaman terbaik. Kamu akan langsung diberi ruang saat slot tersedia!
              </p>
            </div>

            <div className="pt-3 border-t-2 border-[#D2B48C]/30 mt-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#6B8E23]">
                <Users size={16} className="animate-pulse" />
                <span>Status: {sessionStatus === "PLAYING" ? "Siap Masuk Room!" : "Menunggu giliran..."}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Lobby Mini-Game (Warm-up Inline Card) */}
        <div className="bg-white border-4 border-[#D2B48C] rounded-3xl p-5 md:p-8 shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 border-b-2 border-gray-100">
            <div>
              <h3 className="text-lg font-black text-[#8B5A2B] flex items-center gap-2">
                <HelpCircle size={20} className="text-[#6B8E23]" />
                Kuis Pemanasan (Warm-up Inline)
              </h3>
              <p className="text-xs text-gray-500 font-medium">Asah fokusmu sambil menunggu slot room terbuka!</p>
            </div>
            {!showResults && lobbyQuestions.length > 0 && (
              <span className="text-xs bg-[#A2CDB0]/30 text-[#8B5A2B] font-bold px-3 py-1 rounded-full border border-[#6B8E23]/30">
                Soal {currentQIndex + 1} / {lobbyQuestions.length}
              </span>
            )}
          </div>

          {lobbyQuestions.length === 0 ? (
            <p className="text-center text-sm text-gray-500 py-8 font-semibold">Memuat kuis pemanasan Capy...</p>
          ) : showResults ? (
            /* Results page */
            <div className="space-y-5">
              <div className="text-center py-5 space-y-2 bg-[#FDF5E6] rounded-2xl border-2 border-[#D2B48C]">
                <Trophy size={44} className="mx-auto text-[#6B8E23]" />
                <h4 className="text-xl font-black text-[#8B5A2B]">Latihan Selesai!</h4>
                <p className="text-xs md:text-sm text-gray-700 font-semibold">Berikut ulasan kunci jawaban kuis pemanasan.</p>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto pr-2 divide-y divide-gray-100">
                {lobbyQuestions.map((q, idx) => {
                  const userAns = userAnswers[q.id];
                  const isCorrect = userAns === q.correctAnswer;
                  return (
                    <div key={q.id} className="pt-3 first:pt-0 space-y-1.5">
                      <p className="font-bold text-xs md:text-sm text-[#8B5A2B]">
                        {idx + 1}. {q.text}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium">
                        <div className={`p-2.5 rounded-xl border ${isCorrect ? "bg-green-50 border-green-300 text-green-800" : "bg-red-50 border-red-300 text-red-800"}`}>
                          Jawabanmu: {userAns || "(Tidak dijawab)"}
                        </div>
                        <div className="p-2.5 rounded-xl bg-green-50 border border-green-300 text-green-800">
                          Kunci Jawaban: {q.correctAnswer}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={handleResetLobbyGame}
                className="btn-capy w-full flex items-center justify-center gap-2 bg-[#A2CDB0] hover:bg-[#8ebf9d] text-[#8B5A2B] py-3 rounded-2xl text-sm font-black shadow"
              >
                <RefreshCw size={16} /> Coba Kuis Pemanasan Baru
              </button>
            </div>
          ) : (
            /* Playing Lobby Game */
            currentQ && (
              <div className="space-y-5">
                <p className="text-base md:text-lg font-bold leading-relaxed text-gray-800">{currentQ.text}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentQ.options.map((opt, optIdx) => {
                    const selected = userAnswers[currentQ.id] === opt;
                    const letter = String.fromCharCode(65 + optIdx);
                    return (
                      <button
                        key={opt}
                        onClick={() => handleSelectAnswer(currentQ.id, opt)}
                        className={`btn-capy p-3.5 md:p-4 text-left text-xs md:text-sm rounded-2xl border-2 transition-all flex items-center gap-3 ${
                          selected
                            ? "bg-[#6B8E23] text-white border-[#556B2F] font-bold shadow-md"
                            : "bg-[#FDF5E6] border-[#D2B48C] text-[#8B5A2B] hover:bg-[#A2CDB0]/30"
                        }`}
                      >
                        <span
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                            selected ? "bg-white text-[#6B8E23]" : "bg-[#D2B48C] text-white"
                          }`}
                        >
                          {letter}
                        </span>
                        <span className="leading-snug">{opt}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-end pt-3 border-t border-gray-100">
                  <button
                    disabled={!userAnswers[currentQ.id]}
                    onClick={handleNextQuestion}
                    className="btn-capy flex items-center gap-1.5 bg-[#6B8E23] hover:bg-[#58771c] text-white px-6 py-2.5 rounded-xl text-xs md:text-sm font-black disabled:opacity-50"
                  >
                    <span>Lanjut</span>
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* --- QUICK TRIVIA MODAL OVERLAY --- */}
      {showQuickModal && currentQ && (
        <div className="fixed inset-0 bg-[#8B5A2B]/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl border-4 border-[#D2B48C] relative">
            <button
              onClick={() => setShowQuickModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            >
              <X size={20} />
            </button>
            <span className="text-3xl">🌿</span>
            <h3 className="text-xl font-black text-[#6B8E23]">Trivia Pemanasan Capy!</h3>
            <p className="text-sm font-bold text-gray-800 leading-snug">{currentQ.text}</p>

            <div className="flex flex-col gap-2 pt-2">
              {currentQ.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    handleSelectAnswer(currentQ.id, opt);
                    if (opt === currentQ.correctAnswer) {
                      setQuickFeedback("Jawaban Benar! Capy Senang Sekali! 🌿");
                    } else {
                      setQuickFeedback(`Jawaban Kurang Tepat. Kunci: ${currentQ.correctAnswer}`);
                    }
                    setTimeout(() => {
                      setQuickFeedback(null);
                      setShowQuickModal(false);
                      handleNextQuestion();
                    }, 1400);
                  }}
                  className="btn-capy bg-[#FDF5E6] border-2 border-[#D2B48C] text-[#8B5A2B] font-bold p-3 rounded-xl text-xs md:text-sm text-left hover:bg-[#A2CDB0]/40 transition"
                >
                  {opt}
                </button>
              ))}
            </div>

            {quickFeedback && (
              <p className="text-xs font-black text-[#6B8E23] animate-bounce pt-2">{quickFeedback}</p>
            )}

            <button
              onClick={() => setShowQuickModal(false)}
              className="text-xs font-bold text-[#8B5A2B] underline pt-2 block mx-auto"
            >
              Tutup Modal
            </button>
          </div>
        </div>
      )}

      {/* --- SLOT OPENED / CLAIMED MODAL POPUP --- */}
      {slotClaimed && (
        <div className="fixed inset-0 bg-[#8B5A2B]/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 text-center space-y-5 shadow-2xl border-4 border-[#D2B48C] relative">
            <button
              onClick={handleCloseClaimModal}
              className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
              title="Tutup (Nanti saja)"
            >
              <X size={20} />
            </button>
            <img
              src="/asset/capy-quiz/capy-hai.png"
              alt="Capybara Lounge Ready"
              className="w-28 h-28 mx-auto rounded-full border-4 border-[#6B8E23] object-cover shadow-md animate-bounce bg-[#FDF5E6]"
            />
            <div className="space-y-1">
              <span className="text-xs uppercase font-black text-[#6B8E23] tracking-wider">Capy Lounge Siap!</span>
              <h3 className="text-2xl font-black text-[#8B5A2B]">Room Kuis Siap Diberikan</h3>
              <p className="text-xs md:text-sm text-gray-600 font-medium leading-relaxed">
                "Kawan, room petualangan kompetensimu telah terbuka! Masuk dan selesaikan tantangan kuis sekarang!"
              </p>
            </div>

            {/* List of Competency Rooms */}
            {competencies.length > 0 && (
              <div className="space-y-2 text-left max-h-48 overflow-y-auto pr-1">
                {competencies.map((comp: any, idx: number) => (
                  <button
                    key={comp.id}
                    onClick={() => {
                      window.location.href = `/siswa/ujian/${jadwalId}/quiz/play?sessionId=${sessionId}&competencyId=${comp.id}`;
                    }}
                    className={`btn-capy w-full p-3 border-2 rounded-2xl flex items-center justify-between transition cursor-pointer text-left ${
                      comp.isCompleted
                        ? "bg-green-50 border-green-300 hover:bg-green-100"
                        : "bg-[#FDF5E6] border-[#D2B48C] hover:bg-[#A2CDB0]/40"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold bg-[#6B8E23]/20 text-[#6B8E23] px-2 py-0.5 rounded-full">
                          Level {idx + 1} • {comp.code}
                        </span>
                        {comp.isCompleted ? (
                          <span className="text-[10px] font-bold bg-green-200 text-green-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                            ✓ Selesai
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                            Belum Selesai
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-[#8B5A2B] mt-1 line-clamp-1">{comp.name}</p>
                    </div>
                    <ChevronRight size={18} className="text-[#6B8E23] shrink-0" />
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => {
                const targetCompId = competencies.length > 0 ? competencies[0].id : null;
                const compQuery = targetCompId ? `&competencyId=${targetCompId}` : "";
                window.location.href = `/siswa/ujian/${jadwalId}/quiz/play?sessionId=${sessionId}${compQuery}`;
              }}
              className="btn-capy w-full flex items-center justify-center gap-2 bg-[#6B8E23] hover:bg-[#58771c] text-white py-3.5 rounded-2xl text-base font-black shadow-lg"
            >
              <Play size={20} fill="white" />
              Masuk ke Room Kuis Sekarang
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
