"use client";

import React, { use } from "react";
import { useRouter } from "next/navigation";
import {
  Timer,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
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
    questions,
    currentIndex,
    setCurrentIndex,
    answers,
    handleAnswer,
    nextQuestion,
    prevQuestion,
    timeLeft,
    progress,
  } = useExamAttempt(resolvedParams.jadwal_id);

  const handleSubmit = () => {
    if (
      confirm(
        "Apakah Anda yakin ingin menyelesaikan ujian ini? Jawaban tidak dapat diubah setelah disubmit.",
      )
    ) {
      alert("Ujian berhasil disubmit! Mengembalikan Anda ke Riwayat Ujian.");
      router.push("/siswa/history");
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[var(--background)]">
      {/* Header Ujian */}
      <header className="h-16 bg-[var(--card)] border-b border-[var(--border)] flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-bold text-[var(--foreground)]">
            Arunika Test Engine
          </span>
          <span className="bg-[var(--muted)] text-[var(--muted-foreground)] text-xs px-2 py-1 rounded-full">
            Proctoring Active
          </span>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-[var(--error)] font-bold font-mono text-lg bg-[#D9707010] px-4 py-1.5 rounded-lg border border-[#D9707030]">
            <Timer size={20} />
            {timeLeft}
          </div>
          <button
            onClick={handleSubmit}
            className="bg-[var(--primary)] text-white px-5 py-2 rounded-lg font-medium hover:opacity-90 transition flex items-center gap-2 text-sm"
          >
            <CheckCircle size={16} /> Selesai & Kumpulkan
          </button>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="h-1 bg-[var(--muted)] w-full">
        <div
          className="h-full bg-[var(--primary)] transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Navigasi Nomor Soal */}
        <div className="w-64 bg-[var(--card)] border-r border-[var(--border)] p-4 flex flex-col gap-4 overflow-y-auto shrink-0">
          <h3 className="font-semibold text-sm text-[var(--muted-foreground)] uppercase tracking-wider">
            Navigasi Soal
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {questions.map((q, idx) => {
              const isAnswered = !!answers[q.id];
              const isActive = idx === currentIndex;

              let btnClass = "h-10 rounded font-medium text-sm transition ";
              if (isActive)
                btnClass += "ring-2 ring-[var(--ring)] ring-offset-1 ";

              if (isAnswered) {
                btnClass += "bg-[var(--success)] text-white";
              } else {
                btnClass +=
                  "bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--border)]";
              }

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={btnClass}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="mt-auto pt-4 border-t border-[var(--border)] space-y-2 text-xs text-[var(--muted-foreground)]">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-[var(--success)] block"></span>{" "}
              Sudah Dijawab
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-[var(--muted)] block"></span>{" "}
              Belum Dijawab
            </div>
          </div>
        </div>

        {/* Area Pertanyaan */}
        <div className="flex-1 overflow-y-auto p-8 lg:p-12">
          <div className="max-w-3xl mx-auto bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-sm p-8 min-h-[500px] flex flex-col">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-[var(--border)]">
              <h2 className="text-xl font-bold text-[var(--foreground)]">
                Soal No. {currentIndex + 1}
              </h2>
              <span className="bg-[var(--accent)] text-white text-xs px-2 py-1 rounded font-bold">
                {currentQ?.type}
              </span>
            </div>

            <p className="text-lg text-[var(--foreground)] leading-relaxed mb-8">
              {currentQ?.text}
            </p>

            <div className="flex-1">
              {currentQ?.type === "MCQ" && currentQ.options && (
                <div className="space-y-3">
                  {currentQ.options.map((opt, idx) => (
                    <label
                      key={idx}
                      className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all
                        ${
                          answers[currentQ.id] === opt
                            ? "border-[var(--primary)] bg-[#7FA88F10]"
                            : "border-[var(--border)] hover:border-[var(--secondary)] bg-[var(--background)]"
                        }`}
                    >
                      <input
                        type="radio"
                        name={`question-${currentQ.id}`}
                        value={opt}
                        checked={answers[currentQ.id] === opt}
                        onChange={() => handleAnswer(currentQ.id, opt)}
                        className="w-5 h-5 text-[var(--primary)] border-[var(--border)] focus:ring-[var(--primary)]"
                      />
                      <span className="text-[var(--foreground)]">
                        {String.fromCharCode(65 + idx)}. {opt}
                      </span>
                    </label>
                  ))}
                </div>
              )}

              {currentQ?.type === "ESSAY" && (
                <textarea
                  value={answers[currentQ.id] || ""}
                  onChange={(e) => handleAnswer(currentQ.id, e.target.value)}
                  placeholder="Ketik jawaban Anda di sini..."
                  className="w-full h-48 p-4 bg-[var(--background)] border border-[var(--input)] rounded-xl text-[var(--foreground)] focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent outline-none resize-none transition"
                ></textarea>
              )}
            </div>

            {/* Tombol Navigasi Bawah */}
            <div className="mt-8 pt-6 border-t border-[var(--border)] flex justify-between">
              <button
                onClick={prevQuestion}
                disabled={currentIndex === 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-[var(--foreground)] bg-[var(--muted)] hover:bg-[var(--border)] disabled:opacity-50 transition"
              >
                <ChevronLeft size={18} /> Sebelumnya
              </button>

              {currentIndex === questions.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-white bg-[var(--success)] hover:opacity-90 transition shadow-md"
                >
                  <CheckCircle size={18} /> Selesai Ujian
                </button>
              ) : (
                <button
                  onClick={nextQuestion}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-white bg-[var(--secondary)] hover:opacity-90 transition shadow-md"
                >
                  Selanjutnya <ChevronRight size={18} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
