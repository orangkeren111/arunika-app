import React from "react";
import { KurikulumTableClient } from "./KurikulumTableClient";
import KurikulumUploadForm from "./KurikulumUploadForm";
import { adminRepository } from "@/src/lib/repositories/adminRepository";

export const dynamic = "force-dynamic";

export default async function AdminKurikulumPage() {
  // Fetch curriculum list
  const listKompetensi = await adminRepository.getKompetensiPelajaranList();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Manajemen Kurikulum</h1>
        <p className="text-[var(--muted-foreground)]">
          Kelola bank kompetensi pelajaran (data-keeping kurikulum) untuk di-link ke bab-bab pelajaran.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Panel */}
        <div className="lg:col-span-1">
          <KurikulumUploadForm />
        </div>

        {/* Data Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4 shadow-sm">
            <div className="flex justify-between items-center pb-4 border-b border-[var(--border)] mb-4">
              <h2 className="text-lg font-bold text-[var(--foreground)]">Bank Kompetensi Pelajaran</h2>
              <span className="text-xs bg-[var(--muted)] text-[var(--muted-foreground)] px-2.5 py-1 rounded-full font-medium">
                {listKompetensi.length} Kompetensi
              </span>
            </div>
            
            <KurikulumTableClient data={listKompetensi} />
          </div>
        </div>
      </div>
    </div>
  );
}
