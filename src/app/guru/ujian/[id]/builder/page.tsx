"use client";

import { use } from "react";
import { ArrowLeft, CheckSquare, Square } from "lucide-react";
import { useFormUjianViewModel } from "./GuruFormUjianViewModel";
import { useOwnerGuard } from "@/src/lib/hooks/useOwnerGuard";
import Link from "next/link";

export default function ExamBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);

  const {
    isOwner,
    loading,
    template,
    setTemplate,
    babList,
    bukuList,
    selectedBuku,
    setSelectedBuku,
    activeBabs,
    handleToggleBab,
    selectedQuestions,
    handleSaveTemplate,
    templateKompetensi,
    setTemplateKompetensi,
    availableSoalCounts,
  } = useFormUjianViewModel(resolvedParams.id);

  useOwnerGuard({
    isAuthorized: resolvedParams.id === "new" || isOwner,
    allowedRole: "GURU",
    fallbackUrl: "/guru/ujian",
    isLoadingResource: loading,
  });

  const derivedTotalQuestions = templateKompetensi.reduce(
    (sum, tk) => sum + (tk.isEnabled ? tk.jumlahSoal : 0),
    0,
  );

  return (<div className="flex flex-col gap-6 pb-6">
    {/* HEADER */} <div>
      <Link href="/guru/ujian" className="flex items-center gap-2 w-fit mb-4">
        <ArrowLeft className="h-5 w-5 text-[var(--muted-foreground)]" />
        Kembali
      </Link>
      <h1 className="text-2xl font-bold text-[var(--foreground)]">
        Exam Builder: {template?.title || "Ujian Baru"} </h1> <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        Lengkapi detail ujian dan pilih bab untuk menentukan soal yang
        digunakan. </p> </div>

    {/* FORM PENGATURAN UJIAN */}
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {/* Judul */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
            Judul Ujian
          </label>

          <input
            type="text"
            value={template?.title || ""}
            onChange={(e) =>
              setTemplate((prev) =>
                prev ? { ...prev, title: e.target.value } : undefined,
              )
            }
            placeholder="Contoh: Ujian Tengah Semester"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] p-2.5 text-sm text-[var(--foreground)] outline-none transition-shadow focus:ring-2 focus:ring-[var(--primary)]"
          />
        </div>

        {/* Durasi */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
            Durasi (Menit)
          </label>

          <input
            type="number"
            min="1"
            value={template?.durasiMenit || ""}
            onChange={(e) =>
              setTemplate((prev) =>
                prev
                  ? { ...prev, durasiMenit: Number(e.target.value) }
                  : undefined,
              )
            }
            placeholder="Contoh: 90"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] p-2.5 text-sm text-[var(--foreground)] outline-none transition-shadow focus:ring-2 focus:ring-[var(--primary)]"
          />
        </div>

        {/* Tipe Ujian */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
            Tipe Ujian (Metode)
          </label>

          <div className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--background)] p-1">
            <button
              type="button"
              onClick={() =>
                setTemplate((prev) =>
                  prev ? { ...prev, isAdaptive: true } : undefined,
                )
              }
              className={`flex-1 rounded-md px-2 py-2 text-xs font-bold transition ${template?.isAdaptive !== false
                ? "bg-[var(--primary)] text-white shadow-sm"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
            >
              Adaptif (DDA)
            </button>

            <button
              type="button"
              onClick={() =>
                setTemplate((prev) =>
                  prev ? { ...prev, isAdaptive: false } : undefined,
                )
              }
              className={`flex-1 rounded-md px-2 py-2 text-xs font-bold transition ${template?.isAdaptive === false
                ? "bg-[var(--secondary)] text-white shadow-sm"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
            >
              Non-Adaptif
            </button>
          </div>

          {/* Adaptive explanation */}
          <div className="mt-2 rounded-lg bg-[var(--muted)] p-2.5">
            <p className="text-[11px] leading-relaxed text-[var(--muted-foreground)]">
              {template?.isAdaptive !== false ? (
                <>
                  <span className="font-semibold text-[var(--foreground)]">
                    Mengapa N+5?
                  </span>{" "}
                  Sistem adaptif membutuhkan beberapa soal cadangan agar DDA
                  dapat menyesuaikan tingkat kesulitan berdasarkan performa
                  siswa. Lima soal tambahan memberi sistem ruang untuk
                  memilih soal berikutnya tanpa kehabisan kandidat.
                </>
              ) : (
                <>
                  <span className="font-semibold text-[var(--foreground)]">
                    Mode acak.
                  </span>{" "}
                  Sistem akan memilih sejumlah N soal secara acak tanpa
                  melakukan penyesuaian tingkat kesulitan secara dinamis.
                </>
              )}
            </p>
          </div>
        </div>

        {/* Total Soal */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
            Jumlah Soal Target
          </label>

          <input
            type="number"
            readOnly
            value={derivedTotalQuestions}
            className="w-full cursor-not-allowed rounded-lg border border-[var(--border)] bg-[var(--muted)] p-2.5 text-sm text-[var(--foreground)] outline-none"
          />

          <p className="mt-1.5 text-xs text-[var(--muted-foreground)]">
            Soal terpilih: {selectedQuestions?.length || 0}
          </p>
        </div>
      </div>

      {/* KOMPETENSI */}
      <div className="mt-6 border-t border-[var(--border)] pt-5">
        <div className="mb-3">
          <h3 className="text-sm font-bold text-[var(--foreground)]">
            Kriteria Jumlah Soal per Kompetensi Bab
          </h3>

          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            Aktifkan kompetensi dan tentukan jumlah soal yang ingin
            digunakan.
          </p>
        </div>

        {templateKompetensi.length === 0 ? (
          <div className="rounded-lg bg-[var(--muted)] p-4 text-center">
            <p className="text-xs text-[var(--muted-foreground)]">
              Pilih bab terlebih dahulu untuk memuat kompetensi yang dapat
              diatur.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)] text-left text-xs uppercase text-[var(--muted-foreground)]">
                  <th className="px-3 py-2.5 font-semibold">Aktif</th>
                  <th className="px-3 py-2.5 font-semibold">Kode</th>
                  <th className="px-3 py-2.5 font-semibold">
                    Isi Kompetensi
                  </th>
                  <th className="px-3 py-2.5 font-semibold">Jumlah Soal</th>
                  <th className="px-3 py-2.5 font-semibold">
                    Total Poin (Essay)
                  </th>
                  <th className="px-3 py-2.5 font-semibold">Tersedia</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[var(--border)]">
                {templateKompetensi.map((tk, idx) => {
                  const available =
                    availableSoalCounts.find(
                      (x) => x.kompetensiBabId === tk.kompetensiBabId,
                    )?.count ?? 0;

                  const isAdaptiveMode =
                    template?.isAdaptive !== false;

                  const required = isAdaptiveMode
                    ? tk.jumlahSoal + 5
                    : tk.jumlahSoal;

                  const isSufficient = available >= required;

                  return (
                    <tr
                      key={tk.kompetensiBabId}
                      className="transition-colors hover:bg-[var(--muted)]/20"
                    >
                      <td className="px-3 py-2.5">
                        <input
                          type="checkbox"
                          checked={tk.isEnabled}
                          onChange={(e) => {
                            const newArr = [...templateKompetensi];
                            newArr[idx].isEnabled = e.target.checked;
                            setTemplateKompetensi(newArr);
                          }}
                          className="h-4 w-4 cursor-pointer"
                        />
                      </td>

                      <td className="px-3 py-2.5 font-mono font-bold text-[var(--primary)]">
                        {tk.nomerKompetensi}
                      </td>

                      <td className="max-w-xs truncate px-3 py-2.5 text-[var(--muted-foreground)]">
                        {tk.isiKompetensi}
                      </td>

                      <td className="px-3 py-2.5">
                        <input
                          type="number"
                          min="0"
                          disabled={!tk.isEnabled}
                          value={tk.jumlahSoal}
                          onChange={(e) => {
                            const newArr = [...templateKompetensi];
                            newArr[idx].jumlahSoal = Number(
                              e.target.value,
                            );
                            setTemplateKompetensi(newArr);
                          }}
                          className="w-20 rounded border border-[var(--border)] bg-[var(--background)] p-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </td>

                      <td className="px-3 py-2.5">
                        <input
                          type="number"
                          min="0"
                          disabled={!tk.isEnabled}
                          value={tk.totalPoint}
                          onChange={(e) => {
                            const newArr = [...templateKompetensi];
                            newArr[idx].totalPoint = Number(
                              e.target.value,
                            );
                            setTemplateKompetensi(newArr);
                          }}
                          className="w-20 rounded border border-[var(--border)] bg-[var(--background)] p-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </td>

                      <td className="px-3 py-2.5">
                        <span
                          className={`inline-flex whitespace-nowrap rounded px-2 py-1 text-xs font-semibold ${!tk.isEnabled
                            ? "bg-[var(--muted)] text-[var(--muted-foreground)]"
                            : isSufficient
                              ? "bg-green-500/10 text-green-600"
                              : "bg-red-500/10 text-red-500"
                            }`}
                        >
                          {available} / {required}{" "}
                          {isAdaptiveMode ? "(N+5)" : "(N)"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SAVE ACTION */}
      <div className="mt-6 flex flex-col gap-3 border-t border-[var(--border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--foreground)]">
            Siap menyimpan template?
          </p>
          <p className="text-xs text-[var(--muted-foreground)]">
            Pastikan jumlah soal dan sumber soal sudah sesuai.
          </p>
        </div>

        <button
          onClick={handleSaveTemplate}
          disabled={
            (selectedQuestions?.length === 0 ||
              !template?.title ||
              !template?.durasiMenit ||
              !derivedTotalQuestions) ||
            (!isOwner && template?.id !== "new")
          }
          className="w-full rounded-lg bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-[var(--primary-foreground)] shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          Simpan Template Ujian
        </button>
      </div>
    </div>

    {/* QUESTION WORKSPACE */}
    <div className="grid min-h-0 grid-cols-1 gap-6 lg:grid-cols-2">
      {/* SUMBER SOAL */}
      <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]">
        <div className="shrink-0 border-b border-[var(--border)] bg-[var(--muted)] p-4">
          <h3 className="font-semibold text-[var(--foreground)]">
            Sumber Soal
          </h3>

          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            Pilih buku dan bab yang menjadi sumber soal ujian.
          </p>

          <select
            value={selectedBuku}
            onChange={(e) => setSelectedBuku(e.target.value)}
            className="mt-3 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] p-2.5 text-sm text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--primary)]"
          >
            <option value="" disabled>
              -- Pilih Buku --
            </option>

            {bukuList?.map((buku) => (
              <option key={buku.id} value={buku.id}>
                {buku.title}
              </option>
            ))}
          </select>
        </div>

        {/* INDEPENDENT SCROLL */}
        <div className="max-h-[420px] flex-1 overflow-y-auto p-4 sm:max-h-[520px] lg:max-h-[600px]">
          <div className="space-y-3">
            {!selectedBuku ? (
              <p className="mt-4 text-center text-sm text-[var(--muted-foreground)]">
                Silakan pilih buku terlebih dahulu untuk melihat daftar bab.
              </p>
            ) : babList?.length === 0 ? (
              <p className="mt-4 text-center text-sm text-[var(--muted-foreground)]">
                Tidak ada bab tersedia di buku ini.
              </p>
            ) : (
              babList?.map((bab) => {
                const isSelected = activeBabs.includes(bab.id);

                return (
                  <button
                    key={bab.id}
                    type="button"
                    onClick={() => handleToggleBab(bab.id)}
                    className={`flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-all ${isSelected
                      ? "border-[var(--primary)] bg-[var(--primary)]/10"
                      : "border-[var(--border)] bg-[var(--background)] hover:border-[var(--primary)]/50"
                      }`}
                  >
                    <div
                      className={
                        isSelected
                          ? "shrink-0 text-[var(--primary)]"
                          : "shrink-0 text-[var(--muted-foreground)]"
                      }
                    >
                      {isSelected ? (
                        <CheckSquare size={20} />
                      ) : (
                        <Square size={20} />
                      )}
                    </div>

                    <span
                      className={`font-medium ${isSelected
                        ? "text-[var(--primary)]"
                        : "text-[var(--foreground)]"
                        }`}
                    >
                      {bab.title}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* SOAL TERPILIH */}
      <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[var(--primary)] bg-[var(--card)]">
        <div className="shrink-0 border-b border-[var(--border)] bg-[var(--primary)]/5 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold text-[var(--primary)]">
                Soal Terpilih untuk Ujian
              </h3>

              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                Daftar soal yang akan digunakan dalam template.
              </p>
            </div>

            <span
              className={`w-fit rounded-full px-2.5 py-1 text-xs font-bold ${selectedQuestions?.length &&
                selectedQuestions.length > derivedTotalQuestions
                ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                : "bg-red-500 text-white"
                }`}
            >
              {selectedQuestions?.length || 0} /{" "}
              {derivedTotalQuestions || "?"} Soal
            </span>
          </div>
        </div>

        {/* INDEPENDENT SCROLL */}
        <div className="max-h-[420px] flex-1 overflow-y-auto p-4 sm:max-h-[520px] lg:max-h-[600px]">
          <div className="space-y-3">
            {selectedQuestions?.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[var(--border)] p-6 text-center">
                <p className="text-sm text-[var(--muted-foreground)]">
                  Belum ada soal yang dipilih.
                </p>

                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  Centang bab di sebelah kiri untuk menambahkan soal.
                </p>
              </div>
            ) : (
              selectedQuestions.map((soal, index) => (
                <div
                  key={soal.id}
                  className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-3"
                >
                  <p className="text-sm leading-relaxed text-[var(--foreground)]">
                    <span className="mr-1 font-semibold">
                      {index + 1}.
                    </span>
                    {soal.text}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}
