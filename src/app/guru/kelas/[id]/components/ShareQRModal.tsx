"use client";

import React from "react";
import { X } from "lucide-react";

interface ShareQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  classNameTitle: string;
  classCode?: string | null;
  origin: string;
}

export const ShareQRModal: React.FC<ShareQRModalProps> = ({
  isOpen,
  onClose,
  classNameTitle,
  classCode,
  origin,
}) => {
  if (!isOpen || !classCode) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl max-w-sm w-full p-6 shadow-xl relative animate-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer"
        >
          <X size={20} />
        </button>
        <div className="text-center space-y-4 pt-2">
          <h3 className="text-lg font-bold text-[var(--foreground)]">Bagikan Kelas</h3>
          <p className="text-sm text-[var(--muted-foreground)]">
            Scan QR Code di bawah atau gunakan kode kelas untuk bergabung ke kelas <b>{classNameTitle}</b>.
          </p>

          <div className="bg-white p-4 rounded-xl inline-block border border-[var(--border)] mx-auto">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                `${origin}/siswa/join-kelas?code=${classCode}`
              )}`}
              alt="QR Code Kelas"
              width={200}
              height={200}
              className="mx-auto"
            />
          </div>

          <div className="bg-[var(--primary)]/5 p-3 rounded-lg border border-[var(--primary)]/10">
            <span className="text-xs text-[var(--muted-foreground)] block">Kode Kelas</span>
            <span className="text-2xl font-black tracking-widest text-[var(--primary)] block uppercase select-all">
              {classCode}
            </span>
          </div>

          <p className="text-[10px] text-[var(--muted-foreground)] break-all">
            Link: {origin}/siswa/join-kelas?code={classCode}
          </p>
        </div>
      </div>
    </div>
  );
};
