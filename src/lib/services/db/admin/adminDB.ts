"use server";

import prisma from "../prisma";
import { Prisma, Role } from "@prisma/client";
import fs from "fs/promises";
import path from "path";
import os from "os";

export async function getStats(sekolah_id: number) {
  const [totalUsers, totalKelas, totalSiswa, totalGuru] = await Promise.all([
    prisma.user.count({ where: { sekolahId: sekolah_id } }),
    prisma.kelas.count({ where: { sekolahId: sekolah_id } }),
    prisma.user.count({ where: { role: Role.SISWA, sekolahId: sekolah_id } }),
    prisma.user.count({ where: { role: Role.GURU, sekolahId: sekolah_id } }),
  ]);
  return { totalUsers, totalKelas, totalSiswa, totalGuru };
}

// --- USERS ---

export async function getUsers(sekolah_id: number) {
  return await prisma.user.findMany({
    where: {
      sekolahId: sekolah_id,
    },
    orderBy: {
      id: "asc",
    },
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
    orderBy: {
      id: "asc",
    },
  });
}

export async function getTeachers(sekolah_id: number) {
  return await prisma.user.findMany({
    where: {
      sekolahId: sekolah_id,
      role: "GURU",
    },
    orderBy: {
      id: "asc",
    },
  });
}

export async function addUser(data: Prisma.UserCreateInput) {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: data.email,
    },
  });

  if (existingUser) {
    throw new Error("Email sudah terdaftar. Gunakan email lain.");
  }

  return await prisma.user.create({
    data,
  });
}

export async function addUsersBatch(
  users: Prisma.UserCreateInput[],
  sekolahId: number,
) {
  return await prisma.$transaction(async (tx) => {
    const emails = users.map((user) => user.email);

    const existingUsers = await tx.user.findMany({
      where: {
        email: {
          in: emails,
        },
      },
      select: {
        email: true,
      },
    });

    const existingEmailSet = new Set(
      existingUsers.map((user) => user.email),
    );

    const duplicateInsideFile = new Set<string>();

    for (const email of emails) {
      if (duplicateInsideFile.has(email)) {
        throw new Error(
          `Email "${email}" muncul lebih dari satu kali pada file Excel.`,
        );
      }

      duplicateInsideFile.add(email);

      if (existingEmailSet.has(email)) {
        throw new Error(
          `Email "${email}" sudah terdaftar.`,
        );
      }
    }

    await tx.user.createMany({
      data: users.map((user) => ({
        name: user.name,
        email: user.email,
        password: user.password,
        role: user.role,
        sekolahId: sekolahId,
      })),
    });

    return users.length;
  });
}

export async function updateUser(
  id: number,
  data: Prisma.UserUpdateInput,
) {
  return await prisma.user.update({
    where: {
      id,
    },
    data,
  });
}

export async function resetUserPassword(
  id: number,
  password: string,
) {
  return await prisma.user.update({
    where: {
      id,
    },
    data: {
      password,
    },
  });
}

export async function deleteUser(id: number) {
  await prisma.user.delete({
    where: {
      id,
    },
  });

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
      isRetired: false,
    },
    orderBy: { id: "asc" },
  });
}

export async function addKelas(data: Prisma.KelasCreateInput) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let classCode = "";
  for (let i = 0; i < 8; i++) {
    classCode += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return await prisma.kelas.create({
    data: {
      ...data,
      classCode,
    },
  });
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

export async function retireKelas(id: number) {
  return await prisma.kelas.update({
    where: { id },
    data: { isRetired: true },
  });
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

export async function getKompetensiPelajaranList() {
  return await prisma.kompetensiPelajaran.findMany({
    orderBy: [{ namaBuku: "asc" }, { nomerKompetensi: "asc" }],
  });
}

// --- DASHBOARD CHARTS ---

export async function getDashboardChartData(sekolah_id: number) {
  // 1. GenerationJob status counts (jobs belonging to books created by teachers of this school)
  const jobStatusRaw = await prisma.generationJob.groupBy({
    by: ["status"],
    where: {
      buku: {
        guru: {
          sekolahId: sekolah_id,
        },
      },
    },
    _count: { status: true },
  });
  const jobStatusCounts = jobStatusRaw.map((r) => ({
    status: r.status as string,
    count: r._count.status,
  }));

  // 2. Top teachers by book count
  const topTeachersRaw = await prisma.buku.groupBy({
    by: ["guruId"],
    where: {
      guru: {
        sekolahId: sekolah_id,
      },
    },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 10,
  });

  const teacherIds = topTeachersRaw.map((r) => r.guruId);
  const teachers = await prisma.user.findMany({
    where: { id: { in: teacherIds } },
    select: { id: true, name: true },
  });
  const teacherMap = new Map(teachers.map((t) => [t.id, t.name]));

  const topTeachers = topTeachersRaw.map((r) => ({
    teacherName: teacherMap.get(r.guruId) ?? "Unknown",
    bookCount: r._count.id,
  }));

  // 3. Daily GenerationJob activity — last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentJobs = await prisma.generationJob.findMany({
    where: {
      createdAt: { gte: thirtyDaysAgo },
      buku: { guru: { sekolahId: sekolah_id } },
    },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const dayCountMap = new Map<string, number>();
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const key = d.toISOString().slice(0, 10);
    dayCountMap.set(key, 0);
  }
  for (const job of recentJobs) {
    const key = job.createdAt.toISOString().slice(0, 10);
    dayCountMap.set(key, (dayCountMap.get(key) ?? 0) + 1);
  }
  const dailyJobActivity = Array.from(dayCountMap.entries()).map(([date, count]) => ({
    date,
    count,
  }));

  // 4. TaskQueue status counts
  const taskQueueStatusRaw = await prisma.taskQueue.groupBy({
    by: ["status"],
    _count: { status: true },
  });
  const taskQueueStatusCounts = taskQueueStatusRaw.map((r) => ({
    status: r.status,
    count: r._count.status,
  }));

  return {
    jobStatusCounts,
    topTeachers,
    dailyJobActivity,
    taskQueueStatusCounts,
  };
}

// --- CONTROL PAGE ---

export async function getControlData(sekolah_id: number) {
  const generationJobs = await prisma.generationJob.findMany({
    where: {
      buku: { guru: { sekolahId: sekolah_id } },
    },
    include: {
      buku: {
        include: { guru: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const taskQueueItems = await prisma.taskQueue.findMany({
    orderBy: { createdAt: "desc" },
  });

  return {
    generationJobs: generationJobs.map((j) => ({
      id: j.id,
      status: j.status as string,
      fileName: j.fileName,
      attempts: j.attempts,
      errorMessage: j.errorMessage ?? null,
      bukuJudul: j.buku.judul,
      guruName: j.buku.guru.name,
      createdAt: j.createdAt.toISOString(),
      updatedAt: j.updatedAt.toISOString(),
      tokensSpent: j.tokensSpent,
    })),
    taskQueueItems: taskQueueItems.map((t) => ({
      id: t.id,
      type: t.type,
      status: t.status,
      provider: t.provider ?? null,
      attempts: t.attempts,
      errorLog: t.errorLog ?? null,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      tokensSpent: t.tokensSpent,
    })),
  };
}

export async function retryGenerationJob(id: number) {
  return await prisma.generationJob.update({
    where: { id },
    data: {
      status: "PENDING",
      attempts: 0,
      errorMessage: null,
      updatedAt: new Date(),
    },
  });
}

export async function retryTaskQueueItem(id: number) {
  return await prisma.taskQueue.update({
    where: { id },
    data: {
      status: "pending",
      attempts: 0,
      errorLog: null,
      lockedAt: null,
      updatedAt: new Date(),
    },
  });
}

export async function initiateKurikulumExtraction(formData: FormData) {
  try {
    const file = formData.get("pdfFile") as File;
    if (!file || file.type !== "application/pdf") {
      return { success: false, error: "File must be a valid PDF." };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const tempFileName = `${Date.now()}-${file.name}`;
    const tempFilePath = path.join(os.tmpdir(), "tmp", tempFileName);

    await fs.mkdir(path.dirname(tempFilePath), { recursive: true });
    await fs.writeFile(tempFilePath, buffer);

    const task = await prisma.taskQueue.create({
      data: {
        type: "extract_kurikulum",
        payload: {
          tempFilePath: tempFilePath,
          fileName: file.name,
        },
      },
    });

    return {
      success: true,
      taskId: task.id,
    };
  } catch (error) {
    console.error("Error initiating Kurikulum extraction:", error);
    return { success: false, error: "Failed to initialize upload job." };
  }
}
