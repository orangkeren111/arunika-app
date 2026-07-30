"use client";

import React, { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, X, Trash2 } from "lucide-react";
import { useSoalViewModel } from "./GuruSoalViewModel";
// Tipe data frontend yang disesuaikan dengan skema Prisma
type TipeSoal = "MCQ" | "ESSAY";

export default function BankSoalPage({
  params,
}: {
  params: Promise<{ id: string; bab_id: string }>;
}) {
  const resolvedParams = use(params);
  console.log(resolvedParams);

  const {
    bab,
    soalList,
    handleAddSoal,
    handleEditSoal,
    handleDeleteSoal,
    handleGenerateQuestion,
  } = useSoalViewModel(resolvedParams.bab_id.toString());

  // --- MODAL STATE ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // --- FORM STATE ---
  const [formType, setFormType] = useState<TipeSoal>("MCQ");
  const [teksSoal, setTeksSoal] = useState("");
  const [difficulty, setDifficulty] = useState(0);
  const [bloomLevel, setBloomLevel] = useState("");
  const [opsiJawaban, setOpsiJawaban] = useState<string[]>(["", "", "", ""]); // Default 4 opsi
  const [jawabanBenarIndex, setJawabanBenarIndex] = useState<number>(0);

  // --- HANDLERS ---
  const openModal = (type: TipeSoal, soalToEdit?: any) => {
    if (soalToEdit) {
      setEditingId(soalToEdit.id);
      setFormType(soalToEdit.type as TipeSoal);
      setTeksSoal(soalToEdit.text);
      setDifficulty(soalToEdit.difficulty || 1);
      setBloomLevel(soalToEdit.bloomLevel || "C1");
      if (soalToEdit.type === "MCQ") {
        setOpsiJawaban(soalToEdit.options || ["", "", "", ""]);
        // Mencari index jawaban benar dari array opsi
        const correctIdx = soalToEdit.options?.findIndex(
          (opt: string) => opt === soalToEdit.correctAnswer,
        );
        setJawabanBenarIndex(correctIdx !== -1 ? correctIdx : 0);
      }
    } else {
      // Reset form untuk Soal Baru
      setEditingId(null);
      setFormType(type);
      setTeksSoal("");
      setOpsiJawaban(["", "", "", ""]);
      setJawabanBenarIndex(0);
      setDifficulty(1);
      setBloomLevel("C1");
    }
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleAddOption = () => setOpsiJawaban([...opsiJawaban, ""]);

  const handleRemoveOption = (index: number) => {
    const newOptions = opsiJawaban.filter((_, i) => i !== index);
    setOpsiJawaban(newOptions);
    // Sesuaikan index jawaban benar jika opsi yang dipilih dihapus
    if (jawabanBenarIndex === index) setJawabanBenarIndex(0);
    else if (jawabanBenarIndex > index)
      setJawabanBenarIndex(jawabanBenarIndex - 1);
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...opsiJawaban];
    newOptions[index] = value;
    setOpsiJawaban(newOptions);
  };

  const handleSave = () => {
    // Siapkan payload sesuai skema Prisma
    const payload = {
      teksSoal,
      type: formType,
      opsiJawaban: formType === "MCQ" ? opsiJawaban : null,
      jawabanBenarMcq:
        formType === "MCQ" ? opsiJawaban[jawabanBenarIndex] : null,
      babId: Number(resolvedParams.bab_id),
      difficulty: difficulty ? difficulty : 1,
      bloomLevel: bloomLevel ? bloomLevel : "C1",
    };

    if (editingId) {
      handleEditSoal(editingId.toString(), {
        id: editingId.toString(),
        babId: bab?.id ?? "",
        type: payload.type,
        difficulty: payload.difficulty,
        bloomLevel: payload.bloomLevel,
        text: payload.teksSoal,
        options: payload.opsiJawaban ?? [],
        correctAnswer: payload.jawabanBenarMcq ?? "",
      });
    } else {
      handleAddSoal(
        payload.type,
        payload.teksSoal,
        payload.difficulty,
        payload.bloomLevel,
        payload.opsiJawaban ?? [],
        payload.jawabanBenarMcq ?? "",
      );
    }

    closeModal();
  };

  if (!bab)
    return (
      <p className="text-[var(--muted-foreground)]">Memuat bank soal...</p>
    );

  return (
    <div className="space-y-6 relative">
      <Link
        href={`/guru/buku/${resolvedParams.id}`}
        className="inline-flex items-center gap-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition mb-2"
      >
        <ArrowLeft size={16} /> Kembali ke Daftar Bab
      </Link>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            {bab.title}
          </h1>
          <p className="text-[var(--muted-foreground)] mt-1">
            Kelola Soal Pilihan Ganda dan Essay.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => openModal("ESSAY")}
            className="bg-[var(--secondary)] text-[var(--secondary-foreground)] px-4 py-2 rounded-lg text-sm hover:opacity-90 transition flex items-center gap-2"
          >
            <Plus size={16} /> Essay
          </button>
          <button
            onClick={() => openModal("MCQ")}
            className="bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 rounded-lg text-sm hover:opacity-90 transition flex items-center gap-2"
          >
            <Plus size={16} /> Pilihan Ganda
          </button>
          <button
            onClick={() => handleGenerateQuestion()}
            className="bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 rounded-lg text-sm hover:opacity-90 transition flex items-center gap-2"
          >
            <Plus size={16} /> Generate Soal
          </button>
        </div>
      </div>

      {/* --- LIST SOAL --- */}
      <div className="space-y-4">
        {soalList.map((soal, i) => (
          <div
            key={soal.id}
            className="bg-[var(--card)] p-5 rounded-xl border border-[var(--border)] shadow-sm"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
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
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openModal(soal.type as TipeSoal, soal)}
                  className="text-[var(--muted-foreground)] hover:text-[var(--primary)] text-sm font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        "Apakah Anda yakin ingin menghapus soal ini?",
                      )
                    ) {
                      handleDeleteSoal(soal.id);
                    }
                  }}
                  className="text-[var(--muted-foreground)] hover:text-red-500 text-sm font-medium flex items-center gap-1"
                >
                  <Trash2 size={14} />
                  Hapus
                </button>
              </div>
            </div>
            <p className="text-[var(--card-foreground)] mb-4">
              {i + 1}. {soal.text}
            </p>

            {soal.type === "MCQ" && soal.options && (
              <ul className="space-y-2">
                {soal.options.map((opt: string, idx: number) => (
                  <li
                    key={idx}
                    className={`text-sm p-2 rounded-lg border ${opt === soal.correctAnswer ? "border-[var(--success)] bg-[#74A97F15] text-[var(--success)] font-medium" : "border-[var(--border)] text-[var(--muted-foreground)]"}`}
                  >
                    {String.fromCharCode(65 + idx)}. {opt}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      {/* --- MODAL TAMBAH/EDIT SOAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[var(--card)] w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl shadow-xl border border-[var(--border)] flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-[var(--border)]">
              <h2 className="text-xl font-bold text-[var(--foreground)]">
                {editingId ? "Edit Soal" : "Tambah Soal Baru"}
              </h2>
              <button
                onClick={closeModal}
                className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 flex-1">
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

              {/* Teks Soal Input */}
              <div>
                <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">
                  Pertanyaan
                </label>
                <textarea
                  rows={4}
                  value={teksSoal}
                  onChange={(e) => setTeksSoal(e.target.value)}
                  placeholder="Ketikkan teks pertanyaan di sini..."
                  className="w-full p-3 rounded-lg border border-[var(--input)] bg-[var(--card)] text-[var(--card-foreground)] focus:ring-2 focus:ring-[var(--ring)] focus:outline-none transition resize-y"
                />
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
                      {/* Radio button for correct answer */}
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
                        onChange={(e) =>
                          handleOptionChange(idx, e.target.value)
                        }
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
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-[var(--border)] flex justify-end gap-3 bg-[var(--muted)] rounded-b-xl">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--border)] hover:text-[var(--foreground)] transition"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
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
      )}
    </div>
  );
}
