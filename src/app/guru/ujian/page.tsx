"use client";

import React from "react";
import Link from "next/link";
import { Plus, Settings2 } from "lucide-react";
import { useUjianViewModel } from "./GuruUjianViewModel";

export default function UjianListPage() {
  const { templates } = useUjianViewModel();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            Template Ujian
          </h1>
          <p className="text-[var(--muted-foreground)] mt-1">
            Buat template ujian dengan merakit soal dari Bank Soal.
          </p>
        </div>
        <Link
          href={`/guru/ujian/new/builder`}
          className="flex items-center gap-2 bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 rounded-lg hover:opacity-90 transition"
        >
          <Plus size={18} /> Buat Ujian Baru
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div
            key={template.id}
            className="bg-[var(--card)] p-6 rounded-xl border border-[var(--border)] flex flex-col h-full shadow-sm"
          >
            <h3 className="text-xl font-semibold text-[var(--card-foreground)] mb-2">
              {template.title}
            </h3>
            <p className="text-sm text-[var(--muted-foreground)] mb-4">
              Total Soal: {template.questionCount}
            </p>
            {/* <p className="text-xs text-[var(--muted-foreground)] mb-6 flex-grow">Dibuat pada: {template.createdAt}</p> */}
            <Link
              href={`/guru/ujian/${template.id}/builder`}
              className="w-full bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--secondary)] hover:text-[var(--secondary-foreground)] py-2.5 rounded-lg transition font-medium flex justify-center items-center gap-2"
            >
              Ubah Komposisi Soal <Settings2 size={16} />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
