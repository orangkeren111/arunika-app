"use client";

import React, { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, X, Trash2, Upload, Loader2 } from "lucide-react";
import { useSoalViewModel } from "./GuruSoalViewModel";
import { MathRenderer } from "@/src/components/MathRenderer";
import { MathEquationAssistant } from "@/src/components/MathEquationAssistant";

type TipeSoal = "MCQ" | "ESSAY";

import { useParams } from "next/navigation";


export default function BankSoalClientPage({
  id: propId,
  babId: propBabId,
}: {
  id?: string;
  babId?: string;
}) {
  const params = useParams();
  const id = propId || (params?.id as string) || "";
  const babId = propBabId || (params?.bab_id as string) || "";

  const {
    bab,
    soalList,
    kompetensiList,
    loading,
    isGeneratingSoal,
    checkGenerationStatus,
    handleAddSoal,
    handleEditSoal,
    handleDeleteSoal,
    handleGenerateQuestion,
    handleAcceptSoal,
    handleRejectSoal,
    handleUploadImage,
    handleUploadBabPdf,
  } = useSoalViewModel(babId);

  // --- MODAL STATE ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // --- GENERATE SOAL MODAL STATE ---
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [jumlahSoalGen, setJumlahSoalGen] = useState<number>(10);
  const [isSubmittingGen, setIsSubmittingGen] = useState(false);

  // --- UPLOAD PDF MODAL STATE ---
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null);
  const [jumlahSoalPdf, setJumlahSoalPdf] = useState<number>(10);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);

  // --- FORM STATE ---
  const [formType, setFormType] = useState<TipeSoal>("MCQ");
  const [teksSoal, setTeksSoal] = useState("");
  const [difficulty, setDifficulty] = useState(0);
  const [bloomLevel, setBloomLevel] = useState("");
  const [opsiJawaban, setOpsiJawaban] = useState<string[]>(["", "", "", ""]); // Default 4 opsi
  const [jawabanBenarIndex, setJawabanBenarIndex] = useState<number>(0);
  const [jawabanBenarEssay, setJawabanBenarEssay] = useState<string>("");
  const [kompetensiBabId, setKompetensiBabId] = useState<string>("");
  const [linkGambarSoal, setLinkGambarSoal] = useState<string>("");

  // --- HANDLERS ---
  const openModal = (type: TipeSoal, soalToEdit?: any) => {
    if (soalToEdit) {
      setEditingId(soalToEdit.id);
      setFormType(soalToEdit.type as TipeSoal);
      setTeksSoal(soalToEdit.text);
      setDifficulty(soalToEdit.difficulty || 1);
      setBloomLevel(soalToEdit.bloomLevel || "C1");
      setKompetensiBabId(soalToEdit.kompetensiBabId || "");
      setLinkGambarSoal(soalToEdit.linkGambarSoal || "");
      setJawabanBenarEssay(soalToEdit.jawabanBenarEssay || "");
      if (soalToEdit.type === "MCQ") {
        setOpsiJawaban(soalToEdit.options || ["", "", "", ""]);
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
      setJawabanBenarEssay("");
      setDifficulty(1);
      setBloomLevel("C1");
      setKompetensiBabId("");
      setLinkGambarSoal("");
    }
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleAddOption = () => setOpsiJawaban([...opsiJawaban, ""]);

  const handleRemoveOption = (index: number) => {
    const newOptions = opsiJawaban.filter((_, i) => i !== index);
    setOpsiJawaban(newOptions);
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
    const payload = {
      teksSoal,
      type: formType,
      opsiJawaban: formType === "MCQ" ? opsiJawaban : null,
      jawabanBenarMcq:
        formType === "MCQ" ? opsiJawaban[jawabanBenarIndex] : null,
      jawabanBenarEssay: formType === "ESSAY" ? jawabanBenarEssay : null,
      babId: Number(babId),
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
        jawabanBenarEssay: payload.jawabanBenarEssay ?? "",
        kompetensiBabId: kompetensiBabId || null,
        linkGambarSoal: linkGambarSoal || "",
      });
    } else {
      handleAddSoal(
        payload.type,
        payload.teksSoal,
        payload.difficulty,
        payload.bloomLevel,
        payload.opsiJawaban ?? [],
        payload.jawabanBenarMcq ?? "",
        kompetensiBabId || null,
        linkGambarSoal || "",
        payload.jawabanBenarEssay ?? "",
      );
    }

    closeModal();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-8 h-8 border-3 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-[var(--muted-foreground)]">Memuat data bab & bank soal...</p>
      </div>
    );
  }

  if (!bab) {
    return (
      <div className="p-8 text-center bg-[var(--card)] rounded-2xl border border-[var(--border)] space-y-4">
        <h2 className="text-lg font-bold text-[var(--foreground)]">Bab tidak ditemukan</h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          Data bab ID #{babId} tidak ditemukan di database. Bab ini mungkin telah dihapus atau tidak terdaftar.
        </p>
        <Link
          href={id ? `/guru/buku/${id}` : "/guru/buku"}
          className="inline-flex items-center gap-2 bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 rounded-lg text-xs font-semibold hover:opacity-90 transition"
        >
          <ArrowLeft size={14} /> Kembali ke Buku
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      <Link
        href={`/guru/buku/${id}`}
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
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="bg-blue-600/10 text-blue-600 border border-blue-500/20 px-4 py-2 rounded-lg text-sm hover:bg-blue-600/20 transition flex items-center gap-2 font-medium"
          >
            <Upload size={16} /> Upload PDF Materi
          </button>
          <Link
            href={`/guru/buku/${id}/bab/${babId}/kompetensi`}
            className="bg-purple-600/10 text-purple-600 border border-purple-500/20 px-4 py-2 rounded-lg text-sm hover:bg-purple-600/20 transition flex items-center gap-2 font-medium"
          >
            Kelola Kompetensi
          </Link>
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
            onClick={async () => {
              await checkGenerationStatus();
              setIsGenerateModalOpen(true);
            }}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:opacity-90 transition flex items-center gap-2 font-medium"
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
              </div>
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => handleAcceptSoal(soal.id)}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition ${soal.isAccepted ? "bg-green-600 text-white border-green-600" : "bg-transparent text-[var(--muted-foreground)] border-[var(--border)] hover:bg-[var(--muted)]"}`}
                >
                  Setuju
                </button>
                <button
                  onClick={() => handleRejectSoal(soal.id)}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition ${soal.isRejected ? "bg-red-600 text-white border-red-600" : "bg-transparent text-[var(--muted-foreground)] border-[var(--border)] hover:bg-[var(--muted)]"}`}
                >
                  Tolak
                </button>

                <span className="w-px h-4 bg-gray-300 mx-1" />

                <button
                  onClick={() => openModal(soal.type as TipeSoal, { ...soal, text: soal.text || (soal as any).teksSoal })}
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
        ))}
      </div>

      {/* --- MODAL TAMBAH/EDIT SOAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--card)] rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[var(--border)]">
            {/* Modal Header */}
            <div className="p-6 border-b border-[var(--border)] flex justify-between items-center">
              <h2 className="text-xl font-bold text-[var(--foreground)]">
                {editingId ? "Edit Soal" : `Tambah Soal ${formType}`}
              </h2>
              <button
                onClick={closeModal}
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
                  setTeksSoal((prev) => prev ? `${prev} ${latex}` : latex);
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
                      <option key={k.id} value={k.id}>{k.nomerKompetensi} - {k.isiKompetensi.substring(0, 40)}...</option>
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
                            const url = await handleUploadImage(file);
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

      {/* --- MODAL UPLOAD PDF BAB --- */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center pb-2 border-b border-[var(--border)]">
              <h3 className="text-lg font-bold text-[var(--foreground)]">
                Upload PDF Materi Bab
              </h3>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-[var(--muted-foreground)]">
              Upload file PDF materi khusus untuk bab ini. AI akan mengekstrak tujuan pembelajaran, mengolah gambar, dan membuat bank soal reference.
            </p>
            <div className="space-y-3">
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
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Jumlah Soal yang Dihasilkan
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={jumlahSoalPdf}
                  onChange={(e) => setJumlahSoalPdf(Number(e.target.value))}
                  className="w-full p-2.5 rounded-lg border border-[var(--input)] bg-[var(--card)] text-[var(--card-foreground)] focus:ring-2 focus:ring-[var(--ring)] focus:outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="px-4 py-2 rounded-lg text-sm text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
              >
                Batal
              </button>
              <button
                disabled={!selectedPdfFile || isUploadingPdf}
                onClick={async () => {
                  if (selectedPdfFile) {
                    setIsUploadingPdf(true);
                    try {
                      await handleUploadBabPdf(selectedPdfFile, jumlahSoalPdf);
                      setIsUploadModalOpen(false);
                      setSelectedPdfFile(null);
                      alert("PDF berhasil diunggah! AI sedang memproses bab di latar belakang.");
                    } catch (err) {
                      alert("Gagal mengunggah PDF.");
                    } finally {
                      setIsUploadingPdf(false);
                    }
                  }
                }}
                className="px-4 py-2 rounded-lg text-sm bg-[var(--primary)] text-[var(--primary-foreground)] font-medium hover:opacity-90 disabled:opacity-50"
              >
                {isUploadingPdf ? "Mengunggah..." : "Upload & Proses AI"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* --- MODAL GENERATE SOAL AI --- */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center pb-2 border-b border-[var(--border)]">
              <h3 className="text-lg font-bold text-[var(--foreground)]">
                Generate Soal Otomatis (AI)
              </h3>
              <button
                onClick={() => setIsGenerateModalOpen(false)}
                className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-sm text-[var(--muted-foreground)]">
              AI akan secara otomatis membuat bank soal pilihan ganda dan essay sesuai indikator & taksonomi Bloom pada bab ini.
            </p>

            {isGeneratingSoal && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 rounded-lg text-xs font-medium flex items-center gap-2">
                <Loader2 className="animate-spin shrink-0" size={16} />
                <span>Pembuatan soal sedang berjalan di latar belakang...</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Jumlah Soal yang Ingin Dibuat di Tiap Kompetensi
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={jumlahSoalGen}
                  onChange={(e) => setJumlahSoalGen(Number(e.target.value))}
                  disabled={isGeneratingSoal || isSubmittingGen}
                  className="w-full p-2.5 rounded-lg border border-[var(--input)] bg-[var(--card)] text-[var(--card-foreground)] focus:ring-2 focus:ring-[var(--ring)] focus:outline-none disabled:opacity-50"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsGenerateModalOpen(false)}
                className="px-4 py-2 rounded-lg text-sm text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
              >
                Batal
              </button>
              <button
                disabled={isGeneratingSoal || isSubmittingGen}
                onClick={async () => {
                  setIsSubmittingGen(true);
                  try {
                    await handleGenerateQuestion(jumlahSoalGen);
                    setIsGenerateModalOpen(false);
                  } catch (err) {
                    alert("Gagal memulai pembuatan soal.");
                  } finally {
                    setIsSubmittingGen(false);
                  }
                }}
                className="px-4 py-2 rounded-lg text-sm bg-green-600 text-white font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
              >
                {isGeneratingSoal || isSubmittingGen ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span>creating soal...</span>
                  </>
                ) : (
                  "Mulai Generate Soal"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
