"use client";

import React from "react";

interface GradeItem {
  siswaId: string;
  score?: number | null;
}

interface ExamReport {
  jadwalId: string;
  examTitle: string;
  type: string;
  grades: GradeItem[];
}

interface Student {
  id: string;
  name: string;
}

interface ReportTabProps {
  loadingGrades: boolean;
  gradesReport: ExamReport[];
  students: Student[];
}

export const ReportTab: React.FC<ReportTabProps> = ({
  loadingGrades,
  gradesReport,
  students,
}) => {
  if (loadingGrades) {
    return (
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4 text-center text-sm text-[var(--muted-foreground)]">
        Memuat matriks nilai...
      </div>
    );
  }

  if (gradesReport.length === 0) {
    return (
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-8 text-center text-sm text-[var(--muted-foreground)]">
        Belum ada ujian di kelas ini.
      </div>
    );
  }

  return (
    <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse min-w-[600px]">
          <thead className="bg-[var(--muted)] text-[var(--foreground)] border-b border-[var(--border)]">
            <tr>
              <th className="p-4 font-bold">Siswa</th>
              {gradesReport.map((exam) => (
                <th
                  key={exam.jadwalId}
                  className="p-4 font-bold text-center max-w-[200px]"
                  title={exam.examTitle}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] bg-[var(--primary)]/10 text-[var(--primary)] px-2 py-0.5 rounded font-bold uppercase">
                      {exam.type}
                    </span>
                    <span className="text-xs line-clamp-2">{exam.examTitle}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {students.map((student) => (
              <tr key={student.id} className="hover:bg-[var(--muted)]/30 transition-colors">
                <td className="p-4 font-medium text-[var(--card-foreground)]">{student.name}</td>
                {gradesReport.map((exam) => {
                  const gradeObj = exam.grades.find((g) => g.siswaId === student.id);
                  const score = gradeObj?.score;
                  return (
                    <td
                      key={exam.jadwalId}
                      className="p-4 text-center font-semibold text-[var(--card-foreground)]"
                    >
                      {score !== undefined && score !== null ? Math.round(score) : "-"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
