import React from "react";
import { ReportProps } from "@/src/app/types/report";

export function PrintReportTemplate({
    schoolName,
    testTitle,
    studentName,
    className,
    teacherName,
    overallScore,
    overviewText,
    recommendationText,
    weaknessText,
    competencyScores,
    questions,
}: ReportProps) {
    const percentage =
        Math.round((overallScore.correct / overallScore.total) * 100) || 0;

    const getScoreLabel = () => {
        if (percentage >= 90) return "Excellent";
        if (percentage >= 80) return "Very Good";
        if (percentage >= 70) return "Good";
        if (percentage >= 60) return "Satisfactory";
        return "Needs Improvement";
    };

    return (
        <div className="print-report bg-white text-[#39434D] font-sans w-full">
            {/* ================= HEADER ================= */}
            <header className="border-b-2 border-[#7FA88F] pb-6 mb-8">
                <div className="flex items-start justify-between gap-8">
                    <div>
                        <p className="text-xs uppercase tracking-[0.2em] font-bold text-[#7FA88F] mb-2">
                            Academic Assessment Report
                        </p>

                        <h1 className="text-2xl font-black tracking-tight">
                            {schoolName}
                        </h1>

                        <h2 className="text-lg font-semibold text-[#39434D]/65 mt-1">
                            {testTitle}
                        </h2>
                    </div>

                    <div className="text-right">
                        <p className="text-xs uppercase tracking-wider text-[#39434D]/45 font-bold">
                            Student
                        </p>

                        <p className="text-base font-bold">
                            {studentName}
                        </p>

                        <p className="text-sm text-[#39434D]/60">
                            Class {className}
                        </p>
                    </div>
                </div>
            </header>

            {/* ================= STUDENT INFO ================= */}
            <section className="print-section mb-8">
                <div className="grid grid-cols-3 border border-[#7FA88F]/25 rounded-xl overflow-hidden">
                    <InfoItem label="Student" value={studentName} />
                    <InfoItem label="Class" value={className} />
                    <InfoItem label="Teacher" value={teacherName} />
                </div>
            </section>

            {/* ================= PERFORMANCE ================= */}
            <section className="print-section mb-10">
                <SectionHeading
                    number="01"
                    title="Performance Summary"
                    subtitle="Overall result and learning analysis"
                />

                <div className="grid grid-cols-[145px_1fr] gap-8 items-center border border-[#7FA88F]/20 rounded-2xl p-6">
                    <div className="text-center border-r border-[#7FA88F]/20 pr-8">
                        <div className="w-28 h-28 mx-auto rounded-full border-[10px] border-[#7FA88F]/15 flex items-center justify-center">
                            <div>
                                <div className="text-3xl font-black">
                                    {percentage}%
                                </div>

                                <div className="text-[10px] uppercase tracking-wide font-bold text-[#7FA88F]">
                                    Score
                                </div>
                            </div>
                        </div>

                        <p className="mt-3 text-xs font-bold uppercase tracking-wider text-[#7FA88F]">
                            {getScoreLabel()}
                        </p>

                        <p className="text-xs text-[#39434D]/55 mt-1">
                            {overallScore.correct} of {overallScore.total} correct
                        </p>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold mb-2">
                            Performance Overview
                        </h3>

                        <p className="text-sm leading-6 text-[#39434D]/75">
                            {overviewText}
                        </p>
                    </div>
                </div>
            </section>

            {/* ================= LEARNING INSIGHTS ================= */}
            <section className="print-section mb-10">
                <SectionHeading
                    number="02"
                    title="Learning Insights"
                    subtitle="Areas requiring attention and recommended next steps"
                />

                <div className="grid grid-cols-2 gap-5">
                    <InsightCard
                        title="Area for Improvement"
                        text={weaknessText}
                        variant="warning"
                    />

                    <InsightCard
                        title="Teacher's Recommendation"
                        text={recommendationText}
                        variant="success"
                    />
                </div>
            </section>

            {/* ================= COMPETENCY ================= */}
            <section className="print-section mb-10">
                <SectionHeading
                    number="03"
                    title="Competency Mastery"
                    subtitle="Performance across assessed competencies"
                />

                <div className="grid grid-cols-2 gap-4">
                    {competencyScores?.map((comp) => {
                        const competencyPercentage =
                            comp.total > 0
                                ? Math.round((comp.correct / comp.total) * 100)
                                : 0;

                        return (
                            <div
                                key={comp.code}
                                className="border border-[#7FA88F]/20 rounded-xl p-4"
                            >
                                <div className="flex justify-between gap-4 mb-3">
                                    <div>
                                        <span className="inline-block text-[10px] uppercase tracking-wider font-bold text-[#7FA88F] bg-[#7FA88F]/10 px-2 py-1 rounded-md mb-2">
                                            {comp.code}
                                        </span>

                                        <h3 className="text-sm font-bold leading-5">
                                            {comp.name}
                                        </h3>
                                    </div>

                                    <div className="text-right shrink-0">
                                        <span className="text-lg font-black">
                                            {competencyPercentage}%
                                        </span>

                                        <p className="text-[10px] text-[#39434D]/50">
                                            mastery
                                        </p>
                                    </div>
                                </div>

                                <div className="h-2 bg-[#FAF8F3] rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-[#7FA88F] rounded-full"
                                        style={{
                                            width: `${competencyPercentage}%`,
                                        }}
                                    />
                                </div>

                                <div className="flex justify-between mt-2 text-xs text-[#39434D]/60">
                                    <span>Correct answers</span>

                                    <span className="font-bold">
                                        {comp.correct} / {comp.total}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* ================= DETAILED REVIEW ================= */}
            <section>
                <SectionHeading
                    number="04"
                    title="Detailed Review"
                    subtitle="Question-by-question performance analysis"
                />

                <div className="space-y-5">
                    {questions.map((q, idx) => (
                        <QuestionReview
                            key={q.id}
                            question={q}
                            number={idx + 1}
                        />
                    ))}
                </div>
            </section>

            {/* ================= FOOTER ================= */}
            <footer className="mt-10 pt-5 border-t border-[#7FA88F]/20 flex justify-between text-[10px] text-[#39434D]/45">
                <span>Arunika Academic Assessment System</span>
                <span>Confidential Student Report</span>
            </footer>
        </div>
    );
}

/* =========================================================
   QUESTION REVIEW
========================================================= */

function QuestionReview({
    question,
    number,
}: {
    question: ReportProps["questions"][number extends number ? 0 : never];
    number: number;
}) {
    return (
        <article className="print-question border border-[#7FA88F]/20 rounded-2xl overflow-hidden">
            {/* Question header */}
            <div className="flex items-center justify-between bg-[#FAF8F3] px-5 py-3 border-b border-[#7FA88F]/20">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#7FA88F] text-white flex items-center justify-center text-xs font-black">
                        {number}
                    </div>

                    <h3 className="text-sm font-bold">
                        Question {number}
                    </h3>
                </div>

                <span
                    className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold ${question.isCorrect
                        ? "bg-[#7FA88F]/15 text-[#4F7D60]"
                        : "bg-red-50 text-red-700"
                        }`}
                >
                    {question.isCorrect ? "Correct" : "Incorrect"}
                </span>
            </div>

            {/* Question body */}
            <div className="p-5">
                {/* Question image */}
                {question.linkGambarSoal && (
                    <div className="mb-5 flex justify-center">
                        <img
                            src={question.linkGambarSoal}
                            alt={`Illustration for question ${number}`}
                            className="max-w-full max-h-[260px] object-contain rounded-xl border border-[#7FA88F]/15"
                        />
                    </div>
                )}

                {/* Prompt */}
                <div className="mb-5">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-[#7FA88F] mb-1">
                        Question
                    </p>

                    <p className="text-sm leading-6 text-[#39434D]/90">
                        {question.prompt}
                    </p>
                </div>

                {/* Student answer */}
                <div className="grid grid-cols-2 gap-5">
                    <div className="bg-[#FAF8F3] rounded-xl p-4">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-[#39434D]/45 mb-2">
                            Student Response
                        </p>

                        <p className="text-sm leading-5 font-medium">
                            {question.studentAnswer || (
                                <span className="italic text-[#39434D]/40">
                                    No response
                                </span>
                            )}
                        </p>
                    </div>

                    <div
                        className={`rounded-xl p-4 ${question.isCorrect
                            ? "bg-[#7FA88F]/5"
                            : "bg-red-50/50"
                            }`}
                    >
                        <p className="text-[10px] uppercase tracking-wider font-bold text-[#39434D]/45 mb-2">
                            Teacher's Comment
                        </p>

                        <p className="text-sm leading-5 text-[#39434D]/75">
                            {question.catatanKoreksi || (
                                <span className="italic text-[#39434D]/40">
                                    No teacher comment has been provided.
                                </span>
                            )}
                        </p>
                    </div>
                </div>
            </div>
        </article>
    );
}

/* =========================================================
   HELPERS
========================================================= */

function InfoItem({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="p-4 border-r last:border-r-0 border-[#7FA88F]/20">
            <p className="text-[10px] uppercase tracking-wider font-bold text-[#7FA88F] mb-1">
                {label}
            </p>

            <p className="text-sm font-semibold">
                {value}
            </p>
        </div>
    );
}

function SectionHeading({
    number,
    title,
    subtitle,
}: {
    number: string;
    title: string;
    subtitle: string;
}) {
    return (
        <div className="flex items-start gap-4 mb-5">
            <div className="shrink-0 w-9 h-9 rounded-lg bg-[#7FA88F] text-white flex items-center justify-center text-xs font-black">
                {number}
            </div>

            <div>
                <h2 className="text-xl font-black">
                    {title}
                </h2>

                <p className="text-xs text-[#39434D]/50 mt-0.5">
                    {subtitle}
                </p>
            </div>
        </div>
    );
}

function InsightCard({
    title,
    text,
    variant,
}: {
    title: string;
    text: string;
    variant: "warning" | "success";
}) {
    const warning = variant === "warning";

    return (
        <div
            className={`rounded-xl p-5 border ${warning
                ? "bg-red-50/50 border-red-100"
                : "bg-[#7FA88F]/5 border-[#7FA88F]/20"
                }`}
        >
            <div className="flex items-center gap-2 mb-3">
                <div
                    className={`w-2 h-2 rounded-full ${warning ? "bg-red-500" : "bg-[#7FA88F]"
                        }`}
                />

                <h3 className="text-sm font-bold">
                    {title}
                </h3>
            </div>

            <p className="text-xs leading-5 text-[#39434D]/70">
                {text}
            </p>
        </div>
    );
}