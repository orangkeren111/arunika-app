import React, { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { X, FileSpreadsheet, Download, Upload } from "lucide-react";
import { SoalImportRow } from "./GuruSoalViewModel";

interface Kompetensi {
  id: number;
  nomerKompetensi: string;
  isiKompetensi: string;
}

interface ImportExcelSoalModalProps {
  isOpen: boolean;
  kompetensiList: Kompetensi[];
  onClose: () => void;
  onImport: (rows: SoalImportRow[]) => Promise<void>;
}

export const ImportExcelSoalModal: React.FC<ImportExcelSoalModalProps> = ({
  isOpen,
  kompetensiList,
  onClose,
  onImport,
}) => {
  const [importRows, setImportRows] = useState<SoalImportRow[]>([]);
  const [importError, setImportError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const link = document.createElement("a");
    link.href = "/template/TemplateImportSoal.xlsx";
    link.download = "TemplateImportSoal.xlsx";
    link.click();
  };
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError("");
    setImportRows([]);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: "" });

      if (rawRows.length === 0) {
        throw new Error("File Excel tidak memiliki data.");
      }

      const parsedRows: SoalImportRow[] = [];

      for (let i = 0; i < rawRows.length; i++) {
        const raw = rawRows[i];
        const rowNum = i + 2;

        const typeRaw = String(raw.type || raw.Type || raw.Tipe || "").trim().toUpperCase();
        if (typeRaw !== "MCQ" && typeRaw !== "ESSAY") {
          throw new Error(`Baris ${rowNum}: Tipe soal harus 'MCQ' atau 'ESSAY'.`);
        }

        const teksSoal = String(raw.teksSoal || raw.TeksSoal || raw.text || raw.Text || "").trim();
        if (!teksSoal) {
          throw new Error(`Baris ${rowNum}: Teks Soal wajib diisi.`);
        }

        const diffRaw = Number(raw.difficulty || raw.Difficulty || raw.bobot || raw.Bobot || 1);
        const difficulty = isNaN(diffRaw) || diffRaw < 1 ? 1 : Math.min(10, Math.max(1, diffRaw));

        const bloomRaw = String(raw.bloomLevel || raw.BloomLevel || "C1").trim().toUpperCase();
        const bloomLevel = ["C1", "C2", "C3", "C4", "C5", "C6"].includes(bloomRaw) ? bloomRaw : "C1";

        const tagsRaw = String(raw.tags || raw.Tags || "").trim();
        const tags = tagsRaw ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : [];

        // Match nomerKompetensi
        const nomerKompRaw = String(raw.nomerKompetensi || raw.NomerKompetensi || raw.kompetensi || raw.Kompetensi || "").trim();
        let kompetensiBabId: number | null = null;
        if (nomerKompRaw) {
          const foundKomp = kompetensiList.find(
            (k) => k.nomerKompetensi.toLowerCase() === nomerKompRaw.toLowerCase()
          );
          if (foundKomp) {
            kompetensiBabId = foundKomp.id;
          }
        }

        let opsiJawaban: string[] | null = null;
        let jawabanBenarMcq: string | null = null;
        let jawabanBenarEssay: string | null = null;

        if (typeRaw === "MCQ") {
          const opsiList: string[] = [];
          const indexMap: Record<string, string> = {};
          const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

          // Dynamically scan for OpsiA to OpsiZ
          for (const char of alphabet) {
            // Accommodate variations like 'opsiA', 'OpsiA', 'Opsi A', 'opsi A'
            const val =
              raw[`opsi${char}`] ??
              raw[`Opsi${char}`] ??
              raw[`Opsi ${char}`] ??
              raw[`opsi ${char}`];

            if (val !== undefined && val !== null) {
              const cleanVal = String(val).trim();
              if (cleanVal !== "") {
                opsiList.push(cleanVal);
                indexMap[char] = cleanVal; // e.g., indexMap["A"] = "2"
              }
            }
          }

          if (opsiList.length < 2) {
            throw new Error(`Baris ${rowNum}: MCQ minimal harus memiliki 2 opsi jawaban (misal Opsi A & Opsi B).`);
          }

          opsiJawaban = opsiList;

          const jwbRaw = String(raw.jawabanBenar || raw.JawabanBenar || "").trim().toUpperCase();
          if (!jwbRaw) {
            throw new Error(`Baris ${rowNum}: Jawaban Benar (A/B/C/D/E atau isi teks) wajib diisi untuk MCQ.`);
          }

          // If the teacher types a single letter (e.g., "A", "C"), map it to the actual text
          if (jwbRaw.length === 1 && alphabet.includes(jwbRaw)) {
            jawabanBenarMcq = indexMap[jwbRaw] || "";
            if (!jawabanBenarMcq) {
              throw new Error(`Baris ${rowNum}: Opsi '${jwbRaw}' kosong, tidak bisa dijadikan jawaban benar.`);
            }
          } else {
            // Otherwise, assume they typed the full answer text
            jawabanBenarMcq = String(raw.jawabanBenar || raw.JawabanBenar || "").trim();
          }
        } else {
          jawabanBenarEssay = String(raw.jawabanBenarEssay || raw.JawabanBenarEssay || raw.jawabanBenar || "").trim();
        }

        parsedRows.push({
          type: typeRaw as "MCQ" | "ESSAY",
          teksSoal,
          difficulty,
          bloomLevel,
          opsiJawaban,
          jawabanBenarMcq,
          jawabanBenarEssay,
          tags,
          kompetensiBabId,
        });
      }

      setImportRows(parsedRows);
    } catch (err: any) {
      setImportError(err.message || "Gagal membaca file Excel.");
    }
  };

  const handleSubmitImport = async () => {
    if (importRows.length === 0) return;
    setIsSubmitting(true);
    try {
      await onImport(importRows);
      onClose();
    } catch (err: any) {
      setImportError(err.message || "Gagal mengimpor soal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl w-full max-w-4xl p-6 space-y-4 shadow-xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center pb-2 border-b border-[var(--border)]">
          <h3 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
            <FileSpreadsheet className="text-emerald-600" size={20} /> Import Soal dari Excel
          </h3>
          <button onClick={onClose} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 flex-1 overflow-y-auto pr-1">
          <div className="flex flex-wrap gap-3 items-center justify-between bg-[var(--muted)]/50 p-3 rounded-lg border border-[var(--border)]">
            <p className="text-xs text-[var(--muted-foreground)]">
              Gunakan template Excel berikut untuk format data soal yang sesuai.
            </p>
            <button
              onClick={handleDownloadTemplate}
              className="bg-emerald-600/10 text-emerald-700 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-emerald-600/20 transition flex items-center gap-1.5"
            >
              <Download size={14} /> Download Template Excel
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Pilih File Excel (.xlsx / .xls)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls"
              onChange={handleExcelUpload}
              className="w-full text-xs text-[var(--muted-foreground)] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[var(--primary)] file:text-[var(--primary-foreground)] hover:file:opacity-90 cursor-pointer"
            />
          </div>

          {importError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-600 rounded-lg text-xs font-medium">
              {importError}
            </div>
          )}

          {importRows.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-[var(--foreground)]">
                Pratinjau Data ({importRows.length} Soal Siap Diimport)
              </span>
              <div className="overflow-x-auto border border-[var(--border)] rounded-lg max-h-60">
                <table className="w-full text-xs text-left text-[var(--foreground)]">
                  <thead className="bg-[var(--muted)] text-[var(--muted-foreground)] uppercase font-semibold">
                    <tr>
                      <th className="p-2 border-b">#</th>
                      <th className="p-2 border-b">Tipe</th>
                      <th className="p-2 border-b">Pertanyaan</th>
                      <th className="p-2 border-b">Bobot</th>
                      <th className="p-2 border-b">Bloom</th>
                      <th className="p-2 border-b">Kompetensi</th>
                      <th className="p-2 border-b">Jawaban Benar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importRows.map((row, idx) => (
                      <tr key={idx} className="border-b border-[var(--border)] hover:bg-[var(--muted)]/30">
                        <td className="p-2 font-mono">{idx + 1}</td>
                        <td className="p-2 font-bold">{row.type}</td>
                        <td className="p-2 max-w-xs truncate">{row.teksSoal}</td>
                        <td className="p-2">{row.difficulty}</td>
                        <td className="p-2">{row.bloomLevel}</td>
                        <td className="p-2">
                          {row.kompetensiBabId ? (
                            <span className="text-emerald-600 font-medium">
                              #{kompetensiList.find((k) => k.id === row.kompetensiBabId)?.nomerKompetensi}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">Tidak ada</span>
                          )}
                        </td>
                        <td className="p-2 max-w-xs truncate">
                          {row.type === "MCQ" ? row.jawabanBenarMcq : row.jawabanBenarEssay || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmitImport}
            disabled={importRows.length === 0 || isSubmitting}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition flex items-center gap-2"
          >
            {isSubmitting ? "Mengimpor..." : `Import ${importRows.length} Soal`}
          </button>
        </div>
      </div>
    </div>
  );
};
