import React, { useState } from "react";
import { X, Upload } from "lucide-react";

interface UploadPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File, jumlahMcq: number, jumlahEssay: number, pilihanPerMcq: number) => Promise<void>;
}

export const UploadPdfModal: React.FC<UploadPdfModalProps> = ({
  isOpen,
  onClose,
  onUpload,
}) => {
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null);
  const [jumlahSoalMcq, setJumlahSoalMcq] = useState<number>(7);
  const [jumlahSoalEssay, setJumlahSoalEssay] = useState<number>(3);
  const [pilihanPerMcq, setPilihanPerMcq] = useState<number>(4);
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPdfFile) {
      alert("Silakan pilih file PDF materi terlebih dahulu.");
      return;
    }
    setIsUploading(true);
    try {

      await onUpload(selectedPdfFile, jumlahSoalMcq, jumlahSoalEssay, pilihanPerMcq);
      onClose();
    } catch (err: any) {
      alert(err?.message || "Gagal mengunggah PDF materi.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl w-full max-w-md p-6 space-y-4 shadow-xl">
        <div className="flex justify-between items-center pb-2 border-b border-[var(--border)]">
          <h3 className="text-lg font-bold text-[var(--foreground)]">
            Upload PDF Materi Bab
          </h3>
          <button
            onClick={onClose}
            className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            <X size={20} />
          </button>
        </div>
        <p className="text-sm text-[var(--muted-foreground)]">
          Upload file PDF materi khusus untuk bab ini. AI akan mengekstrak tujuan pembelajaran, mengolah gambar, dan membuat bank soal reference.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              File PDF Materi
            </label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  setSelectedPdfFile(e.target.files[0]);
                }
              }}
              className="w-full text-sm text-[var(--foreground)] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[var(--primary)] file:text-[var(--primary-foreground)] hover:file:opacity-90 cursor-pointer"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-medium text-[var(--foreground)] mb-1">
                Jumlah MCQ
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={jumlahSoalMcq}
                onChange={(e) => setJumlahSoalMcq(Number(e.target.value))}
                className="w-full p-2 border border-[var(--input)] rounded-lg text-sm bg-[var(--background)] text-[var(--foreground)]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--foreground)] mb-1">
                Jumlah Essay
              </label>
              <input
                type="number"
                min={0}
                max={10}
                value={jumlahSoalEssay}
                onChange={(e) => setJumlahSoalEssay(Number(e.target.value))}
                className="w-full p-2 border border-[var(--input)] rounded-lg text-sm bg-[var(--background)] text-[var(--foreground)]"
              />
            </div>

          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--foreground)] mb-1">
              Opsi MCQ
            </label>
            <div className="flex gap-2">
              {[3, 4, 5].map((opsi) => (
                <label
                  key={opsi}
                  className={`flex-1 p-2 border rounded-lg text-sm font-medium cursor-pointer ${pilihanPerMcq === opsi
                    ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                    : "border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] hover:border-[var(--primary)]/50"
                    }`}
                >
                  <input
                    type="radio"
                    name="opsiMcq"
                    value={opsi}
                    checked={pilihanPerMcq === opsi}
                    onChange={(e) => setPilihanPerMcq(Number(e.target.value))}
                    className="hidden"
                  />
                  {opsi} Opsi
                </label>
              ))}
            </div>
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
              type="submit"
              disabled={isUploading || !selectedPdfFile}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition flex items-center gap-2"
            >
              {isUploading ? "Mengunggah..." : "Upload & Ekstrak"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
