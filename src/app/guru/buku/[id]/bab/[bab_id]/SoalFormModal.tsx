import React, { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { MathRenderer } from "@/src/components/MathRenderer";
import { MathEquationAssistant } from "@/src/components/MathEquationAssistant";
import { Soal } from "@/src/app/types/guru";

type TipeSoal = "MCQ" | "ESSAY";

interface Kompetensi {
  id: number;
  nomerKompetensi: string;
  isiKompetensi: string;
}

interface SoalFormModalProps {
  isOpen: boolean;
  editingId: number | null;
  soalToEdit?: Soal | null;
  kompetensiList: Kompetensi[];
  initialType?: TipeSoal;
  onClose: () => void;
  onSave: (payload: {
    editingId: number | null;
    formType: TipeSoal;
    teksSoal: string;
    difficulty: number;
    bloomLevel: string;
    tagsInput: string;
    opsiJawaban: string[];
    jawabanBenarIndex: number;
    jawabanBenarEssay: string;
    kompetensiBabId: string;
    linkGambarSoal: string;
  }) => void;
  onUploadImage: (file: File) => Promise<string>;
}

export const SoalFormModal: React.FC<SoalFormModalProps> = ({
  isOpen,
  editingId,
  soalToEdit,
  kompetensiList,
  initialType = "MCQ",
  onClose,
  onSave,
  onUploadImage,
}) => {
  const [formType, setFormType] = useState<TipeSoal>(initialType);
  const [teksSoal, setTeksSoal] = useState("");
  const [difficulty, setDifficulty] = useState(1);
  const [bloomLevel, setBloomLevel] = useState("C1");
  const [tagsInput, setTagsInput] = useState("");
  const [opsiJawaban, setOpsiJawaban] = useState<string[]>(["", "", "", ""]);
  const [jawabanBenarIndex, setJawabanBenarIndex] = useState<number>(0);
  const [jawabanBenarEssay, setJawabanBenarEssay] = useState<string>("");
  const [kompetensiBabId, setKompetensiBabId] = useState<string>("");
  const [linkGambarSoal, setLinkGambarSoal] = useState<string>("");

  useEffect(() => {
    if (soalToEdit) {
      setFormType(soalToEdit.type as TipeSoal);
      setTeksSoal(soalToEdit.text || (soalToEdit as any).teksSoal || "");
      setDifficulty(soalToEdit.difficulty || 1);
      setBloomLevel(soalToEdit.bloomLevel || "C1");
      setTagsInput(Array.isArray(soalToEdit.tags) ? soalToEdit.tags.join(", ") : "");
      setKompetensiBabId(soalToEdit.kompetensiBabId || "");
      setLinkGambarSoal(soalToEdit.linkGambarSoal || "");
      setJawabanBenarEssay(soalToEdit.jawabanBenarEssay || "");
      if (soalToEdit.type === "MCQ") {
        setOpsiJawaban(soalToEdit.options || ["", "", "", ""]);
        const correctIdx = soalToEdit.options?.findIndex(
          (opt: string) => opt === soalToEdit.correctAnswer,
        );
        setJawabanBenarIndex(correctIdx !== -1 && correctIdx !== undefined ? correctIdx : 0);
      }
    } else {
      setFormType(initialType);
      setTeksSoal("");
      setOpsiJawaban(["", "", "", ""]);
      setJawabanBenarIndex(0);
      setJawabanBenarEssay("");
      setDifficulty(1);
      setBloomLevel("C1");
      setTagsInput("");
      setKompetensiBabId("");
      setLinkGambarSoal("");
    }
  }, [soalToEdit, initialType, isOpen]);

  if (!isOpen) return null;

  const handleAddOption = () => setOpsiJawaban([...opsiJawaban, ""]);

  const handleRemoveOption = (index: number) => {
    const newOptions = opsiJawaban.filter((_, i) => i !== index);
    setOpsiJawaban(newOptions);
    if (jawabanBenarIndex === index) setJawabanBenarIndex(0);
    else if (jawabanBenarIndex > index) setJawabanBenarIndex(jawabanBenarIndex - 1);
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...opsiJawaban];
    newOptions[index] = value;
    setOpsiJawaban(newOptions);
  };

  const handleSaveClick = () => {
    onSave({
      editingId,
      formType,
      teksSoal,
      difficulty,
      bloomLevel,
      tagsInput,
      opsiJawaban,
      jawabanBenarIndex,
      jawabanBenarEssay,
      kompetensiBabId,
      linkGambarSoal,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--card)] rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[var(--border)]">
        {/* Modal Header */}
        <div className="p-6 border-b border-[var(--border)] flex justify-between items-center">
          <h2 className="text-xl font-bold text-[var(--foreground)]">
            {editingId ? "Edit Soal" : `Tambah Soal ${formType}`}
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-1 rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* Tipe Soal Toggle */}
          <div>
            <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">
              Tipe Soal
            </label>
            <div className="flex p-1 bg-[var(--muted)] rounded-lg w-fit">
              <button
                onClick={() => setFormType("MCQ")}
                className={`px-4 py-2 text-sm font-medium rounded-md transition ${formType === "MCQ" ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"}`}
              >
                Pilihan Ganda (MCQ)
              </button>
              <button
                onClick={() => setFormType("ESSAY")}
                className={`px-4 py-2 text-sm font-medium rounded-md transition ${formType === "ESSAY" ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"}`}
              >
                Essay
              </button>
            </div>
          </div>

          {/* Math Equation Assistant side menu */}
          <MathEquationAssistant
            onInsertLatex={(latex) => {
              setTeksSoal((prev) => (prev ? `${prev} ${latex}` : latex));
            }}
          />

          {/* Teks Soal Input */}
          <div>
            <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">
              Pertanyaan
            </label>
            <textarea
              rows={4}
              value={teksSoal}
              onChange={(e) => setTeksSoal(e.target.value)}
              placeholder="Ketikkan teks pertanyaan di sini... Gunakan $...$ untuk matematika inline atau $$...$$ untuk matematika block."
              className="w-full p-3 rounded-lg border border-[var(--input)] bg-[var(--card)] text-[var(--card-foreground)] focus:ring-2 focus:ring-[var(--ring)] focus:outline-none transition resize-y font-mono text-xs"
            />
            {/* Live Preview Soal */}
            <div className="mt-2 p-3 bg-[var(--muted)]/50 rounded-lg border border-[var(--border)]">
              <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider block mb-1">
                Pratinjau Tampilan Soal (LaTeX Preview)
              </span>
              <div className="text-xs text-[var(--foreground)] min-h-[1.5rem] leading-relaxed">
                {teksSoal.trim() ? (
                  <MathRenderer text={teksSoal} />
                ) : (
                  <span className="italic text-[var(--muted-foreground)]">
                    (Belum ada teks pertanyaan)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Tags / Kata Kunci Input */}
          <div>
            <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">
              Tags / Kata Kunci Topik (Dipisahkan koma)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="contoh: fotosintesis, klorofil, sel"
              className="w-full p-3 rounded-lg border border-[var(--input)] bg-[var(--card)] text-[var(--card-foreground)] focus:ring-2 focus:ring-[var(--ring)] focus:outline-none transition text-sm font-medium"
            />
          </div>

          {/* Kompetensi & Gambar Link */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">
                Kompetensi Bab
              </label>
              <select
                value={kompetensiBabId}
                onChange={(e) => setKompetensiBabId(e.target.value)}
                className="w-full p-3 rounded-lg border border-[var(--input)] bg-[var(--card)] text-[var(--card-foreground)] focus:ring-2 focus:ring-[var(--ring)] focus:outline-none transition"
              >
                <option value="">-- Pilih Kompetensi --</option>
                {kompetensiList.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nomerKompetensi} - {k.isiKompetensi.substring(0, 40)}...
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">
                Gambar Soal (Opsional: Unggah / Link)
              </label>
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        const url = await onUploadImage(file);
                        setLinkGambarSoal(url);
                      } catch (err) {
                        alert("Gagal mengunggah gambar. Silakan coba lagi.");
                      }
                    }
                  }}
                  className="w-full text-xs text-[var(--muted-foreground)] file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[var(--primary)] file:text-white hover:file:opacity-90 cursor-pointer"
                />
                <input
                  type="text"
                  value={linkGambarSoal}
                  onChange={(e) => setLinkGambarSoal(e.target.value)}
                  placeholder="Atau masukkan URL gambar (https://...)"
                  className="w-full p-2.5 rounded-lg border border-[var(--input)] bg-[var(--card)] text-[var(--card-foreground)] focus:ring-2 focus:ring-[var(--ring)] focus:outline-none transition text-xs"
                />
              </div>
              {linkGambarSoal && (
                <div className="mt-2 relative group w-fit">
                  <img src={linkGambarSoal} alt="Preview" className="h-16 rounded border object-contain bg-white p-1" />
                  <button
                    type="button"
                    onClick={() => setLinkGambarSoal("")}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-[10px] shadow"
                    title="Hapus Gambar"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Bobot Soal (Difficulty) & Tingkat Taksonomi Bloom */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">
                Bobot Soal (Kesulitan 1 - 10)
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={difficulty}
                onChange={(e) => setDifficulty(Number(e.target.value))}
                className="w-full p-3 rounded-lg border border-[var(--input)] bg-[var(--card)] text-[var(--card-foreground)] focus:ring-2 focus:ring-[var(--ring)] focus:outline-none transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">
                Tingkat Taksonomi Bloom
              </label>
              <select
                value={bloomLevel}
                onChange={(e) => setBloomLevel(e.target.value)}
                className="w-full p-3 rounded-lg border border-[var(--input)] bg-[var(--card)] text-[var(--card-foreground)] focus:ring-2 focus:ring-[var(--ring)] focus:outline-none transition"
              >
                <option value="C1">C1 - Mengingat (Remembering)</option>
                <option value="C2">C2 - Memahami (Understanding)</option>
                <option value="C3">C3 - Menerapkan (Applying)</option>
                <option value="C4">C4 - Menganalisis (Analyzing)</option>
                <option value="C5">C5 - Evaluasi (Evaluating)</option>
                <option value="C6">C6 - Mencipta (Creating)</option>
              </select>
            </div>
          </div>

          {/* MCQ Options Dynamic Input */}
          {formType === "MCQ" && (
            <div className="space-y-3 border-t border-[var(--border)] pt-4">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-[var(--muted-foreground)]">
                  Opsi Jawaban
                </label>
                <span className="text-xs text-[var(--muted-foreground)]">
                  Pilih radio button untuk menandai jawaban benar
                </span>
              </div>

              {opsiJawaban.map((opsi, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="correctAnswer"
                    checked={jawabanBenarIndex === idx}
                    onChange={() => setJawabanBenarIndex(idx)}
                    className="w-5 h-5 text-[var(--primary)] border-[var(--input)] focus:ring-[var(--ring)] cursor-pointer"
                    title="Tandai sebagai jawaban benar"
                  />
                  <span className="text-sm font-bold text-[var(--muted-foreground)] w-6 text-center">
                    {String.fromCharCode(65 + idx)}.
                  </span>
                  <input
                    type="text"
                    value={opsi}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    placeholder={`Masukkan opsi ${String.fromCharCode(65 + idx)}`}
                    className={`flex-1 p-2 rounded-lg border focus:ring-2 focus:outline-none transition ${jawabanBenarIndex === idx ? "border-[var(--success)] focus:ring-[var(--success)]" : "border-[var(--input)] focus:ring-[var(--ring)]"} bg-[var(--background)] text-[var(--foreground)]`}
                  />
                  <button
                    onClick={() => handleRemoveOption(idx)}
                    disabled={opsiJawaban.length <= 2}
                    className="text-[var(--error)] hover:bg-[#D9707015] p-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Hapus opsi"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}

              <button
                onClick={handleAddOption}
                className="mt-3 text-sm font-medium text-[var(--primary)] hover:text-[var(--foreground)] flex items-center gap-2 px-2 py-1 transition"
              >
                <Plus size={16} /> Tambah Opsi Lainnya
              </button>

              {/* Live Preview MCQ Options */}
              <div className="mt-3 p-3 bg-[var(--muted)]/50 rounded-lg border border-[var(--border)] space-y-1">
                <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider block mb-1">
                  Pratinjau Opsi Jawaban untuk Siswa (LaTeX Preview)
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  {opsiJawaban.map((opsi, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded-lg border flex items-center gap-2 ${jawabanBenarIndex === idx ? "bg-green-500/10 border-green-500/30 text-green-700 font-bold" : "bg-[var(--card)] border-[var(--border)] text-[var(--foreground)]"}`}
                    >
                      <span className="font-mono text-[10px] text-[var(--muted-foreground)] w-4">
                        {String.fromCharCode(65 + idx)}.
                      </span>
                      <MathRenderer text={opsi || "(Kosong)"} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ESSAY Answer Key Input */}
          {formType === "ESSAY" && (
            <div className="space-y-2 border-t border-[var(--border)] pt-4">
              <label className="block text-sm font-medium text-[var(--muted-foreground)]">
                Kunci / Panduan Jawaban Essay Benar
              </label>
              <textarea
                rows={3}
                value={jawabanBenarEssay}
                onChange={(e) => setJawabanBenarEssay(e.target.value)}
                placeholder="Ketikkan kunci / acuan jawaban benar untuk essay ini (akan digunakan AI sebagai referensi penilaian)..."
                className="w-full p-3 rounded-lg border border-[var(--input)] bg-[var(--card)] text-[var(--card-foreground)] focus:ring-2 focus:ring-[var(--ring)] focus:outline-none transition text-xs"
              />
              {/* Live Preview Essay Answer */}
              <div className="mt-2 p-3 bg-[var(--muted)]/50 rounded-lg border border-[var(--border)]">
                <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider block mb-1">
                  Pratinjau Kunci Jawaban Essay (LaTeX Preview)
                </span>
                <div className="text-xs text-[var(--foreground)] min-h-[1.5rem] leading-relaxed">
                  {jawabanBenarEssay.trim() ? (
                    <MathRenderer text={jawabanBenarEssay} />
                  ) : (
                    <span className="italic text-[var(--muted-foreground)]">
                      (Belum ada kunci jawaban)
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-[var(--border)] flex justify-end gap-3 bg-[var(--muted)] rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--border)] hover:text-[var(--foreground)] transition"
          >
            Batal
          </button>
          <button
            onClick={handleSaveClick}
            disabled={
              !teksSoal.trim() ||
              (formType === "MCQ" && opsiJawaban.some((o) => !o.trim()))
            }
            className="px-6 py-2 rounded-lg text-sm font-medium bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Simpan Soal
          </button>
        </div>
      </div>
    </div>
  );
};
