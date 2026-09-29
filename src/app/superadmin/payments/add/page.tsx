"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, CreditCard, DollarSign, Calendar, School, CheckCircle2, AlertCircle } from "lucide-react";
import { useAddPaymentViewModel } from "./AddPaymentViewModel";

export default function AddPaymentPage() {
  const {
    schools,
    selectedSchoolId,
    setSelectedSchoolId,
    selectedSchool,
    jumlahBulan,
    setJumlahBulan,
    nominal,
    setNominal,
    loading,
    submitting,
    error,
    successMsg,
    handleSubmit,
  } = useAddPaymentViewModel();

  if (loading) {
    return (
      <div className="p-12 text-center text-[var(--muted-foreground)]">
        Memuat data sekolah...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 px-4 md:px-0 font-sans pb-12">
      <div className="flex items-center justify-between">
        <Link
          href="/superadmin/dashboard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition"
        >
          <ArrowLeft size={16} /> Kembali ke Dashboard
        </Link>
      </div>

      <div className="bg-[var(--card)] p-6 md:p-8 rounded-2xl border border-[var(--border)] shadow-md space-y-6">
        <div className="flex items-center gap-3 border-b border-[var(--border)] pb-5">
          <div className="p-3 bg-[var(--primary)]/10 text-[var(--primary)] rounded-xl">
            <CreditCard size={28} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-[var(--foreground)]">
              Catat Pembayaran Sekolah
            </h1>
            <p className="text-xs md:text-sm text-[var(--muted-foreground)] mt-0.5">
              Tambah transaksi pembayaran dan secara otomatis perpanjang tanggal aktif sekolah.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
            <AlertCircle size={18} /> {error}
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2">
            <CheckCircle2 size={18} /> {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-[var(--foreground)] mb-1.5 flex items-center gap-2">
              <School size={16} className="text-[var(--primary)]" /> Pilih Sekolah <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedSchoolId}
              onChange={(e) => setSelectedSchoolId(e.target.value)}
              className="w-full p-3 border border-[var(--border)] rounded-xl bg-[var(--background)] text-[var(--foreground)] text-sm font-medium focus:ring-2 focus:ring-[var(--primary)]"
              required
            >
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.paymentStatus === "ACTIVE" ? "Aktif" : "Past Due"})
                </option>
              ))}
            </select>
            {selectedSchool && (
              <p className="text-xs text-[var(--muted-foreground)] mt-1.5">
                Aktif Sampai Saat Ini:{" "}
                <span className="font-bold text-[var(--foreground)]">
                  {selectedSchool.aktifSampai
                    ? new Date(selectedSchool.aktifSampai).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "Belum Diatur"}
                </span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-[var(--foreground)] mb-1.5 flex items-center gap-2">
                <Calendar size={16} className="text-[var(--primary)]" /> Durasi Pembayaran (Bulan) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={jumlahBulan}
                onChange={(e) => setJumlahBulan(Number(e.target.value))}
                className="w-full p-3 border border-[var(--border)] rounded-xl bg-[var(--background)] text-[var(--foreground)] text-sm font-semibold"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[var(--foreground)] mb-1.5 flex items-center gap-2">
                <DollarSign size={16} className="text-[var(--primary)]" /> Nominal Pembayaran (Rp)
              </label>
              <input
                type="number"
                min="0"
                value={nominal}
                onChange={(e) => setNominal(Number(e.target.value))}
                placeholder="1000000"
                className="w-full p-3 border border-[var(--border)] rounded-xl bg-[var(--background)] text-[var(--foreground)] text-sm font-semibold"
              />
            </div>
          </div>

          <div className="border-t border-[var(--border)] pt-5 flex justify-end gap-3">
            <Link
              href="/superadmin/dashboard"
              className="px-5 py-2.5 text-sm font-semibold text-[var(--foreground)] bg-[var(--muted)] rounded-xl hover:bg-opacity-80 transition"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 text-sm font-bold text-white bg-[var(--primary)] rounded-xl hover:opacity-90 transition disabled:opacity-50 shadow-md"
            >
              {submitting ? "Menyimpan Transaksi..." : "Simpan Pembayaran"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
