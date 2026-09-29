"use client";

import React from "react";
import { X } from "lucide-react";

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  judulJadwal: string;
  setJudulJadwal: (val: string) => void;
  selectedTemplate: string;
  setSelectedTemplate: (val: string) => void;
  selectedTipe: string;
  setSelectedTipe: (val: string) => void;
  waktuMulai: string;
  setWaktuMulai: (val: string) => void;
  waktuSelesai: string;
  setWaktuSelesai: (val: string) => void;
  templateList: Array<{ id: string; title: string; questionCount: number }>;
  tipeList: Array<{ id: string; namaTipeUjian: string }>;
  onSaveJadwal: () => void;
}

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  isOpen,
  onClose,
  judulJadwal,
  setJudulJadwal,
  selectedTemplate,
  setSelectedTemplate,
  selectedTipe,
  setSelectedTipe,
  waktuMulai,
  setWaktuMulai,
  waktuSelesai,
  setWaktuSelesai,
  templateList,
  tipeList,
  onSaveJadwal,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-[var(--card)] w-full max-w-md p-6 rounded-xl border border-[var(--border)] shadow-xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition cursor-pointer"
        >
          <X size={20} />
        </button>

        <h3 className="text-xl font-bold mb-6 text-[var(--foreground)]">
          Jadwalkan Ujian Baru
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[var(--foreground)] mb-1">
              Nama / Judul Sesi Ujian
            </label>
            <input
              type="text"
              value={judulJadwal}
              onChange={(e) => setJudulJadwal(e.target.value)}
              placeholder="Contoh: Kuis Harian Bab 1 Sel / PTS Biologi 1"
              className="w-full p-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] text-sm focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[var(--foreground)] mb-1">
              Pilih Template Ujian
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full p-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] text-sm focus:ring-2 focus:ring-[var(--primary)]"
            >
              <option value="">-- Pilih Template --</option>
              {templateList.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.questionCount} Soal)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[var(--foreground)] mb-1">
              Pilih Tipe Ujian
            </label>
            <select
              value={selectedTipe}
              onChange={(e) => setSelectedTipe(e.target.value)}
              className="w-full p-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] text-sm focus:ring-2 focus:ring-[var(--primary)]"
            >
              <option value="">-- Pilih Tipe --</option>
              {tipeList.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.namaTipeUjian}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[var(--foreground)] mb-1">
              Waktu Mulai Aktif
            </label>
            <input
              type="datetime-local"
              value={waktuMulai}
              onChange={(e) => setWaktuMulai(e.target.value)}
              className="w-full p-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] text-sm focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[var(--foreground)] mb-1">
              Waktu Selesai Aktif (Opsional)
            </label>
            <input
              type="datetime-local"
              value={waktuSelesai}
              onChange={(e) => setWaktuSelesai(e.target.value)}
              className="w-full p-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] text-sm focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[var(--foreground)] bg-[var(--muted)] rounded-lg hover:bg-opacity-80 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => {
                onSaveJadwal();
                onClose();
              }}
              className="px-4 py-2 text-sm font-bold text-white bg-[var(--primary)] rounded-lg hover:opacity-90 transition cursor-pointer"
            >
              Simpan Jadwal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
