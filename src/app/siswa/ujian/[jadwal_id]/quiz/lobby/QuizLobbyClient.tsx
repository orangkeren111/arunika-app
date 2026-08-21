"use client";

import React from "react";
import { useQuizLobbyViewModel } from "./QuizLobbyViewModel";
import { HelpCircle, ChevronRight, Play, RefreshCw, Trophy, Users, ShieldAlert, X } from "lucide-react";

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
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-[#FAF8F3] text-[#39434D]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7FA88F] mb-4"></div>
        <p className="font-semibold text-sm">Menghubungkan ke Eagle's Open Room...</p>
      </div>
    );
  }

  const currentQ = lobbyQuestions[currentQIndex];

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#39434D] py-8 px-4 font-sans relative overflow-hidden">
      {/* Background soft shapes */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-[#7FA88F]/5 rounded-full filter blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full filter blur-3xl"></div>

      <div className="max-w-4xl mx-auto space-y-6 relative z-10">

        {/* Mascot & Welcome Banner */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#7FA88F]/20 shadow-lg flex flex-col md:flex-row items-center gap-6">
          <div className="text-6xl select-none animate-bounce">🦅</div>
          <div className="space-y-2 text-center md:text-left flex-1">
            <div className="inline-block bg-[#7FA88F]/10 text-[#7FA88F] text-xs px-2.5 py-1 rounded-full font-bold">
              Maskot Elang
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-[#39434D]">
              Halo! Aku Elang, Penjaga Eagle's Open Room!
            </h1>
            <p className="text-gray-600 text-sm md:text-base leading-relaxed">
              "Ujianmu sudah selesai dan nilaimu sudah dianalisis. Sekarang, mari asah pemahaman kompetensimu lewat kuis kognitif interaktif bersamaku!"
            </p>
          </div>
        </div>

        {/* Rules & Queue Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Rules Card */}
          <div className="md:col-span-2 bg-[#7FA88F]/10 border border-[#7FA88F]/20 rounded-3xl p-6 space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <ShieldAlert className="text-[#7FA88F]" size={20} />
              Aturan Main Eagle's Open Room
            </h3>
            <ul className="text-sm space-y-2.5 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-[#7FA88F] font-bold">1.</span>
                <span>Durasi maksimal 15 menit per sesi kuis kognitif.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#7FA88F] font-bold">2.</span>
                <span>Batas toleransi 5 kesalahan berturut-turut (wrong streak).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#7FA88F] font-bold">3.</span>
                <span>Sesi berakhir otomatis ketika kamu menguasai seluruh kompetensi kuis.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#7FA88F] font-bold">4.</span>
                <span>AFK selama 5 menit tanpa aktivitas akan dikeluarkan otomatis dari room.</span>
              </li>
            </ul>
          </div>

          {/* Queue Widget */}
          <div className="bg-white border border-[#7FA88F]/20 rounded-3xl p-6 flex flex-col justify-between shadow-sm">
            <div className="space-y-2">
              <span className="text-xs uppercase font-bold text-gray-400 tracking-wider">Status Antrean</span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-[#39434D]">{activeSessions}</span>
                <span className="text-gray-400 font-medium">/ 20 Aktif</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Untuk membatasi biaya token AI, kapasitas room dibatasi. Kamu akan otomatis masuk setelah slot kosong tersedia.
              </p>
            </div>

            <div className="pt-4 border-t border-gray-100 space-y-3">
              <div className="flex items-center gap-2.5 text-xs font-semibold text-[#7FA88F]">
                <Users size={16} className="animate-pulse" />
                <span>Menunggu giliran bermain...</span>
              </div>
              <button
                onClick={handleCheckRoomAvailability}
                disabled={checkingAvailability}
                className="w-full flex items-center justify-center gap-2 bg-[#7FA88F]/10 hover:bg-[#7FA88F]/20 text-[#7FA88F] py-2 rounded-xl text-xs font-bold transition disabled:opacity-50"
              >
                <RefreshCw size={14} className={checkingAvailability ? "animate-spin" : ""} />
                {checkingAvailability ? "Memeriksa..." : "Cek Ketersediaan Room"}
              </button>
            </div>
          </div>
        </div>

        {/* Lobby Mini-Game */}
        <div className="bg-white border border-[#7FA88F]/20 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-gray-100">
            <div>
              <h3 className="text-lg font-bold text-[#39434D]">Kuis Pemanasan (Warm-up)</h3>
              <p className="text-xs text-gray-400">Sambil mengantre, asah kemampuan otakmu di sini!</p>
            </div>
            {!showResults && lobbyQuestions.length > 0 && (
              <span className="text-xs bg-gray-100 px-2.5 py-1 rounded-full font-bold">
                Soal {currentQIndex + 1} / {lobbyQuestions.length}
              </span>
            )}
          </div>

          {lobbyQuestions.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">Memuat kuis pemanasan...</p>
          ) : showResults ? (
            /* Results page */
            <div className="space-y-6">
              <div className="text-center py-6 space-y-2 bg-[#7FA88F]/10 rounded-2xl">
                <Trophy size={40} className="mx-auto text-[#7FA88F]" />
                <h4 className="text-xl font-bold">Latihan Selesai!</h4>
                <p className="text-sm text-gray-600">Berikut adalah kunci jawaban kuis pemanasan.</p>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto pr-2 divide-y divide-gray-100">
                {lobbyQuestions.map((q, idx) => {
                  const userAns = userAnswers[q.id];
                  const isCorrect = userAns === q.correctAnswer;
                  return (
                    <div key={q.id} className="pt-4 first:pt-0 space-y-2">
                      <p className="font-semibold text-sm">
                        {idx + 1}. {q.text}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        <div className={`p-2.5 rounded-lg ${isCorrect ? "bg-green-500/10 text-green-700" : "bg-red-500/10 text-red-700"}`}>
                          Jawabanmu: {userAns || "Tidak dijawab"}
                        </div>
                        <div className="p-2.5 rounded-lg bg-green-500/10 text-green-700">
                          Kunci Jawaban: {q.correctAnswer}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={handleResetLobbyGame}
                className="w-full flex items-center justify-center gap-2 bg-[#7FA88F]/10 text-[#7FA88F] py-2.5 rounded-xl hover:bg-[#7FA88F]/20 transition text-sm font-semibold"
              >
                <RefreshCw size={16} /> Coba Kuis Baru
              </button>
            </div>
          ) : (
            /* Playing Lobby Game */
            currentQ && (
              <div className="space-y-6">
                <p className="text-base md:text-lg font-bold leading-relaxed">{currentQ.text}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {currentQ.options.map((opt) => {
                    const selected = userAnswers[currentQ.id] === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => handleSelectAnswer(currentQ.id, opt)}
                        className={`p-4 text-left text-sm rounded-2xl border transition-all ${selected
                            ? "bg-[#7FA88F] text-white border-[#7FA88F] shadow-md"
                            : "bg-[#FAF8F3] border-gray-200 hover:border-[#7FA88F]/50"
                          }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100">
                  <button
                    disabled={!userAnswers[currentQ.id]}
                    onClick={handleNextQuestion}
                    className="flex items-center gap-1.5 bg-[#7FA88F] text-white px-5 py-2.5 rounded-xl hover:opacity-95 transition text-sm font-semibold disabled:opacity-50"
                  >
                    <span>Lanjut</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* --- SLOT OPENED / CLAIMED MODAL POPUP --- */}
      {slotClaimed && (
        <div className="fixed inset-0 bg-[#39434D]/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 text-center space-y-5 shadow-2xl border border-[#7FA88F]/20 relative">
            <button
              onClick={handleCloseClaimModal}
              className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
              title="Tutup (Nanti saja)"
            >
              <X size={20} />
            </button>
            <div className="text-6xl select-none animate-bounce">🦅</div>
            <div className="space-y-1">
              <span className="text-xs uppercase font-extrabold text-[#7FA88F] tracking-wider">Eagle's Room Terbuka!</span>
              <h3 className="text-2xl font-black text-[#39434D]">Pilih Room Kompetensi</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                "Kawan, room petualangan kompetensi telah siap! Selesaikan kuis pada tiap room kompetensi ini satu per satu."
              </p>
            </div>

            {/* List of Competency Rooms */}
            {competencies.length > 0 && (
              <div className="space-y-2 text-left max-h-48 overflow-y-auto pr-1">
                {competencies.map((comp: any, idx: number) => (
                  <div key={comp.id} className="p-3 bg-[#FAF8F3] border border-gray-200 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold bg-[#7FA88F]/20 text-[#7FA88F] px-2 py-0.5 rounded-full">
                        Level {idx + 1} • {comp.code}
                      </span>
                      <p className="text-xs font-bold text-[#39434D] mt-1 line-clamp-1">{comp.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => {
                window.location.href = `/siswa/ujian/${jadwalId}/quiz/play?sessionId=${sessionId}`;
              }}
              className="w-full flex items-center justify-center gap-2 bg-[#7FA88F] text-white py-3.5 rounded-2xl hover:opacity-95 transition text-base font-bold shadow-md"
            >
              <Play size={18} fill="white" />
              Masuk ke Room Kuis Kompetensi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
