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
import { TaskQueueItem } from "./ControlViewModel";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_ORDER = ["pending", "processing", "completed", "failed"];

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  processing: "#3b82f6",
  completed: "#22c55e",
  failed: "#ef4444",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Menunggu",
  processing: "Diproses",
  completed: "Selesai",
  failed: "Gagal",
};

const TYPE_LABELS: Record<string, string> = {
  generate_report: "Generate Laporan",
  extract_kurikulum: "Ekstrak Kurikulum",
  generate_soal: "Generate Soal",
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
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

// ─── Status Chart ─────────────────────────────────────────────────────────────

function TaskStatusChart({ tasks }: { tasks: TaskQueueItem[] }) {
  const countMap: Record<string, number> = {};
  for (const t of tasks) {
    countMap[t.status] = (countMap[t.status] ?? 0) + 1;
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
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={chartData} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="status"
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
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
          <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={60}>
            {chartData.map((entry) => (
              <Cell key={entry.key} fill={STATUS_COLORS[entry.key] ?? "#94a3b8"} />
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

function TaskRow({
  task,
  onRetry,
  isRetrying,
}: {
  task: TaskQueueItem;
  onRetry: (id: number) => void;
  isRetrying: boolean;
}) {
  const isFailed = task.status === "failed";
  const createdAt = new Date(task.createdAt);
  const formattedDate = `${createdAt.toLocaleDateString("id-ID")} ${createdAt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`;

  return (
    <tr
      className={`border-b border-[var(--border)] transition-colors ${
        isFailed ? "bg-red-500/5 hover:bg-red-500/10" : "hover:bg-[var(--muted)]/50"
      }`}
    >
      {/* ID */}
      <td className="px-4 py-3 text-xs text-[var(--muted-foreground)] font-mono whitespace-nowrap">
        #{task.id}
      </td>
      {/* Type */}
      <td className="px-4 py-3 text-sm text-[var(--foreground)] whitespace-nowrap">
        {TYPE_LABELS[task.type] ?? task.type}
      </td>
      {/* Status */}
      <td className="px-4 py-3 whitespace-nowrap">
        <StatusBadge status={task.status} />
        {isFailed && task.errorLog && (
          <ErrorExpander message={task.errorLog} />
        )}
      </td>
      {/* Provider */}
      <td className="px-4 py-3 text-xs text-[var(--muted-foreground)] whitespace-nowrap">
        {task.provider ? (
          <span className="px-2 py-0.5 rounded bg-[var(--muted)] font-mono">
            {task.provider}
          </span>
        ) : (
          <span className="opacity-40">—</span>
        )}
      </td>
      {/* Attempts */}
      <td className="px-4 py-3 text-center text-sm text-[var(--muted-foreground)]">
        {task.attempts}
      </td>
      {/* Tokens */}
      <td className="px-4 py-3 text-center text-xs text-[var(--muted-foreground)]">
        {task.tokensSpent.toLocaleString()}
      </td>
      {/* Date */}
      <td className="px-4 py-3 text-xs text-[var(--muted-foreground)] whitespace-nowrap">
        {formattedDate}
      </td>
      {/* Action */}
      <td className="px-4 py-3 whitespace-nowrap">
        {isFailed && (
          <button
            onClick={() => onRetry(task.id)}
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

interface TaskQueueSectionProps {
  tasks: TaskQueueItem[];
  onRetry: (id: number) => void;
  isRetrying: (id: number) => boolean;
}

export function TaskQueueSection({
  tasks,
  onRetry,
  isRetrying,
}: TaskQueueSectionProps) {
  const [filter, setFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  const presentStatuses = STATUS_ORDER.filter((s) =>
    tasks.some((t) => t.status === s),
  );
  const statuses = ["ALL", ...presentStatuses];

  const filtered = tasks.filter((t) => {
    const matchStatus = filter === "ALL" || t.status === filter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      t.type.toLowerCase().includes(q) ||
      (t.provider ?? "").toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  return (
    <section>
      <TaskStatusChart tasks={tasks} />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          type="text"
          placeholder="Cari tipe, provider..."
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
                  ({tasks.filter((t) => t.status === s).length})
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
                <th className="px-4 py-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Tipe</th>
                <th className="px-4 py-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Provider</th>
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
                filtered.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onRetry={onRetry}
                    isRetrying={isRetrying(task.id)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t border-[var(--border)] text-xs text-[var(--muted-foreground)]">
          Menampilkan {filtered.length} dari {tasks.length} task
        </div>
      </div>
    </section>
  );
}
