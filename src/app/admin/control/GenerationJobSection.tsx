"use client";

import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { RefreshCw, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { GenerationJobItem } from "./ControlViewModel";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_ORDER = [
  "PENDING",
  "PROCESSING_PDF",
  "EXTRACTING_IMAGES",
  "WAITING_EXTRACTION_VALIDATION",
  "CAPTIONING_IMAGES",
  "WAITING_CAPTION_VALIDATION",
  "GENERATING_QUESTIONS",
  "DONE",
  "FAILED",
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  PROCESSING_PDF: "#3b82f6",
  EXTRACTING_IMAGES: "#8b5cf6",
  WAITING_EXTRACTION_VALIDATION: "#06b6d4",
  CAPTIONING_IMAGES: "#ec4899",
  WAITING_CAPTION_VALIDATION: "#f97316",
  GENERATING_QUESTIONS: "#10b981",
  DONE: "#22c55e",
  FAILED: "#ef4444",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Menunggu",
  PROCESSING_PDF: "Proses PDF",
  EXTRACTING_IMAGES: "Ekstrak Gambar",
  WAITING_EXTRACTION_VALIDATION: "Validasi Ekstraksi",
  CAPTIONING_IMAGES: "Captioning",
  WAITING_CAPTION_VALIDATION: "Validasi Caption",
  GENERATING_QUESTIONS: "Generate Soal",
  DONE: "Selesai",
  FAILED: "Gagal",
};

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? "#94a3b8";
  const label = STATUS_LABELS[status] ?? status;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: `${color}22`, color }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: color }}
      />
      {label}
    </span>
  );
}

// ─── Status Chart ─────────────────────────────────────────────────────────────

function JobStatusChart({ jobs }: { jobs: GenerationJobItem[] }) {
  const countMap: Record<string, number> = {};
  for (const job of jobs) {
    countMap[job.status] = (countMap[job.status] ?? 0) + 1;
  }
  const chartData = STATUS_ORDER.filter((s) => countMap[s] !== undefined).map(
    (s) => ({ status: STATUS_LABELS[s] ?? s, count: countMap[s], key: s }),
  );

  if (chartData.length === 0) return null;

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 mb-6">
      <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">
        Ringkasan Status
      </h3>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={chartData} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="status"
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.4 }}
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              fontSize: "12px",
            }}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={40}>
            {chartData.map((entry) => (
              <Cell
                key={entry.key}
                fill={STATUS_COLORS[entry.key] ?? "#94a3b8"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Error Expander ───────────────────────────────────────────────────────────

function ErrorExpander({ message }: { message: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-xs text-[var(--error,#ef4444)] hover:opacity-80 transition-opacity"
      >
        <AlertTriangle size={12} />
        Lihat Error
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {open && (
        <div className="mt-1 p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 font-mono whitespace-pre-wrap break-all max-h-32 overflow-y-auto">
          {message}
        </div>
      )}
    </div>
  );
}

// ─── Table Row ────────────────────────────────────────────────────────────────

function JobRow({
  job,
  onRetry,
  isRetrying,
}: {
  job: GenerationJobItem;
  onRetry: (id: number) => void;
  isRetrying: boolean;
}) {
  const isFailed = job.status === "FAILED";
  const createdAt = new Date(job.createdAt);
  const formattedDate = `${createdAt.toLocaleDateString("id-ID")} ${createdAt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`;

  return (
    <tr
      className={`border-b border-[var(--border)] transition-colors ${
        isFailed ? "bg-red-500/5 hover:bg-red-500/10" : "hover:bg-[var(--muted)]/50"
      }`}
    >
      {/* ID */}
      <td className="px-4 py-3 text-xs text-[var(--muted-foreground)] font-mono whitespace-nowrap">
        #{job.id}
      </td>
      {/* Book */}
      <td className="px-4 py-3">
        <p className="text-sm font-medium text-[var(--foreground)] leading-tight line-clamp-1">
          {job.bukuJudul}
        </p>
        <p className="text-xs text-[var(--muted-foreground)] mt-0.5 line-clamp-1">
          {job.fileName}
        </p>
      </td>
      {/* Teacher */}
      <td className="px-4 py-3 text-sm text-[var(--foreground)] whitespace-nowrap">
        {job.guruName}
      </td>
      {/* Status */}
      <td className="px-4 py-3 whitespace-nowrap">
        <StatusBadge status={job.status} />
        {isFailed && job.errorMessage && (
          <ErrorExpander message={job.errorMessage} />
        )}
      </td>
      {/* Attempts */}
      <td className="px-4 py-3 text-center text-sm text-[var(--muted-foreground)]">
        {job.attempts}
      </td>
      {/* Tokens */}
      <td className="px-4 py-3 text-center text-xs text-[var(--muted-foreground)]">
        {job.tokensSpent.toLocaleString()}
      </td>
      {/* Date */}
      <td className="px-4 py-3 text-xs text-[var(--muted-foreground)] whitespace-nowrap">
        {formattedDate}
      </td>
      {/* Action */}
      <td className="px-4 py-3 whitespace-nowrap">
        {isFailed && (
          <button
            onClick={() => onRetry(job.id)}
            disabled={isRetrying}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <RefreshCw size={12} className={isRetrying ? "animate-spin" : ""} />
            {isRetrying ? "Memproses..." : "Retry"}
          </button>
        )}
      </td>
    </tr>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

interface GenerationJobSectionProps {
  jobs: GenerationJobItem[];
  onRetry: (id: number) => void;
  isRetrying: (id: number) => boolean;
}

export function GenerationJobSection({
  jobs,
  onRetry,
  isRetrying,
}: GenerationJobSectionProps) {
  const [filter, setFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  const statuses = ["ALL", ...STATUS_ORDER.filter((s) =>
    jobs.some((j) => j.status === s),
  )];

  const filtered = jobs.filter((j) => {
    const matchStatus = filter === "ALL" || j.status === filter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      j.bukuJudul.toLowerCase().includes(q) ||
      j.guruName.toLowerCase().includes(q) ||
      j.fileName.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  return (
    <section>
      <JobStatusChart jobs={jobs} />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          type="text"
          placeholder="Cari buku, guru, file..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40"
        />
        <div className="flex flex-wrap gap-2">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                filter === s
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              {s === "ALL" ? "Semua" : (STATUS_LABELS[s] ?? s)}
              {s !== "ALL" && (
                <span className="ml-1.5 opacity-70">
                  ({jobs.filter((j) => j.status === s).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]/50">
                <th className="px-4 py-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Buku</th>
                <th className="px-4 py-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Guru</th>
                <th className="px-4 py-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider text-center">Percobaan</th>
                <th className="px-4 py-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider text-center">Token</th>
                <th className="px-4 py-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Dibuat</th>
                <th className="px-4 py-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-sm text-[var(--muted-foreground)]"
                  >
                    Tidak ada data ditemukan
                  </td>
                </tr>
              ) : (
                filtered.map((job) => (
                  <JobRow
                    key={job.id}
                    job={job}
                    onRetry={onRetry}
                    isRetrying={isRetrying(job.id)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t border-[var(--border)] text-xs text-[var(--muted-foreground)]">
          Menampilkan {filtered.length} dari {jobs.length} job
        </div>
      </div>
    </section>
  );
}
