"use server";

import prisma from "@/src/lib/services/db/prisma";
import { revalidatePath } from "next/cache";

export async function getKompetensiBab(babId: number) {
  return await prisma.kompetensiBab.findMany({
    where: { babId },
    orderBy: { nomerKompetensi: "asc" },
  });
}

export async function upsertKompetensiBab(payload: {
  id?: number;
  babId: number;
  nomerKompetensi: string;
  isiKompetensi: string;
  kompetensiPelajaranId?: number;
}) {
  if (payload.id) {
    await prisma.kompetensiBab.update({
      where: { id: payload.id },
      data: {
        nomerKompetensi: payload.nomerKompetensi,
        isiKompetensi: payload.isiKompetensi,
        kompetensiPelajaranId: payload.kompetensiPelajaranId || null,
      },
    });
  } else {
    await prisma.kompetensiBab.create({
      data: {
        babId: payload.babId,
        nomerKompetensi: payload.nomerKompetensi,
        isiKompetensi: payload.isiKompetensi,
        kompetensiPelajaranId: payload.kompetensiPelajaranId || null,
      },
    });
  }
  revalidatePath(`/guru/buku/[id]/bab/${payload.babId}/kompetensi`);
}

export async function deleteKompetensiBab(id: number, babId: number) {
  await prisma.kompetensiBab.delete({
    where: { id },
  });
  revalidatePath(`/guru/buku/[id]/bab/${babId}/kompetensi`);
}

export async function getAvailablePelajaranBooks() {
  const result = await prisma.kompetensiPelajaran.groupBy({
    by: ["namaBuku"],
    orderBy: { namaBuku: "asc" },
  });
  return result.map((r) => r.namaBuku);
}

export async function getAvailablePelajaranChapters(bookName: string) {
  const result = await prisma.kompetensiPelajaran.groupBy({
    by: ["namaBab"],
    where: { namaBuku: bookName },
    orderBy: { namaBab: "asc" },
  });
  return result.map((r) => r.namaBab);
}

export async function getKompetensiPelajaran(bookName: string, chapterName: string) {
  return await prisma.kompetensiPelajaran.findMany({
    where: {
      namaBuku: bookName,
      namaBab: chapterName,
    },
    orderBy: { nomerKompetensi: "asc" },
  });
}

export async function linkKompetensiPelajaranToBab(
  babId: number,
  competencyPelajaranIds: number[]
) {
  const sourceCompetencies = await prisma.kompetensiPelajaran.findMany({
    where: { id: { in: competencyPelajaranIds } },
  });

  for (const comp of sourceCompetencies) {
    await prisma.kompetensiBab.create({
      data: {
        babId,
        nomerKompetensi: comp.nomerKompetensi,
        isiKompetensi: comp.isiKompetensi,
        kompetensiPelajaranId: comp.id,
      },
    });
  }
  revalidatePath(`/guru/buku/[id]/bab/${babId}/kompetensi`);
}
