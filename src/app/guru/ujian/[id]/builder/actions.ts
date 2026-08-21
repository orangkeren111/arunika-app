"use server";

import prisma from "@/src/lib/services/db/prisma";

export async function getKompetensiForBabs(babIds: number[]) {
  return await prisma.kompetensiBab.findMany({
    where: { babId: { in: babIds } },
    orderBy: { nomerKompetensi: "asc" },
  });
}

export async function getAvailableSoalCounts(babIds: number[]) {
  const result = await prisma.bankSoal.groupBy({
    by: ["kompetensiBabId"],
    where: { 
      babId: { in: babIds },
      isAccepted: true,
      isRejected: false,
    },
    _count: { id: true },
  });
  
  return result.map((r) => ({
    kompetensiBabId: r.kompetensiBabId,
    count: r._count.id,
  }));
}
