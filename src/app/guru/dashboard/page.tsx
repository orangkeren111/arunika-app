"use client";

import React from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FilePenLine,
  Image as ImageIcon,
  UsersRound,
} from "lucide-react";
import { useGuruDashboard } from "./GuruDashboardViewModel";

const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  icon: any;
  color: string;
}) => (

  <div className="bg-[var(--card)] p-5 rounded-2xl border border-[var(--border)] flex items-center gap-4 shadow-sm">
    <div
      className="p-3 rounded-xl shrink-0"
      style={{ backgroundColor: `${color}20`, color }}
    >
      <Icon size={22} />
    </div>

    <div className="min-w-0">
      <p className="text-[var(--muted-foreground)] text-sm font-medium">
        {title}
      </p>
      <h3 className="text-2xl font-bold text-[var(--card-foreground)] mt-1">
        {value}
      </h3>
    </div>

  </div>
);

const formatTime = (date: string | Date) =>
  new Date(date).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

const getGreeting = () => {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) return "Selamat Pagi";
  if (hour >= 12 && hour < 17) return "Selamat Siang";
  return "Selamat Malam";
};

export default function GuruDashboardPage() {
  const {
    stats,
    validationBooks,
    todayExams,
    recentClasses,
    currentUser,
    loading,
  } = useGuruDashboard();

  const greeting = getGreeting();

  if (loading) {
    return (<div className="space-y-6 animate-pulse"> <div className="space-y-2"> <div className="h-8 w-64 rounded-lg bg-[var(--muted)]" /> <div className="h-4 w-96 max-w-full rounded bg-[var(--muted)]" /> </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-24 rounded-2xl bg-[var(--muted)]"
          />
        ))}
      </div>

      <div className="h-64 rounded-2xl bg-[var(--muted)]" />
    </div>
    );

  }

  const actionCount =
    (validationBooks?.length || 0) + (stats?.pendingEssays || 0);

  return (<div className="space-y-6 pb-8">
    {/* HEADER */} <header> <p className="text-sm font-medium text-[var(--primary)] mb-1">
      Dashboard Guru </p>

      < h1 className="text-2xl md:text-3xl font-bold text-[var(--foreground)]" >
        {greeting}, {currentUser?.name || "Guru"
        } 👋
      </h1 >

      <p className="text-sm md:text-base text-[var(--muted-foreground)] mt-2">
        Berikut hal-hal yang perlu Anda perhatikan hari ini.
      </p>
    </header >

    {/* QUICK STATS */}
    < section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4" >
      <StatCard
        title="Ujian Hari Ini"
        value={stats?.activeExams || 0}
        icon={CalendarClock}
        color="var(--primary)"
      />

      <StatCard
        title="Essay Menunggu Koreksi"
        value={stats?.pendingEssays || 0}
        icon={FilePenLine}
        color="var(--warning)"
      />

      <StatCard
        title="Kelas Aktif"
        value={stats?.recentClasses || 0}
        icon={UsersRound}
        color="var(--info)"
      />
    </section >

    {/* ACTION CENTER */}
    {
      actionCount > 0 ? (
        <section className="rounded-2xl border border-amber-500/30 bg-amber-500/10 overflow-hidden">
          <div className="p-5 md:p-6 border-b border-amber-500/20">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-600 shrink-0">
                <AlertCircle size={22} />
              </div>

              <div className="min-w-0">
                <h2 className="text-lg font-bold text-amber-700 dark:text-amber-400">
                  Perlu Perhatian
                </h2>

                <p className="text-sm text-amber-700/80 dark:text-amber-300/80 mt-1">
                  {actionCount} hal membutuhkan tindakan Anda.
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-amber-500/20">
            {/* BOOK VALIDATION */}
            {validationBooks?.map((buku: any) => {
              const isStage1 =
                buku.jobStatus === "WAITING_EXTRACTION_VALIDATION";

              const href = isStage1
                ? `/guru/buku/${buku.id}/validate-extraction`
                : `/guru/buku/${buku.id}/validate-captions`;

              return (
                <Link
                  key={buku.id}
                  href={href}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:bg-amber-500/10 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-xl bg-[var(--card)] text-[var(--primary)] shrink-0">
                      <BookOpen size={20} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-[var(--foreground)] truncate">
                          {buku.title}
                        </h3>

                        <span className="text-[10px] sm:text-xs px-2 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold whitespace-nowrap">
                          {isStage1
                            ? "Validasi Extraction"
                            : "Validasi Caption"}
                        </span>
                      </div>

                      <p className="text-xs text-[var(--muted-foreground)] mt-1">
                        {buku.chapterCount} Bab • {buku.imageCount} Gambar
                      </p>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)] shrink-0">
                    {isStage1 ? "Validasi Buku" : "Review Caption"}
                    <ArrowRight size={16} />
                  </div>
                </Link>
              );
            })}

            {/* ESSAY */}
            {(stats?.pendingEssays || 0) > 0 && (
              <Link
                href="/guru/essay"
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:bg-amber-500/10 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[var(--card)] text-[var(--warning)] shrink-0">
                    <FilePenLine size={20} />
                  </div>

                  <div>
                    <h3 className="font-semibold text-[var(--foreground)]">
                      {stats?.pendingEssays || 0} Essay Menunggu Koreksi
                    </h3>

                    <p className="text-xs text-[var(--muted-foreground)] mt-1">
                      Jawaban siswa belum mendapatkan nilai.
                    </p>
                  </div>
                </div>

                <div className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
                  Mulai Koreksi
                  <ArrowRight size={16} />
                </div>
              </Link>
            )}
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 md:p-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[var(--success)]/15 text-[var(--success)]">
              <CheckCircle2 size={22} />
            </div>

            <div>
              <h2 className="font-bold text-[var(--card-foreground)]">
                Semua beres!
              </h2>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">
                Tidak ada tugas yang membutuhkan perhatian Anda saat ini.
              </p>
            </div>
          </div>
        </section>
      )
    }

    {/* TODAY'S EXAMS */}
    <section className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
      <div className="p-5 md:p-6 border-b border-[var(--border)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-[var(--card-foreground)]">
              Ujian Hari Ini
            </h2>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Ujian yang sedang berlangsung atau dijadwalkan hari ini.
            </p>
          </div>

          <CalendarClock
            size={22}
            className="text-[var(--primary)] shrink-0"
          />
        </div>
      </div>

      {todayExams?.length > 0 ? (
        <div className="divide-y divide-[var(--border)]">
          {todayExams.map((exam: any) => (
            <Link
              key={exam.id}
              href={`/guru/kelas/${exam.kelasId}`}
              className="block p-5 hover:bg-[var(--muted)]/50 transition"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-[var(--muted)] text-[var(--primary)] shrink-0">
                    <Clock3 size={20} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-[var(--card-foreground)]">
                        {exam.ujianName}
                      </h3>

                      <span
                        className={`text-[10px] sm:text-xs px-2 py-1 rounded-full font-semibold ${exam.status === "ONGOING"
                          ? "bg-[var(--success)]/15 text-[var(--success)]"
                          : "bg-[var(--primary)]/15 text-[var(--primary)]"
                          }`}
                      >
                        {exam.status === "ONGOING"
                          ? "Sedang Berlangsung"
                          : "Terjadwal"}
                      </span>
                    </div>

                    <p className="text-sm text-[var(--muted-foreground)] mt-1">
                      {exam.kelasName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between lg:justify-end gap-5 shrink-0">
                  <div className="text-left lg:text-right">
                    <p className="text-sm font-semibold text-[var(--card-foreground)]">
                      {formatTime(exam.startTime)} -{" "}
                      {formatTime(exam.endTime)}
                    </p>

                    <p className="text-xs text-[var(--muted-foreground)] mt-1">
                      {exam.studentCount} siswa
                    </p>
                  </div>

                  <ArrowRight
                    size={18}
                    className="text-[var(--muted-foreground)]"
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center">
          <CalendarClock
            size={32}
            className="mx-auto text-[var(--muted-foreground)] mb-3"
          />

          <p className="font-medium text-[var(--card-foreground)]">
            Tidak ada ujian hari ini
          </p>

          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Jadwal ujian Anda akan muncul di sini.
          </p>
        </div>
      )}
    </section>

    {/* RECENT CLASSES */}
    <section className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
      <div className="p-5 md:p-6 border-b border-[var(--border)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-[var(--card-foreground)]">
              Kelas Aktif
            </h2>

            <Link href={"/guru/kelas"} className="text-sm text-[var(--muted-foreground)] mt-1 hover:text-[var(--primary)] transition">
              {"Tekan untuk membuka list Kelas >>"}
            </Link>
          </div>

          <UsersRound
            size={22}
            className="text-[var(--info)] shrink-0"
          />
        </div>
      </div>

      {recentClasses?.length > 0 ? (
        <div className="divide-y divide-[var(--border)]">
          {recentClasses.map((kelas: any) => (
            <Link
              key={kelas.id}
              href={`/guru/kelas/${kelas.id}`}
              className="flex items-center justify-between gap-4 p-5 hover:bg-[var(--muted)]/50 transition"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 rounded-xl bg-[var(--muted)] text-[var(--info)] shrink-0">
                  <UsersRound size={19} />
                </div>

                <div className="min-w-0">
                  <h3 className="font-semibold text-[var(--card-foreground)] truncate">
                    {kelas.name}
                  </h3>

                  <p className="text-xs text-[var(--muted-foreground)] mt-1">
                    {kelas.studentCount} siswa • {kelas.updatedLabel}
                  </p>
                </div>
              </div>

              <ArrowRight
                size={18}
                className="text-[var(--muted-foreground)] shrink-0"
              />
            </Link>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center">
          <UsersRound
            size={32}
            className="mx-auto text-[var(--muted-foreground)] mb-3"
          />

          <p className="font-medium text-[var(--card-foreground)]">
            Belum ada kelas
          </p>
        </div>
      )}
    </section>
  </div >

  );
}
