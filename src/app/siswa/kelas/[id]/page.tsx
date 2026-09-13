"use client";

import React, { use } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ArrowLeft, CalendarClock, Play, FileText } from 'lucide-react';
import { useKelasDetail } from './SiswaKelasDetailViewModel';

export default function KelasDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { data: session } = useSession();
  const studentId = session?.user?.id ? Number(session.user.id) : undefined;
  const { kelas, exams } = useKelasDetail(resolvedParams.id, studentId);

  if (!kelas) return <p className="text-[var(--muted-foreground)]">Memuat data kelas...</p>;

  return (
    <div className="space-y-6">
      <Link href="/siswa/kelas" className="inline-flex items-center gap-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition mb-2">
        <ArrowLeft size={16} /> Kembali ke Daftar Kelas
      </Link>

      <div className="bg-[var(--card)] p-6 rounded-xl border border-[var(--border)] shadow-sm">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">{kelas.name}</h1>
        <p className="text-[var(--muted-foreground)] mt-1">Pengajar: {kelas.teacherName}</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2 mt-6">
          <CalendarClock className="text-[var(--primary)]" size={20} /> Ujian untuk kelas ini
        </h2>
        {exams.length === 0 ? (
          <p className="text-[var(--muted-foreground)]">Belum ada jadwal ujian.</p>
        ) : (
          exams.map(exam => (
            <div key={exam.jadwalId} className="bg-[var(--card)] p-4 rounded-xl border border-[var(--border)] flex justify-between items-center">
              <div>
                <p className="font-medium text-[var(--card-foreground)]">{exam.title}</p>
                <p className="text-xs text-[var(--muted-foreground)]">{exam.startTime} • {exam.durationMinutes} Menit</p>
              </div>
              <div className="flex items-center gap-2">
                {exam.isFinished ? (
                  <>
                    {exam.attemptId && (
                      <Link href={`/siswa/history/${exam.attemptId}`} className="text-xs md:text-sm bg-[#6B8E23] text-white px-3 py-2 rounded flex items-center gap-1 hover:opacity-90 transition font-bold">
                        <FileText size={14} /> Lihat Laporan
                      </Link>
                    )}
                    <Link
                      href={`/siswa/ujian/${exam.jadwalId}/quiz/play${exam.sessionId ? `?sessionId=${exam.sessionId}` : ''}`}
                      className="text-xs md:text-sm bg-[#8B5A2B] text-white px-3 py-2 rounded flex items-center gap-1 hover:opacity-90 transition font-bold"
                    >
                      <Play size={14} /> Play Quiz
                    </Link>
                  </>
                ) : (
                  <Link href={`/siswa/ujian/${exam.jadwalId}/lobby`} className="text-xs md:text-sm bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 rounded flex items-center gap-1 hover:opacity-90 transition font-bold">
                    <Play size={14} /> Mulai Ujian
                  </Link>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
