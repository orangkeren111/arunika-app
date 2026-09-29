"use client";

import React from "react";
import { History } from "lucide-react";

interface Student {
  id: string;
  name: string;
  email: string;
}

interface StudentsTabProps {
  students: Student[];
  onViewStudentHistory: (student: Student) => void;
}

export const StudentsTab: React.FC<StudentsTabProps> = ({
  students,
  onViewStudentHistory,
}) => {
  return (
    <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
      <table className="w-full text-left text-sm border-collapse">
        <thead className="bg-[var(--muted)] text-[var(--foreground)] border-b border-[var(--border)]">
          <tr>
            <th className="p-4 font-bold">Nama Siswa</th>
            <th className="p-4 font-bold">Email</th>
            <th className="p-4 text-center font-bold">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {students.map((student) => (
            <tr key={student.id} className="hover:bg-[var(--muted)]/30 transition-colors">
              <td className="p-4 font-medium text-[var(--card-foreground)]">{student.name}</td>
              <td className="p-4 text-[var(--muted-foreground)]">{student.email}</td>
              <td className="p-4 text-center">
                <button
                  onClick={() => onViewStudentHistory(student)}
                  className="inline-flex items-center gap-1.5 text-xs text-[var(--primary)] border border-[var(--primary)]/20 px-3 py-1.5 rounded-lg hover:bg-[var(--primary)]/5 font-semibold cursor-pointer"
                >
                  <History size={14} /> Riwayat Ujian
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
