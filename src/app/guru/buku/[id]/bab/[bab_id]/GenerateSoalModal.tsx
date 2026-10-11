import React, { useState } from "react";
import { X, Loader2 } from "lucide-react";

interface GenerateSoalModalProps {
  isOpen: boolean;
  isGeneratingSoal: boolean;
  onClose: () => void;
  onGenerate: (jumlahSoalMcq: number, jumlahSoalEssay: number, pilihanMcq: number) => Promise<void>;
}

export const GenerateSoalModal: React.FC<GenerateSoalModalProps> = ({
  isOpen,
  isGeneratingSoal,
  onClose,
  onGenerate,
}) => {
  const [jumlahMcq, setJumlahMcq] = useState<number>(7);
  const [jumlahEssay, setJumlahEssay] = useState<number>(3);
  const [pilihanPerMcq, setPilihanPerMcq] = useState<number>(4);
  const [isSubmittingGen, setIsSubmittingGen] = useState(false);

  if (!isOpen) return null;

  const totalQuestions = jumlahMcq + jumlahEssay;

  const handleConfirmGenerate = async () => {
    if (totalQuestions <= 0) {
      alert("Harap tentukan minimal 1 soal (Pilihan Ganda atau Esai).");
      return;
    }
    setIsSubmittingGen(true);
    try {
      await onGenerate(jumlahMcq, jumlahEssay, pilihanPerMcq);
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
            className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer"
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
              Konfigurasi jumlah soal Pilihan Ganda (MCQ) dan Esai yang ingin digenerate oleh AI.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                  Pilihan Ganda (MCQ)
                </label>
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={jumlahMcq}
                  onChange={(e) => setJumlahMcq(Math.max(0, Number(e.target.value)))}
                  className="w-full p-2 border border-[var(--input)] rounded-lg text-sm bg-[var(--background)] text-[var(--foreground)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                  Soal Esai
                </label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={jumlahEssay}
                  onChange={(e) => setJumlahEssay(Math.max(0, Number(e.target.value)))}
                  className="w-full p-2 border border-[var(--input)] rounded-lg text-sm bg-[var(--background)] text-[var(--foreground)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                Jumlah Pilihan per Soal MCQ
              </label>
              <select
                value={pilihanPerMcq}
                onChange={(e) => setPilihanPerMcq(Number(e.target.value))}
                className="w-full p-2 border border-[var(--input)] rounded-lg text-sm bg-[var(--background)] text-[var(--foreground)]"
              >
                <option value={4}>4 Pilihan (A - D)</option>
                <option value={5}>5 Pilihan (A - E)</option>
                <option value={3}>3 Pilihan (A - C)</option>
              </select>
            </div>

            <div className="bg-[var(--muted)]/50 p-2.5 rounded-lg flex items-center justify-between text-xs font-medium text-[var(--foreground)]">
              <span>Total Soal:</span>
              <span className="font-bold text-sm text-[var(--primary)]">{totalQuestions} Soal</span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmGenerate}
                disabled={isSubmittingGen || totalQuestions <= 0}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition flex items-center gap-2 cursor-pointer"
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
