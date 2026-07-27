import React from "react";

export function ReportTemplate({
  schoolName,
  studentName,
  className,
  teacherName,
  overallScore,
  overviewText,
  taxonomyScores,
  questions,
}: ReportProps) {
  const percentage =
    Math.round((overallScore.correct / overallScore.total) * 100) || 0;

  return (
    // Outer border removed here:
    <div className="w-full max-w-4xl bg-[#FAF8F3] text-[#39434D] p-12 relative shadow-2xl mx-auto">
      {/* Header Section */}
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-extrabold uppercase tracking-widest text-[#39434D] mb-2">
          {schoolName}
        </h1>
        <div className="text-sm font-semibold border-b-4 border-[#7FA88F] pb-4 flex justify-center gap-4">
          <span>Student: {studentName}</span>
          <span className="text-[#7FA88F]">|</span>
          <span>Class: {className}</span>
          <span className="text-[#7FA88F]">|</span>
          <span>Teacher: {teacherName}</span>
        </div>
      </header>

      {/* Overview Section */}
      <section className="mb-8">
        <h2 className="text-lg font-bold bg-[#39434D] text-[#FAF8F3] inline-block px-4 py-2 border-l-4 border-[#7FA88F] mb-4 uppercase tracking-wider">
          Performance Overview
        </h2>
        <div className="border-2 border-[#7FA88F] bg-white p-6 shadow-sm">
          <span className="block text-4xl font-black text-[#7FA88F] mb-3">
            {overallScore.correct} / {overallScore.total} ({percentage}%)
          </span>
          <p className="text-base leading-relaxed">{overviewText}</p>
        </div>
      </section>

      {/* Taxonomy Section */}
      <section className="mb-8">
        <h2 className="text-lg font-bold bg-[#39434D] text-[#FAF8F3] inline-block px-4 py-2 border-l-4 border-[#7FA88F] mb-4 uppercase tracking-wider">
          Cognitive Mastery (Bloom's)
        </h2>
        <div className="grid grid-cols-4 gap-4">
          {taxonomyScores.map((tax) => (
            <div
              key={tax.level}
              className="border-2 border-[#7FA88F] bg-white p-4 text-center shadow-sm"
            >
              <span className="block text-xl font-black text-[#39434D] mb-1">
                {tax.level}
              </span>
              <span className="block text-xs uppercase font-bold text-[#7FA88F] tracking-wide mb-3">
                {tax.name}
              </span>
              <span className="block text-2xl font-bold">
                {tax.correct} / {tax.total}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Questions Recap Section */}
      <section>
        <h2 className="text-lg font-bold bg-[#39434D] text-[#FAF8F3] inline-block px-4 py-2 border-l-4 border-[#7FA88F] mb-4 uppercase tracking-wider">
          Detailed Review
        </h2>
        <div className="w-full bg-white border border-[#7FA88F]">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-[#39434D] text-[#FAF8F3]">
              <tr>
                <th className="p-3 w-12 text-center border-b border-[#7FA88F]">
                  No.
                </th>
                <th className="p-3 border-b border-[#7FA88F]">
                  Question Prompt
                </th>
                <th className="p-3 w-1/4 border-b border-[#7FA88F]">
                  Student Response
                </th>
                <th className="p-3 w-24 text-center border-b border-[#7FA88F]">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q, idx) => (
                <tr
                  key={q.id}
                  className="border-b border-[#7FA88F] last:border-b-0"
                >
                  <td className="p-3 text-center align-top font-bold">
                    {idx + 1}
                  </td>
                  <td className="p-3 align-top pr-6">{q.prompt}</td>
                  <td className="p-3 align-top font-semibold text-[#39434D]">
                    {q.studentAnswer}
                  </td>
                  <td className="p-3 align-top text-center">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-bold text-white min-w-[70px] ${
                        q.isCorrect ? "bg-[#7FA88F]" : "bg-red-400"
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
      </section>
    </div>
  );
}
