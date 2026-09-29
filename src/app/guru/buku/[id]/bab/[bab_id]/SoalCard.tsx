import React from "react";
import { MathRenderer } from "@/src/components/MathRenderer";
import { Trash2 } from "lucide-react";
import { Soal, Bab } from "@/src/app/types/guru";

interface Kompetensi {
  id: number;
  nomerKompetensi: string;
  isiKompetensi: string;
}

interface SoalCardProps {
  soal: Soal;
  kompetensiList: Kompetensi[];
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onEdit: (soal: Soal) => void;
  onDelete: (id: string) => void;
}

export const SoalCard: React.FC<SoalCardProps> = ({
  soal,
  kompetensiList,
  onAccept,
  onReject,
  onEdit,
  onDelete,
}) => {
  return (
    <div
      className={`bg-[var(--card)] p-5 rounded-xl border border-[var(--border)] shadow-sm transition
        ${soal.isRejected ? "opacity-60 border-red-500/30 bg-red-500/5" : ""}`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-xs font-bold px-2 py-1 rounded ${soal.type === "MCQ" ? "bg-[var(--info)] text-white" : "bg-[var(--accent)] text-white"}`}
          >
            {soal.type}
          </span>
          {soal.difficulty !== undefined && (
            <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded font-semibold">
              Bobot: {soal.difficulty}
            </span>
          )}
          {soal.bloomLevel && (
            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded font-semibold">
              Taksonomi: {soal.bloomLevel}
            </span>
          )}
          {soal.kompetensiBabId && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-semibold">
              Kompetensi: {
                kompetensiList.find(k => k.id.toString() === soal.kompetensiBabId)?.nomerKompetensi || soal.kompetensiBabId
              }
            </span>
          )}
          {soal.tags && soal.tags.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              {soal.tags.map((t, tIdx) => (
                <span key={tIdx} className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full font-bold">
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => onAccept(soal.id)}
            className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition ${soal.isAccepted ? "bg-green-600 text-white border-green-600" : "bg-transparent text-[var(--muted-foreground)] border-[var(--border)] hover:bg-[var(--muted)]"}`}
          >
            Setuju
          </button>
          <button
            onClick={() => onReject(soal.id)}
            className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition ${soal.isRejected ? "bg-red-600 text-white border-red-600" : "bg-transparent text-[var(--muted-foreground)] border-[var(--border)] hover:bg-[var(--muted)]"}`}
          >
            Tolak
          </button>

          <span className="w-px h-4 bg-gray-300 mx-1" />

          <button
            onClick={() => onEdit(soal)}
            className="text-[var(--muted-foreground)] hover:text-[var(--primary)] text-sm font-medium"
          >
            Edit
          </button>
          <button
            onClick={() => {
              if (window.confirm("Apakah Anda yakin ingin menghapus soal ini?")) {
                onDelete(soal.id);
              }
            }}
            className="text-[var(--muted-foreground)] hover:text-red-500 text-sm font-medium flex items-center gap-1"
          >
            <Trash2 size={14} />
            Hapus
          </button>
        </div>
      </div>

      {soal.linkGambarSoal && (
        <img
          src={soal.linkGambarSoal}
          alt="Gambar Soal"
          className="max-h-48 rounded-lg mb-3 object-contain"
        />
      )}

      <div className="text-[var(--card-foreground)] font-semibold text-base mb-4 leading-relaxed">
        <MathRenderer text={soal.text || (soal as any).teksSoal} />
      </div>

      {/* Opsi Jawaban untuk MCQ */}
      {soal.type === "MCQ" && soal.options && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          {soal.options.map((opt, idx) => {
            const isCorrect = opt === soal.correctAnswer;
            return (
              <div
                key={idx}
                className={`p-2.5 rounded-lg border font-medium flex items-center gap-2 ${isCorrect ? "bg-green-500/10 border-green-500/30 text-green-700 font-bold" : "bg-[var(--background)] border-[var(--border)] text-[var(--muted-foreground)]"}`}
              >
                <span className="font-mono text-xs w-5">
                  {String.fromCharCode(65 + idx)}.
                </span>
                <MathRenderer text={opt} />
              </div>
            );
          })}
        </div>
      )}

      {/* Kunci Jawaban untuk ESSAY */}
      {soal.type === "ESSAY" && soal.jawabanBenarEssay && (
        <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-sm text-emerald-800 dark:text-emerald-300">
          <span className="font-bold text-xs uppercase tracking-wider block mb-1">
            Kunci / Acuan Jawaban Essay:
          </span>
          <MathRenderer text={soal.jawabanBenarEssay} />
        </div>
      )}
    </div>
  );
};
