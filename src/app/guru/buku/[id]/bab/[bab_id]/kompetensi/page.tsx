import React from "react";
import prisma from "@/src/lib/services/db/prisma";
import KompetensiClientPage from "./KompetensiClientPage";
import { guruRepository } from "@/src/lib/repositories/guruRepository";

export const dynamic = "force-dynamic";

export default async function BabKompetensiPage({
  params,
}: {
  params: Promise<{ id: string; bab_id: string }>;
}) {
  const resolvedParams = await params;
  const babId = Number(resolvedParams.bab_id);
  const bookId = Number(resolvedParams.id);

  // Fetch bab details
  const bab = await prisma.bab.findUnique({
    where: { id: babId },
    include: { buku: true },
  });

  if (!bab) {
    return <div className="p-8 text-center text-red-500">Bab tidak ditemukan.</div>;
  }

  // Fetch competencies for this chapter
  const competencies = await prisma.kompetensiBab.findMany({
    where: { babId },
    orderBy: { nomerKompetensi: "asc" },
  });

  // Fetch books list for linking
  const books = await guruRepository.getAvailablePelajaranBooks();

  return (
    <KompetensiClientPage
      babId={babId}
      bookId={bookId}
      babTitle={bab.judulBab}
      bookTitle={bab.buku.judul}
      initialCompetencies={competencies}
      availableBooks={books}
    />
  );
}
