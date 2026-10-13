"use client";

import React from "react";
import * as XLSX from "xlsx";

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
  const handleExportExcel = () => {
    // 1. Use Record<string, string | number> so TypeScript allows dynamic keys
    const excelData = students.map((student) => {
      const row: Record<string, string | number> = { Siswa: student.name };

      // Add each exam score dynamically using the exam title/type as column header
      gradesReport.forEach((exam) => {
        const gradeObj = exam.grades.find((g) => g.siswaId === student.id);
        const score = gradeObj?.score;
        const columnHeader = `${exam.examTitle} (${exam.type.toUpperCase()})`;

        row[columnHeader] = score !== undefined && score !== null ? Math.round(score) : "-";
      });

      return row;
    });

    // 2. Create worksheet from the formatted data array
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Optional: Set column widths for better readability
    const colWidths = [{ wch: 25 }]; // Width for the "Siswa" column
    gradesReport.forEach(() => {
      colWidths.push({ wch: 20 }); // Width for each exam column
    });
    worksheet["!cols"] = colWidths;

    // 3. Create workbook and append the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Nilai");

    // 4. Trigger download as an Excel file (.xlsx)
    XLSX.writeFile(workbook, "laporan-nilai-siswa.xlsx");
  };
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
    <div className="space-y-4">
      {/* Export Button */}
      <div className="flex justify-end">
        <button
          onClick={handleExportExcel}
          className="flex items-center gap-2 bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-95 transition-opacity shadow-sm cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Download Excel
        </button>
      </div>

      {/* Table Container */}
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
    </div>
  );
};
