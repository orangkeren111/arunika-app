"use client";

import React, { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
  Legend,
} from "recharts";
import { BookOpen, Layers, Activity, ListChecks } from "lucide-react";
import { useSession } from "next-auth/react";
import { adminRepository } from "@/src/lib/repositories/adminRepository";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardChartData {
  jobStatusCounts: { status: string; count: number }[];
  topTeachers: { teacherName: string; bookCount: number }[];
  dailyJobActivity: { date: string; count: number }[];
  taskQueueStatusCounts: { status: string; count: number }[];
}

// ─── Colour Palettes ─────────────────────────────────────────────────────────

const JOB_STATUS_COLORS: Record<string, string> = {
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

const TASK_STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  processing: "#3b82f6",
  completed: "#22c55e",
  failed: "#ef4444",
};

const TEACHER_BAR_COLOR = "#6366f1";
const AREA_GRADIENT_START = "#6366f1";
const AREA_GRADIENT_END = "#a855f7";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const statusLabel: Record<string, string> = {
  PENDING: "Menunggu",
  PROCESSING_PDF: "Proses PDF",
  EXTRACTING_IMAGES: "Ekstrak Gambar",
  WAITING_EXTRACTION_VALIDATION: "Validasi Ekstraksi",
  CAPTIONING_IMAGES: "Captioning",
  WAITING_CAPTION_VALIDATION: "Validasi Caption",
  GENERATING_QUESTIONS: "Generate Soal",
  DONE: "Selesai",
  FAILED: "Gagal",
  pending: "Menunggu",
  processing: "Diproses",
  completed: "Selesai",
  failed: "Gagal",
};

function getColor(
  map: Record<string, string>,
  key: string,
  fallback = "#94a3b8",
): string {
  return map[key] ?? fallback;
}

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}`;
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ChartSkeleton() {
  return (
    <div className="h-[220px] rounded-lg bg-[var(--muted)] animate-pulse" />
  );
}

// ─── Chart Card Wrapper ───────────────────────────────────────────────────────

function ChartCard({
  title,
  icon: Icon,
  iconColor,
  children,
  loading,
}: {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  children: React.ReactNode;
  loading: boolean;
}) {
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 shadow-sm flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div
          className="p-2 rounded-lg"
          style={{ background: `${iconColor}20`, color: iconColor }}
        >
          <Icon size={18} />
        </div>
        <h3 className="font-semibold text-[var(--foreground)] text-sm">
          {title}
        </h3>
      </div>
      {loading ? <ChartSkeleton /> : children}
    </div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function CustomPieTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const { name, value } = payload[0];
    return (
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm shadow-lg">
        <p className="font-semibold text-[var(--foreground)]">
          {statusLabel[name] ?? name}
        </p>
        <p className="text-[var(--muted-foreground)]">{value} job</p>
      </div>
    );
  }
  return null;
}

function CustomBarTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm shadow-lg">
        <p className="font-semibold text-[var(--foreground)] mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} style={{ color: p.color }}>
            {p.value} buku
          </p>
        ))}
      </div>
    );
  }
  return null;
}

function CustomAreaTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm shadow-lg">
        <p className="font-semibold text-[var(--foreground)] mb-1">{label}</p>
        <p style={{ color: AREA_GRADIENT_START }}>{payload[0]?.value ?? 0} job</p>
      </div>
    );
  }
  return null;
}

// ─── Chart 1: Job Status Donut ────────────────────────────────────────────────

function JobStatusDonut({
  data,
  loading,
}: {
  data: { status: string; count: number }[];
  loading: boolean;
}) {
  return (
    <ChartCard
      title="Distribusi Status GenerationJob"
      icon={Layers}
      iconColor="#6366f1"
      loading={loading}
    >
      <div className="flex gap-4 items-center">
        <div className="flex-1 min-w-0">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                strokeWidth={0}
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.status}
                    fill={getColor(JOB_STATUS_COLORS, entry.status)}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomPieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col gap-1.5 text-xs shrink-0 max-h-[200px] overflow-y-auto pr-1">
          {data.map((entry) => (
            <div key={entry.status} className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: getColor(JOB_STATUS_COLORS, entry.status) }}
              />
              <span className="text-[var(--muted-foreground)] truncate max-w-[120px]">
                {statusLabel[entry.status] ?? entry.status}
              </span>
              <span className="text-[var(--foreground)] font-semibold ml-auto">
                {entry.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </ChartCard>
  );
}

// ─── Chart 2: Top Teachers Bar ────────────────────────────────────────────────

function TopTeachersBar({
  data,
  loading,
}: {
  data: { teacherName: string; bookCount: number }[];
  loading: boolean;
}) {
  return (
    <ChartCard
      title="Guru Paling Produktif (Buku)"
      icon={BookOpen}
      iconColor="#10b981"
      loading={loading}
    >
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={false}
            stroke="var(--border)"
          />
          <XAxis
            type="number"
            allowDecimals={false}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="teacherName"
            width={90}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.5 }} />
          <Bar dataKey="bookCount" fill={TEACHER_BAR_COLOR} radius={[0, 4, 4, 0]} maxBarSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── Chart 3: Daily Activity Area ────────────────────────────────────────────

function DailyActivityArea({
  data,
  loading,
}: {
  data: { date: string; count: number }[];
  loading: boolean;
}) {
  // Show only every 5th date label to avoid clutter
  const tickFormatter = (val: string, idx: number) =>
    idx % 5 === 0 ? formatDate(val) : "";

  return (
    <ChartCard
      title="Aktivitas GenerationJob (30 Hari)"
      icon={Activity}
      iconColor="#f59e0b"
      loading={loading}
    >
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={AREA_GRADIENT_START} stopOpacity={0.35} />
              <stop offset="95%" stopColor={AREA_GRADIENT_END} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="date"
            tickFormatter={tickFormatter}
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
          <Tooltip content={<CustomAreaTooltip />} />
          <Area
            type="monotone"
            dataKey="count"
            stroke={AREA_GRADIENT_START}
            strokeWidth={2}
            fill="url(#areaGradient)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── Chart 4: TaskQueue Status Donut ─────────────────────────────────────────

function TaskQueueDonut({
  data,
  loading,
}: {
  data: { status: string; count: number }[];
  loading: boolean;
}) {
  return (
    <ChartCard
      title="Distribusi Status TaskQueue"
      icon={ListChecks}
      iconColor="#ec4899"
      loading={loading}
    >
      <div className="flex gap-4 items-center">
        <div className="flex-1 min-w-0">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                strokeWidth={0}
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.status}
                    fill={getColor(TASK_STATUS_COLORS, entry.status)}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomPieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col gap-2 text-xs shrink-0">
          {data.map((entry) => (
            <div key={entry.status} className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: getColor(TASK_STATUS_COLORS, entry.status) }}
              />
              <span className="text-[var(--muted-foreground)] capitalize">
                {statusLabel[entry.status] ?? entry.status}
              </span>
              <span className="text-[var(--foreground)] font-semibold ml-auto">
                {entry.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </ChartCard>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function DashboardCharts() {
  const [data, setData] = useState<DashboardChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { data: session } = useSession();
  const sekolah_id = session?.user?.sekolah_id as number;

  useEffect(() => {
    adminRepository.getDashboardChartData(sekolah_id).then(res => {
      setData(res);
      setLoading(false);
    });
  }, [sekolah_id]);

  if (error) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 text-center text-[var(--muted-foreground)] text-sm">
        Gagal memuat data grafik: {error}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <JobStatusDonut data={data?.jobStatusCounts ?? []} loading={loading} />
      <TopTeachersBar data={data?.topTeachers ?? []} loading={loading} />
      <DailyActivityArea data={data?.dailyJobActivity ?? []} loading={loading} />
      <TaskQueueDonut data={data?.taskQueueStatusCounts ?? []} loading={loading} />
    </div>
  );
}
