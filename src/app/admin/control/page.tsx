"use client";

import React from "react";
import { RefreshCw, Cog, ListFilter, Loader2 } from "lucide-react";
import { useControlViewModel } from "./ControlViewModel";
import { GenerationJobSection } from "./GenerationJobSection";
import { TaskQueueSection } from "./TaskQueueSection";

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({
  title,
  subtitle,
  count,
  icon: Icon,
  iconColor,
}: {
  title: string;
  subtitle: string;
  count: number;
  icon: React.ElementType;
  iconColor: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div
        className="p-2.5 rounded-xl"
        style={{ background: `${iconColor}20`, color: iconColor }}
      >
        <Icon size={20} />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            {title}
          </h2>
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--muted)] text-[var(--muted-foreground)]">
            {count}
          </span>
        </div>
        <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

// ─── Loading / Error States ───────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-20 gap-3 text-[var(--muted-foreground)]">
      <Loader2 size={24} className="animate-spin" />
      <span className="text-sm">Memuat data...</span>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <p className="text-sm text-red-400">Gagal memuat data: {message}</p>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm hover:opacity-90 transition-opacity"
      >
        <RefreshCw size={14} /> Coba lagi
      </button>
    </div>
  );
}

// ─── Stats Summary Bar ────────────────────────────────────────────────────────

function SummaryPill({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-lg"
      style={{ background: `${color}15` }}
    >
      <div className="w-2 h-2 rounded-full" style={{ background: color }} />
      <span className="text-xs text-[var(--muted-foreground)]">{label}</span>
      <span className="text-sm font-bold" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ControlPage() {
  const { data, loading, error, retryJob, retryTask, isRetrying, refresh } =
    useControlViewModel();

  const failedJobs = data?.generationJobs.filter((j) => j.status === "FAILED").length ?? 0;
  const failedTasks = data?.taskQueueItems.filter((t) => t.status === "failed").length ?? 0;

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            Control Center
          </h1>
          <p className="text-[var(--muted-foreground)] mt-1 text-sm">
            Monitor dan kelola semua job generasi buku serta antrian tugas AI.
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm text-[var(--foreground)] hover:bg-[var(--muted)] disabled:opacity-50 transition-all"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Quick Summary */}
      {data && (
        <div className="flex flex-wrap gap-3">
          <SummaryPill
            label="Total Generation Jobs"
            value={data.generationJobs.length}
            color="#6366f1"
          />
          <SummaryPill
            label="Jobs Gagal"
            value={failedJobs}
            color="#ef4444"
          />
          <SummaryPill
            label="Total Task Queue"
            value={data.taskQueueItems.length}
            color="#ec4899"
          />
          <SummaryPill
            label="Tasks Gagal"
            value={failedTasks}
            color="#f97316"
          />
        </div>
      )}

      {/* Content */}
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : (
        <>
          {/* ── Generation Jobs ── */}
          <div className="space-y-0">
            <SectionHeader
              title="Generation Jobs"
              subtitle="Pipeline pemrosesan buku: PDF → Gambar → Soal"
              count={data?.generationJobs.length ?? 0}
              icon={Cog}
              iconColor="#6366f1"
            />
            <GenerationJobSection
              jobs={data?.generationJobs ?? []}
              onRetry={retryJob}
              isRetrying={(id) => isRetrying("generation_job", id)}
            />
          </div>

          {/* Divider */}
          <div className="border-t border-[var(--border)]" />

          {/* ── Task Queue ── */}
          <div className="space-y-0">
            <SectionHeader
              title="Task Queue"
              subtitle="Antrian tugas AI: laporan siswa, ekstraksi kurikulum, dan soal"
              count={data?.taskQueueItems.length ?? 0}
              icon={ListFilter}
              iconColor="#ec4899"
            />
            <TaskQueueSection
              tasks={data?.taskQueueItems ?? []}
              onRetry={retryTask}
              isRetrying={(id) => isRetrying("task_queue", id)}
            />
          </div>
        </>
      )}
    </div>
  );
}
