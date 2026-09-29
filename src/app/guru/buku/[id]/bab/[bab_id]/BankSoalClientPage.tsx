"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Upload, FileSpreadsheet, MailWarning, AlertCircle } from "lucide-react";
import { useParams } from "next/navigation";

import { useSoalViewModel } from "./GuruSoalViewModel";
import { useOwnerGuard } from "@/src/lib/hooks/useOwnerGuard";
import { SoalCard } from "./SoalCard";
import { SoalFormModal } from "./SoalFormModal";
import { UploadPdfModal } from "./UploadPdfModal";
import { GenerateSoalModal } from "./GenerateSoalModal";
import { ImportExcelSoalModal } from "./ImportExcelSoalModal";

type TipeSoal = "MCQ" | "ESSAY";


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
    isLockedByExam,
    lockMessage,
    crudError,
    isErrorModalOpen,
    closeErrorModal,
    checkGenerationStatus,
    handleAddSoal,
    handleEditSoal,
    handleDeleteSoal,
    handleGenerateQuestion,
    handleAcceptSoal,
    handleRejectSoal,
    handleUploadImage,
    handleUploadBabPdf,
    handleUploadExcelSoal,
    selectedType,
    setSelectedType,
    selectedBloomLevel,
    setSelectedBloomLevel,
    selectedTag,
    setSelectedTag,
  } = useSoalViewModel(babId);

  useOwnerGuard({
    ownerId: (bab as any)?.buku?.guruId,
    allowedRole: "GURU",
    fallbackUrl: "/guru/buku",
    isLoadingResource: loading || !bab,
  });

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingSoal, setEditingSoal] = useState<any | null>(null);
  const [formModalType, setFormModalType] = useState<TipeSoal>("MCQ");

  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isUploadPdfModalOpen, setIsUploadPdfModalOpen] = useState(false);
  const [isImportExcelModalOpen, setIsImportExcelModalOpen] = useState(false);

  const openAddModal = (type: TipeSoal) => {
    setEditingSoal(null);
    setFormModalType(type);
    setIsFormModalOpen(true);
  };

  const openEditModal = (soal: any) => {
    setEditingSoal(soal);
    setFormModalType(soal.type as TipeSoal);
    setIsFormModalOpen(true);
  };

  const handleSaveModal = (data: {
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
  }) => {
    const parsedTags = data.tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    if (data.editingId) {
      handleEditSoal(data.editingId.toString(), {
        id: data.editingId.toString(),
        babId: bab?.id ?? "",
        type: data.formType,
        difficulty: data.difficulty,
        bloomLevel: data.bloomLevel,
        tags: parsedTags,
        text: data.teksSoal,
        options: data.opsiJawaban,
        correctAnswer: data.formType === "MCQ" ? data.opsiJawaban[data.jawabanBenarIndex] || "" : "",
        jawabanBenarEssay: data.formType === "ESSAY" ? data.jawabanBenarEssay : "",
        kompetensiBabId: data.kompetensiBabId || null,
        linkGambarSoal: data.linkGambarSoal || "",
      });
    } else {
      handleAddSoal(
        data.formType,
        data.teksSoal,
        data.difficulty,
        data.bloomLevel,
        data.formType === "MCQ" ? data.opsiJawaban : [],
        data.formType === "MCQ" ? data.opsiJawaban[data.jawabanBenarIndex] || "" : "",
        data.kompetensiBabId || null,
        data.linkGambarSoal || "",
        data.formType === "ESSAY" ? data.jawabanBenarEssay : "",
        parsedTags
      );
    }
    setIsFormModalOpen(false);
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
      {isLockedByExam && (
        <div className="mb-4 flex items-start gap-3 rounded-r-lg border-l-4 border-red-500 bg-red-50 p-3 sm:p-4 shadow-sm">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />

          <div className="flex min-w-0 flex-1 flex-col">
            <h3 className="text-sm font-semibold text-red-800">
              Action Required
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-red-700 break-words">
              {lockMessage}
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">{bab.title}</h1>
          <p className="text-[var(--muted-foreground)] mt-1">Kelola Soal Pilihan Ganda dan Essay.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setIsImportExcelModalOpen(true)}
            className="bg-emerald-600/10 text-emerald-600 border border-emerald-500/20 px-4 py-2 rounded-lg text-sm hover:bg-emerald-600/20 transition flex items-center gap-2 font-medium"
          >
            <FileSpreadsheet size={16} /> Import Excel
          </button>
          <button
            onClick={() => setIsUploadPdfModalOpen(true)}
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
            onClick={() => openAddModal("ESSAY")}
            className="bg-[var(--secondary)] text-[var(--secondary-foreground)] px-4 py-2 rounded-lg text-sm hover:opacity-90 transition flex items-center gap-2"
          >
            <Plus size={16} /> Essay
          </button>
          <button
            onClick={() => openAddModal("MCQ")}
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

      <div className="flex flex-wrap gap-3">
        <select
          value={selectedBloomLevel}
          onChange={(e) => setSelectedBloomLevel(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-foreground"
        >
          <option value="">Semua Bloom Level</option>
          <option value="C1">C1</option>
          <option value="C2">C2</option>
          <option value="C3">C3</option>
          <option value="C4">C4</option>
          <option value="C5">C5</option>
          <option value="C6">C6</option>
        </select>

        <select
          value={selectedType || ""}
          onChange={(e) => setSelectedType(e.target.value as TipeSoal | "")}
          className="rounded-lg border border-border bg-background px-3 py-2 text-foreground"
        >
          <option value="">Semua Tipe</option>
          <option value="MCQ">MCQ</option>
          <option value="ESSAY">ESSAY</option>
        </select>

        <input
          type="text"
          value={selectedTag}
          onChange={(e) => setSelectedTag(e.target.value)}
          placeholder="Cari berdasarkan tag/topik..."
          className="rounded-lg border border-border bg-background px-3 py-2 text-foreground text-sm flex-1 min-w-[200px]"
        />
      </div>

      {/* --- LIST SOAL --- */}
      <div className="space-y-4">
        {soalList.map((soal) => (
          <SoalCard
            key={soal.id}
            soal={soal}
            kompetensiList={kompetensiList}
            onAccept={handleAcceptSoal}
            onReject={handleRejectSoal}
            onEdit={openEditModal}
            onDelete={handleDeleteSoal}
          />
        ))}
      </div>

      {/* MODALS */}
      <SoalFormModal
        isOpen={isFormModalOpen}
        editingId={editingSoal ? Number(editingSoal.id) : null}
        soalToEdit={editingSoal}
        kompetensiList={kompetensiList}
        initialType={formModalType}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveModal}
        onUploadImage={handleUploadImage}
      />

      <UploadPdfModal
        isOpen={isUploadPdfModalOpen}
        onClose={() => setIsUploadPdfModalOpen(false)}
        onUpload={async (file, mcq, essay, ops) => {
          await handleUploadBabPdf(file, mcq, essay, ops);
        }}
      />

      <GenerateSoalModal
        isOpen={isGenerateModalOpen}
        isGeneratingSoal={isGeneratingSoal}
        onClose={() => setIsGenerateModalOpen(false)}
        onGenerate={async (n) => {
          await handleGenerateQuestion(n);
        }}
      />

      <ImportExcelSoalModal
        isOpen={isImportExcelModalOpen}
        kompetensiList={kompetensiList}
        onClose={() => setIsImportExcelModalOpen(false)}
        onImport={async (rows) => {
          await handleUploadExcelSoal(rows);
        }}
      />
    </div>
  );
}
