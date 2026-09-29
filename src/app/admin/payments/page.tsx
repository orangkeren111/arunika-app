"use client";

import React from "react";
import { CreditCard, Calendar, RefreshCw, AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react";
import { useAdminPaymentHistoryViewModel } from "./AdminPaymentHistoryViewModel";

export default function AdminPaymentHistoryPage() {
  const { data, loading, error, refresh } = useAdminPaymentHistoryViewModel();

  if (loading) {
    return (
      <div className="p-12 text-center text-[var(--muted-foreground)] flex flex-col items-center gap-3">
        <RefreshCw size={24} className="animate-spin text-[var(--primary)]" />
        <p className="text-sm font-medium">Memuat riwayat pembayaran sekolah...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-red-500 font-semibold">{error || "Data pembayaran tidak ditemukan."}</p>
      </div>
    );
  }

  const { school, pembayaran } = data;

  return (
    <div className="space-y-6 px-4 md:px-0 font-sans pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--foreground)] tracking-tight">
            Riwayat Pembayaran Sekolah
          </h1>
          <p className="text-[var(--muted-foreground)] mt-1 text-sm md:text-base">
            Informasi status langganan dan catatan transaksi pembayaran untuk {school.namaSekolah}.
          </p>
        </div>

        <button
          onClick={refresh}
          className="flex items-center gap-1.5 text-xs font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)] bg-[var(--muted)]/50 px-3 py-2 rounded-lg transition"
        >
          <RefreshCw size={14} /> Refresh Data
        </button>
      </div>

      {/* Subscription Status Header Banner */}
      <div className="bg-[var(--card)] p-6 rounded-2xl border border-[var(--border)] shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded-xl">
            <CreditCard size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--card-foreground)]">
              Status Masa Aktif Langganan
            </h3>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              Tingkat Akses: <span className="font-bold text-[var(--foreground)]">{school.tier}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] uppercase font-bold text-[var(--muted-foreground)] tracking-wider">
              Aktif Sampai Tanggal
            </p>
            <p className="text-lg font-extrabold text-[var(--foreground)]">
              {school.aktifSampai
                ? new Date(school.aktifSampai).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "Belum Diatur"}
            </p>
          </div>

          <span
            className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
              !school.isPastDue
                ? "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
                : "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800"
            }`}
          >
            {!school.isPastDue ? (
              <>
                <CheckCircle2 size={14} /> Aktif
              </>
            ) : (
              <>
                <ShieldAlert size={14} /> Past Due
              </>
            )}
          </span>
        </div>
      </div>

      {/* Payment Records Table */}
      <div className="bg-[var(--card)] p-6 rounded-2xl border border-[var(--border)] shadow-sm space-y-4">
        <h2 className="text-xl font-extrabold text-[var(--foreground)] tracking-tight">
          Daftar Catatan Transaksi
        </h2>

        {pembayaran.length === 0 ? (
          <p className="text-center text-sm text-[var(--muted-foreground)] py-8">
            Belum ada riwayat pembayaran yang dicatat.
          </p>
        ) : (
          <div className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--background)]">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-[var(--muted)] text-[var(--foreground)] border-b border-[var(--border)]">
                <tr>
                  <th className="p-3.5 font-bold">No. Transaksi</th>
                  <th className="p-3.5 font-bold">Tanggal Bayar</th>
                  <th className="p-3.5 font-bold">Durasi Langganan</th>
                  <th className="p-3.5 font-bold">Nominal (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {pembayaran.map((p: any) => (
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
    </div>
  );
}
