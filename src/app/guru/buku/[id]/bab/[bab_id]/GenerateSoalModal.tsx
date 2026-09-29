import React, { useState } from "react";
import { X, Loader2 } from "lucide-react";

interface GenerateSoalModalProps {
  isOpen: boolean;
  isGeneratingSoal: boolean;
  onClose: () => void;
  onGenerate: (jumlahSoal: number) => Promise<void>;
}

export const GenerateSoalModal: React.FC<GenerateSoalModalProps> = ({
  isOpen,
  isGeneratingSoal,
  onClose,
  onGenerate,
}) => {
  const [jumlahSoalGen, setJumlahSoalGen] = useState<number>(10);
  const [isSubmittingGen, setIsSubmittingGen] = useState(false);

  if (!isOpen) return null;

  const handleConfirmGenerate = async () => {
    setIsSubmittingGen(true);
    try {
      await onGenerate(jumlahSoalGen);
      onClose();
    } catch (err) {
      // Handled by viewmodel showError
    } finally {
      setIsSubmittingGen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl w-full max-w-md p-6 space-y-4 shadow-xl">
        <div className="flex justify-between items-center pb-2 border-b border-[var(--border)]">
          <h3 className="text-lg font-bold text-[var(--foreground)]">
            Generate Soal dengan AI
          </h3>
          <button
            onClick={onClose}
            className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            <X size={20} />
          </button>
        </div>

        {isGeneratingSoal ? (
          <div className="py-6 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)] mx-auto" />
            <p className="text-sm font-medium text-[var(--foreground)]">
              Proses pembuatan soal AI sedang berlangsung di latar belakang...
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">
              Halaman ini akan diperbarui secara otomatis setelah selesai. Anda dapat menutup dialog ini.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-[var(--muted-foreground)]">
              Pilih jumlah soal yang ingin digenerate oleh AI berdasarkan materi PDF bab ini.
            </p>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Jumlah Soal (1 - 20)
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={jumlahSoalGen}
                onChange={(e) => setJumlahSoalGen(Number(e.target.value))}
                className="w-full p-2 border border-[var(--input)] rounded-lg text-sm bg-[var(--background)] text-[var(--foreground)]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmGenerate}
                disabled={isSubmittingGen}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition flex items-center gap-2"
              >
                {isSubmittingGen ? "Proses..." : "Mulai Generate"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
