"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useJadwalViewModel } from "../GuruJadwalViewModel";

export default function CreateJadwalPage() {
  const {
    judulJadwal,
    setJudulJadwal,
    selectedTemplate,
    setSelectedTemplate,
    selectedKelas,
    setSelectedKelas,
    selectedTipe,
    setSelectedTipe,
    waktuPelaksanaan,
    setWaktuPelaksanaan,
    handleCreateJadwal,
    templateList,
    kelasList,
    tipeList,
  } = useJadwalViewModel();

  return (
    <div className="space-y-6 max-w-2xl">
      <Link
        href="/guru/jadwal"
        className="inline-flex items-center gap-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition mb-2"
      >
        <ArrowLeft size={16} /> Kembali ke Jadwal
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          Jadwalkan Ujian Baru
        </h1>
        <p className="text-[var(--muted-foreground)] mt-1">
          Tentukan nama sesi ujian, template, kelas, tipe, dan waktu pengerjaan.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleCreateJadwal();
        }}
        className="bg-[var(--card)] p-6 rounded-xl border border-[var(--border)] space-y-5"
      >
        {/* NAMA / JUDUL SESI UJIAN */}
        <div>
          <label className="block text-sm font-semibold text-[var(--foreground)] mb-1">
            Nama / Judul Sesi Ujian
          </label>
          <input
            type="text"
            value={judulJadwal}
            onChange={(e) => setJudulJadwal(e.target.value)}
            placeholder="Contoh: Kuis Harian Bab 1 Sel / PTS Biologi Semester 1"
            className="w-full p-2.5 border border-[var(--input)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--ring)] outline-none text-sm"
          />
          <p className="text-xs text-[var(--muted-foreground)] mt-1">
            Kosongkan jika ingin menggunakan judul default template.
          </p>
        </div>
        {/* TEMPLATE UJIAN */}
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
            Pilih Template Ujian
          </label>
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            className="w-full p-2 border border-[var(--input)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--ring)] outline-none"
          >
            <option value="" disabled>
              Pilih Template
            </option>
            {templateList?.map((template: any) => (
              <option key={template.id} value={template.id}>
                {template.title}
              </option>
            ))}
          </select>
        </div>

        {/* KELAS */}
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
            Pilih Kelas
          </label>
          <select
            value={selectedKelas}
            onChange={(e) => setSelectedKelas(e.target.value)}
            className="w-full p-2 border border-[var(--input)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--ring)] outline-none"
          >
            <option value="" disabled>
              Pilih Kelas
            </option>
            {kelasList?.map((kelas: any) => (
              <option key={kelas.id} value={kelas.id}>
                {kelas.name}
              </option>
            ))}
          </select>
        </div>

        {/* TIPE UJIAN */}
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
            Tipe Ujian
          </label>
          <select
            value={selectedTipe}
            onChange={(e) => setSelectedTipe(e.target.value)}
            className="w-full p-2 border border-[var(--input)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--ring)] outline-none"
          >
            <option value="" disabled>
              Pilih Tipe Ujian
            </option>
            {tipeList?.map((tipe: any) => (
              <option key={tipe.id} value={tipe.id}>
                {tipe.namaTipeUjian}
              </option>
            ))}
          </select>
        </div>

        {/* WAKTU PELAKSANAAN */}
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
            Waktu Pelaksanaan
          </label>
          <input
            type="datetime-local"
            value={waktuPelaksanaan}
            onChange={(e) => setWaktuPelaksanaan(e.target.value)}
            className="w-full p-2 border border-[var(--input)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--ring)] outline-none"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-[var(--primary)] text-[var(--primary-foreground)] py-3 rounded-lg font-medium hover:opacity-90 transition mt-4"
        >
          Tugaskan Ujian
        </button>
      </form>
    </div>
  );
}
