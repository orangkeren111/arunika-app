"use client";

import React from "react";
import { DataTable, ColumnDef } from "@/src/components/DataTable";

interface KompetensiPelajaran {
  id: number;
  nomerKompetensi: string;
  isiKompetensi: string;
  namaBab: string;
  namaBuku: string;
}

const columns: ColumnDef<KompetensiPelajaran>[] = [
  {
    accessorKey: "namaBuku",
    header: "Buku / Pelajaran",
  },
  {
    accessorKey: "namaBab",
    header: "Bab",
  },
  {
    accessorKey: "nomerKompetensi",
    header: "Kode",
    cell: ({ row }) => (
      <span className="font-mono font-bold text-[var(--primary)]">
        {row.original.nomerKompetensi}
      </span>
    ),
  },
  {
    accessorKey: "isiKompetensi",
    header: "Isi Kompetensi",
    cell: ({ row }) => (
      <div className="line-clamp-3 hover:line-clamp-none max-w-md cursor-pointer transition-all duration-200">
        {row.original.isiKompetensi}
      </div>
    ),
  },
];

export function KurikulumTableClient({ data }: { data: KompetensiPelajaran[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchPlaceholder="Cari berdasarkan buku, bab, atau kode..."
    />
  );
}
