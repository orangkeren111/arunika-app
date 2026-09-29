"use server";

import prisma from "./prisma";

export async function getAdminSchoolPaymentHistory(sekolahId: number) {
  const school = await prisma.sekolah.findUnique({
    where: { id: sekolahId },
    include: {
      pembayaran: {
        orderBy: { tanggalBayar: "desc" },
      },
    },
  });

  if (!school) {
    throw new Error("Sekolah tidak ditemukan.");
  }

  const now = new Date();
  const isPastDue = !school.aktifSampai || new Date(school.aktifSampai) < now;

  return {
    school: {
      id: school.id,
      namaSekolah: school.namaSekolah,
      aktifSampai: school.aktifSampai,
      tier: school.tier,
      isPastDue,
    },
    pembayaran: school.pembayaran.map((p) => ({
      id: p.id,
      jumlahBulan: p.jumlahBulan,
      tanggalBayar: p.tanggalBayar,
      nominal: p.nominal,
    })),
  };
}
