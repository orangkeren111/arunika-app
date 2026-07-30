"use server"
import prisma from "../prisma";

export async function getSchoolsWithStats() {
  const schools = await prisma.sekolah.findMany({
    include: {
      users: true,
      kelas: true,
    },
    orderBy: { id: "asc" },
  });

  const jobs = await prisma.generationJob.findMany({
    include: {
      buku: {
        include: {
          guru: true,
        },
      },
    },
  });

  const tasks = await prisma.taskQueue.findMany();
  const attempts = await prisma.sesiUjianSiswa.findMany({
    include: {
      siswa: true,
    },
  });

  return schools.map((school) => {
    // 1. Calculate GenerationJob tokens
    const schoolJobs = jobs.filter((j) => j.buku.guru.sekolahId === school.id);
    const genTokens = schoolJobs.reduce((sum, j) => sum + (j.tokensSpent || 0), 0);

    // 2. Calculate TaskQueue tokens (find attempts by school students)
    const schoolStudentIds = school.users.filter((u) => u.role === "SISWA").map((u) => u.id);
    const schoolAttempts = attempts.filter((att) => schoolStudentIds.includes(att.siswaId));
    const schoolAttemptIds = schoolAttempts.map((att) => att.id);

    const reportTokens = tasks.reduce((sum, task) => {
      const payload = task.payload as any;
      if (payload && payload.attemptId && schoolAttemptIds.includes(Number(payload.attemptId))) {
        return sum + (task.tokensSpent || 0);
      }
      return sum;
    }, 0);

    return {
      id: school.id,
      name: school.namaSekolah,
      address: school.alamat || "",
      userCount: school.users.length,
      classCount: school.kelas.length,
      totalTokensSpent: genTokens + reportTokens,
    };
  });
}

export async function createSchool(namaSekolah: string, alamat?: string) {
  return await prisma.sekolah.create({
    data: {
      namaSekolah,
      alamat,
    },
  });
}

export async function updateSchool(id: number, namaSekolah: string, alamat?: string) {
  return await prisma.sekolah.update({
    where: { id },
    data: {
      namaSekolah,
      alamat,
    },
  });
}

export async function deleteSchool(id: number) {
  return await prisma.sekolah.delete({
    where: { id },
  });
}

export async function getSchoolMembers(sekolahId: number) {
  return await prisma.user.findMany({
    where: { sekolahId },
    orderBy: { role: "asc" },
  });
}
