"use server";

import prisma from "../prisma";
import { Prisma, Role } from "@prisma/client/index-browser";

export async function getStats() {
  const [totalUsers, totalKelas, totalSiswa, totalGuru] = await Promise.all([
    prisma.user.count(),
    prisma.kelas.count(),
    prisma.user.count({ where: { role: Role.SISWA } }),
    prisma.user.count({ where: { role: Role.GURU } }),
  ]);
  return { totalUsers, totalKelas, totalSiswa, totalGuru };
}

// --- USERS ---

export async function getUsers(sekolah_id: number) {
  return await prisma.user.findMany({
    where: {
      sekolahId: sekolah_id,
    },
    orderBy: { id: "asc" },
  });
}
export async function getPilihanSiswaKelas(
  sekolah_id: number,
  kelas_id: number,
) {
  return await prisma.user.findMany({
    where: {
      sekolahId: sekolah_id,
      role: "SISWA",
      keanggotaan: {
        none: {
          kelasId: kelas_id,
        },
      },
    },
    orderBy: { id: "asc" },
  });
}

export async function getTeachers(sekolah_id: number) {
  return await prisma.user.findMany({
    where: {
      sekolahId: sekolah_id,
      role: "GURU",
    },
    orderBy: { id: "asc" },
  });
}

export async function addUser(data: Prisma.UserCreateInput) {
  return await prisma.user.create({ data });
}

export async function updateUser(id: number, data: Prisma.UserUpdateInput) {
  return await prisma.user.update({
    where: { id },
    data,
  });
}

export async function deleteUser(id: number) {
  await prisma.user.delete({ where: { id } });
  return true;
}

// --- KELAS ---

export async function getKelas(sekolah_id: number) {
  return await prisma.kelas.findMany({
    include: {
      _count: { select: { members: true } },
      teacher: true,
    },
    where: {
      sekolahId: sekolah_id,
    },
    orderBy: { id: "asc" },
  });
}

export async function addKelas(data: Prisma.KelasCreateInput) {
  return await prisma.kelas.create({ data });
}

export async function updateKelas(id: number, data: Prisma.KelasUpdateInput) {
  return await prisma.kelas.update({
    where: { id },
    data,
  });
}

export async function deleteKelas(id: number) {
  await prisma.kelas.delete({ where: { id } });
  return true;
}

// --- MEMBERS MANAGEMENT ---

export async function getKelasMembers(kelasId: number) {
  return await prisma.kelas.findUnique({
    where: { id: kelasId },
    include: {
      members: {
        include: { user: true },
      },
      teacher: true,
    },
  });
}

// --db
export async function addSiswaKeKelas({
  kelasId,
  siswaId,
}: {
  kelasId: number;
  siswaId: number;
}) {
  const existingMember = await prisma.kelasMember.findFirst({
    where: {
      kelasId: kelasId,
      userId: siswaId,
    },
  });

  if (existingMember) {
    return existingMember;
  }

  return await prisma.kelasMember.create({
    data: {
      kelasId: kelasId,
      userId: siswaId,
    },
  });
}
export async function removeSiswaFromKelas({
  kelasId,
  siswaId,
}: {
  kelasId: number;
  siswaId: number;
}) {
  await prisma.kelasMember.deleteMany({
    where: {
      kelasId: kelasId,
      userId: siswaId,
    },
  });
}
