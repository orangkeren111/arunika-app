"use client";

import React, { use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  School,
  Users,
  GraduationCap,
  BookOpen,
  Cpu,
  Power,
  Search,
  ShieldCheck,
  ShieldAlert,
  Activity,
  Zap,
  Clock,
  Layers,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell,
} from "recharts";
import { useSchoolDetailViewModel } from "./SchoolDetailViewModel";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  PROCESSING_PDF: "#3b82f6",
  EXTRACTING_IMAGES: "#6366f1",
  WAITING_EXTRACTION_VALIDATION: "#8b5cf6",
  CAPTIONING_IMAGES: "#ec4899",
  WAITING_CAPTION_VALIDATION: "#d946ef",
  GENERATING_QUESTIONS: "#06b6d4",
  DONE: "#10b981",
  FAILED: "#ef4444",
  pending: "#f59e0b",
  processing: "#3b82f6",
  completed: "#10b981",
  failed: "#ef4444",
};

export default function SchoolDetailPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  const params = use(paramsPromise);
  const sekolahId = params.id;

  const {
    data,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    roleFilter,
    setRoleFilter,
    filteredMembers,
    handleToggleStatus,
    refresh,
  } = useSchoolDetailViewModel(sekolahId);

  if (loading) {
    return (
      <div className="p-12 text-center text-[var(--muted-foreground)] flex flex-col items-center gap-3">
        <RefreshCw size={24} className="animate-spin text-[var(--primary)]" />
        <p className="text-sm font-medium">Memuat detail & statistik sekolah...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-red-500 font-semibold">{error || "Data sekolah tidak ditemukan."}</p>
        <Link
          href="/superadmin/dashboard"
          className="inline-flex items-center gap-2 text-sm text-[var(--primary)] underline font-medium"
        >
          <ArrowLeft size={16} /> Kembali ke Dashboard
        </Link>
      </div>
    );
  }

  const { school, counts, tokens, genJobStatus, taskQueueStatus, activityHistory } = data;

  return (
    <div className="space-y-8 px-4 md:px-0 font-sans pb-12">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/superadmin/dashboard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition"
        >
          <ArrowLeft size={16} /> Kembali ke Dashboard
        </Link>

        <button
          onClick={refresh}
          className="flex items-center gap-1.5 text-xs font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)] bg-[var(--muted)]/50 px-3 py-1.5 rounded-lg transition"
        >
          <RefreshCw size={14} /> Refresh Data
        </button>
      </div>

      {/* Main School Info Header Banner */}
      <div
        className={`p-6 rounded-2xl border transition shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 ${
          school.isRetired
            ? "bg-red-500/10 border-red-300 dark:border-red-900/50"
            : "bg-[var(--card)] border-[var(--border)]"
        }`}
      >
        <div className="flex items-start gap-4">
          <div
            className={`p-4 rounded-xl ${
              school.isRetired
                ? "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400"
                : "bg-[var(--primary)]/10 text-[var(--primary)]"
            }`}
          >
            <School size={36} />
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--foreground)] tracking-tight">
                {school.name}
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                  school.isRetired
                    ? "bg-red-100 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-800"
                    : "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
                }`}
              >
                {school.isRetired ? <ShieldAlert size={14} /> : <ShieldCheck size={14} />}
                {school.isRetired ? "Status: Nonaktif" : "Status: Aktif"}
              </span>
            </div>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              {school.address || "Tidak ada alamat lengkap tercatat."}
            </p>
          </div>
        </div>

        {/* Toggle Power Switch Button */}
        <button
          onClick={handleToggleStatus}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm shadow transition ${
            school.isRetired
              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
              : "bg-red-600 hover:bg-red-700 text-white"
          }`}
        >
          <Power size={18} />
          {school.isRetired ? "Aktifkan Sekolah" : "Nonaktifkan Sekolah"}
        </button>
      </div>

      {/* Token Consumption Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[var(--card)] p-5 rounded-xl border border-[var(--border)] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-[var(--muted-foreground)] tracking-wider">
              Token Minggu Ini
            </span>
            <Clock size={20} className="text-blue-500" />
          </div>
          <p className="text-2xl font-black text-[var(--foreground)] mt-2">
            {tokens.thisWeek.toLocaleString("id-ID")}
          </p>
          <p className="text-[11px] text-[var(--muted-foreground)] mt-1">7 Hari Terakhir</p>
        </div>

        <div className="bg-[var(--card)] p-5 rounded-xl border border-[var(--border)] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-[var(--muted-foreground)] tracking-wider">
              Token Bulan Ini
            </span>
            <Zap size={20} className="text-amber-500" />
          </div>
          <p className="text-2xl font-black text-[var(--foreground)] mt-2">
            {tokens.thisMonth.toLocaleString("id-ID")}
          </p>
          <p className="text-[11px] text-[var(--muted-foreground)] mt-1">30 Hari Terakhir</p>
        </div>

        <div className="bg-[var(--card)] p-5 rounded-xl border border-[var(--border)] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-[var(--muted-foreground)] tracking-wider">
              Total Token Kumulatif
            </span>
            <Cpu size={20} className="text-[var(--primary)]" />
          </div>
          <p className="text-2xl font-black text-[var(--primary)] mt-2">
            {tokens.allTime.toLocaleString("id-ID")}
          </p>
          <p className="text-[11px] text-[var(--muted-foreground)] mt-1">Semua Pemakaian</p>
        </div>
      </div>

      {/* Summary Stat Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[var(--card)] p-4 rounded-xl border border-[var(--border)] text-center">
          <p className="text-xl font-bold text-[var(--foreground)]">{counts.teachersCount}</p>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Guru Terdaftar</p>
        </div>
        <div className="bg-[var(--card)] p-4 rounded-xl border border-[var(--border)] text-center">
          <p className="text-xl font-bold text-[var(--foreground)]">{counts.studentsCount}</p>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Siswa Terdaftar</p>
        </div>
        <div className="bg-[var(--card)] p-4 rounded-xl border border-[var(--border)] text-center">
          <p className="text-xl font-bold text-[var(--foreground)]">{counts.classesCount}</p>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Total Kelas</p>
        </div>
        <div className="bg-[var(--card)] p-4 rounded-xl border border-[var(--border)] text-center">
          <p className="text-xl font-bold text-[var(--foreground)]">{counts.genJobsCount}</p>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Job Generasi Buku</p>
        </div>
      </div>

      {/* Section: Usage & Activity Charts */}
      <div className="space-y-6">
        <h2 className="text-xl font-extrabold text-[var(--foreground)] tracking-tight flex items-center gap-2">
          <Activity size={20} className="text-[var(--primary)]" /> Grafik Aktivitas AI & Tugas
        </h2>

        {/* Chart 1: 14 Days Activity Trend */}
        <div className="bg-[var(--card)] p-6 rounded-xl border border-[var(--border)] shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-[var(--foreground)]">
              Tren Pemakaian Token (14 Hari Terakhir)
            </h3>
            <p className="text-xs text-[var(--muted-foreground)]">
              Jumlah token AI yang dikonsumsi dari pembuatan soal dan tugas background.
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityHistory}>
                <defs>
                  <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    borderColor: "var(--border)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="tokens"
                  name="Token Terpakai"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorTokens)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grid Charts: GenerationJob vs TaskQueue breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* GenerationJob Breakdown */}
          <div className="bg-[var(--card)] p-6 rounded-xl border border-[var(--border)] shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-[var(--foreground)]">
                Status Generation Job (Buku)
              </h3>
              <p className="text-xs text-[var(--muted-foreground)]">
                Distribusi status proses pembuatan soal dari PDF/buku.
              </p>
            </div>

            {genJobStatus.length === 0 ? (
              <p className="text-center text-sm text-[var(--muted-foreground)] py-8">
                Belum ada data job pembuatan buku.
              </p>
            ) : (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={genJobStatus} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="status" type="category" tick={{ fontSize: 10 }} width={120} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        borderColor: "var(--border)",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="count" name="Jumlah" radius={[0, 4, 4, 0]}>
                      {genJobStatus.map((entry: any, index: number) => (
                        <Cell
                          key={`cell-gen-${index}`}
                          fill={STATUS_COLORS[entry.status] || "var(--primary)"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* TaskQueue Breakdown */}
          <div className="bg-[var(--card)] p-6 rounded-xl border border-[var(--border)] shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-[var(--foreground)]">
                Status Task Queue (Background)
              </h3>
              <p className="text-xs text-[var(--muted-foreground)]">
                Distribusi status antrean background task (evaluasi & laporan).
              </p>
            </div>

            {taskQueueStatus.length === 0 ? (
              <p className="text-center text-sm text-[var(--muted-foreground)] py-8">
                Belum ada data antrean background task.
              </p>
            ) : (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={taskQueueStatus} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="status" type="category" tick={{ fontSize: 10 }} width={90} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        borderColor: "var(--border)",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="count" name="Jumlah" radius={[0, 4, 4, 0]}>
                      {taskQueueStatus.map((entry: any, index: number) => (
                        <Cell
                          key={`cell-task-${index}`}
                          fill={STATUS_COLORS[entry.status] || "var(--primary)"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment History Card */}
      <div className="bg-[var(--card)] p-6 rounded-2xl border border-[var(--border)] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-[var(--foreground)] tracking-tight flex items-center gap-2">
              <Zap size={20} className="text-emerald-500" /> Riwayat Pembayaran Langganan
            </h2>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              Status Aktif Sampai:{" "}
              <span className="font-bold text-[var(--foreground)]">
                {school.aktifSampai
                  ? new Date(school.aktifSampai).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "Belum Diatur"}
              </span>
            </p>
          </div>
          <Link
            href="/superadmin/payments/add"
            className="text-xs font-bold bg-[var(--primary)] text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition shadow-sm"
          >
            + Tambah Pembayaran
          </Link>
        </div>

        {!data.pembayaranHistory || data.pembayaranHistory.length === 0 ? (
          <p className="text-center text-sm text-[var(--muted-foreground)] py-6">
            Belum ada transaksi pembayaran tercatat untuk sekolah ini.
          </p>
        ) : (
          <div className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--background)]">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-[var(--muted)] text-[var(--foreground)] border-b border-[var(--border)]">
                <tr>
                  <th className="p-3.5 font-bold">ID Transaksi</th>
                  <th className="p-3.5 font-bold">Tanggal Pembayaran</th>
                  <th className="p-3.5 font-bold">Durasi Langganan</th>
                  <th className="p-3.5 font-bold">Nominal Pembayaran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {data.pembayaranHistory.map((p: any) => (
                  <tr key={p.id} className="hover:bg-[var(--muted)]/20 transition-colors">
                    <td className="p-3.5 text-xs text-[var(--muted-foreground)] font-mono">#{p.id}</td>
                    <td className="p-3.5 font-medium text-[var(--foreground)]">
                      {new Date(p.tanggalBayar).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="p-3.5 font-bold text-emerald-600 dark:text-emerald-400">
                      +{p.jumlahBulan} Bulan
                    </td>
                    <td className="p-3.5 font-bold text-[var(--foreground)]">
                      {p.nominal ? `Rp ${Number(p.nominal).toLocaleString("id-ID")}` : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section: School Members Table */}
      <div className="bg-[var(--card)] p-6 rounded-xl border border-[var(--border)] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-[var(--foreground)] tracking-tight flex items-center gap-2">
              <Users size={20} className="text-[var(--primary)]" /> Daftar Anggota Sekolah
            </h2>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              Seluruh administrator, guru, dan siswa yang terdaftar pada penyewa ini.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama atau email..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>

            {/* Role Filter Pills */}
            <div className="flex gap-1 bg-[var(--muted)]/50 p-1 rounded-lg border border-[var(--border)]">
              {["ALL", "ADMIN", "GURU", "SISWA"].map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition ${
                    roleFilter === r
                      ? "bg-[var(--card)] text-[var(--primary)] shadow-sm"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {r === "ALL" ? "Semua" : r}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Members Table */}
        {filteredMembers.length === 0 ? (
          <p className="text-center text-sm text-[var(--muted-foreground)] py-8">
            Tidak ada anggota ditemukan dengan filter saat ini.
          </p>
        ) : (
          <div className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--background)]">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-[var(--muted)] text-[var(--foreground)] border-b border-[var(--border)]">
                <tr>
                  <th className="p-3.5 font-bold">ID</th>
                  <th className="p-3.5 font-bold">Nama Lengkap</th>
                  <th className="p-3.5 font-bold">Email</th>
                  <th className="p-3.5 font-bold text-center">Peran (Role)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredMembers.map((member: any) => (
                  <tr key={member.id} className="hover:bg-[var(--muted)]/20 transition-colors">
                    <td className="p-3.5 text-xs text-[var(--muted-foreground)] font-mono">
                      #{member.id}
                    </td>
                    <td className="p-3.5 font-semibold text-[var(--card-foreground)]">
                      {member.name}
                    </td>
                    <td className="p-3.5 text-xs text-[var(--muted-foreground)]">
                      {member.email}
                    </td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                          member.role === "ADMIN"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                            : member.role === "GURU"
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                            : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        }`}
                      >
                        {member.role}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
