import React from "react";
import { ReportProps, CompetencyScore, QuestionDetail } from "@/src/app/types/report";

// Pastikan tipe data props sudah sesuai dengan interface kamu
export function ReportTemplate({
  schoolName,
  studentName,
  className,
  teacherName,
  overallScore,
  overviewText,
  recommendationText,
  weaknessText,
  competencyScores,
  questions,
  status,
}: ReportProps) {
  if (status === "PENDING" || status === "PROCESSING") {
    return (
      <div className="w-full max-w-2xl bg-white p-8 md:p-12 text-center rounded-3xl border border-[#7FA88F]/20 shadow-xl mx-auto space-y-6 my-8 font-sans">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#7FA88F]"></div>
        </div>
        <h2 className="text-2xl font-extrabold text-[#39434D]">Menganalisis Hasil Ujian...</h2>
        <p className="text-gray-500 text-sm leading-relaxed">
          Kecerdasan Buatan (AI) Arunika sedang menganalisis detail jawaban Anda untuk merumuskan rekomendasi belajar personal. Sesi analisis biasanya memakan waktu sekitar 1-2 menit. Silakan tunggu atau refresh halaman ini nanti.
        </p>
      </div>
    );
  }

  if (status === "FAILED") {
    return (
      <div className="w-full max-w-2xl bg-white p-8 md:p-12 text-center rounded-3xl border border-red-200 shadow-xl mx-auto space-y-6 my-8 font-sans">
        <div className="text-red-500 text-5xl flex justify-center">⚠️</div>
        <h2 className="text-2xl font-extrabold text-red-700">Analisis Gagal</h2>
        <p className="text-gray-500 text-sm leading-relaxed">
          Maaf, terjadi kesalahan saat kecerdasan buatan menganalisis hasil pengerjaan ujian. Silakan laporkan kepada guru atau administrator sistem untuk memicu kembali proses analisis.
        </p>
      </div>
    );
  }

  const percentage =
    Math.round((overallScore.correct / overallScore.total) * 100) || 0;

  return (
    <div className="w-full max-w-5xl bg-[#FAF8F3] text-[#39434D] p-6 md:p-12 relative shadow-xl mx-auto rounded-3xl font-sans">
      {/* Header Section */}
      <header className="mb-12 text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold text-[#39434D] mb-6 tracking-tight">
          {schoolName}
        </h1>

        {/* Modern Pill-shaped Metadata */}
        <div className="inline-flex flex-wrap justify-center items-center gap-3 md:gap-6 bg-white px-6 py-3 rounded-full shadow-sm border border-[#7FA88F]/20 text-sm md:text-base font-medium">
          <div className="flex items-center gap-2">
            <span className="text-[#7FA88F]">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                ></path>
              </svg>
            </span>
            <span>{studentName}</span>
          </div>
          <span className="hidden md:inline text-gray-300">|</span>
          <div className="flex items-center gap-2">
            <span className="text-[#7FA88F]">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m3-4h1m-1 4h1m-5 8h8"
                ></path>
              </svg>
            </span>
            <span>Class {className}</span>
          </div>
          <span className="hidden md:inline text-gray-300">|</span>
          <div className="flex items-center gap-2">
            <span className="text-[#7FA88F]">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                ></path>
              </svg>
            </span>
            <span>{teacherName}</span>
          </div>
        </div>
      </header>

      {/* Overview Card Section */}
      <section className="mb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-[#7FA88F]/20 p-6 md:p-8 flex flex-col md:flex-row items-center gap-8 hover:shadow-md transition-shadow">
          {/* Score Badge */}
          <div className="flex-shrink-0 flex flex-col items-center justify-center w-36 h-36 rounded-full border-8 border-[#7FA88F]/20 relative">
            <div
              className="absolute inset-0 rounded-full border-8 border-[#7FA88F] rounded-full"
              style={{
                clipPath: `polygon(0 0, 100% 0, 100% ${percentage}%, 0 ${percentage}%)`,
              }}
            ></div>
            <span className="text-4xl font-black text-[#39434D] z-10">
              {percentage}%
            </span>
            <span className="text-sm font-bold text-[#7FA88F] mt-1 z-10">
              {overallScore.correct} / {overallScore.total}
            </span>
          </div>

          {/* Overview Text */}
          <div className="flex-grow text-center md:text-left">
            <h2 className="text-2xl font-bold text-[#39434D] mb-3">
              Performance Overview
            </h2>
            <p className="text-[#39434D]/80 leading-relaxed text-lg">
              {overviewText}
            </p>
          </div>
        </div>
      </section>

      {/* Weakness & Recommendation Section (New) */}
      <section className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weakness Card */}
        <div className="bg-red-50/50 rounded-2xl p-6 border border-red-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-red-100 rounded-lg text-red-600">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                ></path>
              </svg>
            </div>
            <h3 className="text-lg font-bold text-red-900">
              Area for Improvement
            </h3>
          </div>
          <p className="text-red-900/80 leading-relaxed text-sm md:text-base">
            {weaknessText}
          </p>
        </div>

        {/* Recommendation Card */}
        <div className="bg-[#7FA88F]/10 rounded-2xl p-6 border border-[#7FA88F]/20 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-[#7FA88F]/20 rounded-lg text-[#39434D]">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
            </div>
            <h3 className="text-lg font-bold text-[#39434D]">
              Teacher's Recommendation
            </h3>
          </div>
          <p className="text-[#39434D]/80 leading-relaxed text-sm md:text-base">
            {recommendationText}
          </p>
        </div>
      </section>

      {/* Competency Mastery Section */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1.5 h-6 bg-[#7FA88F] rounded-full"></div>
          <h2 className="text-xl font-bold text-[#39434D]">
            Competency Mastery
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {competencyScores?.map((comp: CompetencyScore) => (
            <div
              key={comp.code}
              className="bg-white rounded-2xl p-5 border border-[#7FA88F]/20 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#7FA88F]/10 text-[#7FA88F] mb-2">
                  Kode: {comp.code}
                </span>
                <p className="text-sm font-semibold text-[#39434D] mb-4 line-clamp-2 hover:line-clamp-none">
                  {comp.name}
                </p>
              </div>
              <div className="bg-[#FAF8F3] px-4 py-2 rounded-full border border-[#7FA88F]/30 flex justify-between items-center mt-2">
                <span className="text-xs text-[var(--muted-foreground)]">Ketuntasan:</span>
                <span className="text-base font-bold text-[#39434D]">
                  {comp.correct} <span className="text-[#7FA88F] mx-0.5">/</span> {comp.total} Soal
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Detailed Review Section */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1.5 h-6 bg-[#7FA88F] rounded-full"></div>
          <h2 className="text-xl font-bold text-[#39434D]">Detailed Review</h2>
        </div>
        <div className="w-full bg-white rounded-2xl border border-[#7FA88F]/30 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-[#FAF8F3] text-[#39434D] border-b border-[#7FA88F]/30">
                <tr>
                  <th className="p-4 w-12 text-center font-bold">No.</th>
                  <th className="p-4 font-bold">Question Prompt</th>
                  <th className="p-4 w-1/4 font-bold">Student Response</th>
                  <th className="p-4 w-28 text-center font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#7FA88F]/10">
                {questions.map((q: QuestionDetail, idx: number) => (
                  <tr
                    key={q.id}
                    className="hover:bg-[#FAF8F3]/50 transition-colors"
                  >
                    <td className="p-4 text-center align-top font-bold text-[#7FA88F]">
                      {idx + 1}
                    </td>
                    <td className="p-4 align-top pr-6 text-[#39434D]/90 leading-relaxed">
                      {q.prompt}
                    </td>
                    <td className="p-4 align-top font-semibold text-[#39434D]">
                      {q.studentAnswer}
                    </td>
                    <td className="p-4 align-top text-center">
                      <span
                        className={`inline-flex items-center justify-center px-3 py-1.5 rounded-full text-xs font-bold min-w-[80px] shadow-sm ${
                          q.isCorrect
                            ? "bg-[#7FA88F] text-white"
                            : "bg-red-100 text-red-700 border border-red-200"
                        }`}
                      >
                        {q.isCorrect ? "Correct" : "Incorrect"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
