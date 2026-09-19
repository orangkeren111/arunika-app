"use client";

import React from "react";
import { AlertTriangle, X } from "lucide-react";

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
}

export const ErrorModal: React.FC<ErrorModalProps> = ({
  isOpen,
  onClose,
  title = "Peringatan Operasi Soal",
  message,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-red-500/30 bg-[var(--card)] p-6 shadow-2xl transition-all">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-500 border border-red-500/20 shadow-inner">
            <AlertTriangle className="h-7 w-7" />
          </div>

          <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">
            {title}
          </h3>

          <p className="text-sm text-[var(--muted-foreground)] leading-relaxed mb-6">
            {message}
          </p>

          <button
            onClick={onClose}
            className="w-full rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:bg-red-700 active:scale-95"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
