"use server"
import { Tingkat } from "@/src/app/types/admin";
import prisma from "../prisma";
import bcrypt from "bcryptjs";

type SubscriptionTier = "FREE" | "BOOK_ONLY" | "PREMIUM";
export async function getSchoolsWithStats() {
  const schools = await prisma.sekolah.findMany({
    include: {
      users: true,
      kelas: true,
      pembayaran: {
        orderBy: { tanggalBayar: "desc" },
      },
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

  const now = new Date();

  return schools.map((school) => {
    // 1. Calculate GenerationJob tokens
    const schoolJobs = jobs.filter((j) => j.buku?.guru?.sekolahId === school.id);
    const genTokens = schoolJobs.reduce((sum, j) => sum + (j.tokensSpent || 0), 0);

    // 2. Calculate TaskQueue tokens (find attempts by school students)
    const schoolStudentIds = school.users.filter((u) => u.role === "SISWA" || u.role === "GURU").map((u) => u.id);
    const schoolAttempts = attempts.filter((att) => schoolStudentIds.includes(att.siswaId));
    const schoolAttemptIds = schoolAttempts.map((att) => att.id);

    const reportTokens = tasks.reduce((sum, task) => {
      const payload = task.payload as any;
      if (payload && payload.attemptId && schoolAttemptIds.includes(Number(payload.attemptId))) {
        return sum + (task.tokensSpent || 0);
      }
      return sum;
    }, 0);

    // 3. Calculate Payment Status
    const isPastDue = !school.aktifSampai || new Date(school.aktifSampai) < now;
    const paymentStatus: "ACTIVE" | "PAST_DUE" = isPastDue ? "PAST_DUE" : "ACTIVE";

    // 4. Find primary Admin user if any
    const adminUser = school.users.find((u) => u.role === "ADMIN");

    return {
      id: school.id,
      name: school.namaSekolah,
      isRetired: school.isRetired,
      address: school.alamat || "",
      tingkat: school.tingkat,
      tier: school.tier,
      aktifSampai: school.aktifSampai,
      paymentStatus,
      userCount: school.users.length,
      classCount: school.kelas.length,
      totalTokensSpent: genTokens + reportTokens,
      adminUser: adminUser
        ? {
          id: adminUser.id,
          name: adminUser.name,
          email: adminUser.email,
        }
        : null,
      latestPembayaran: school.pembayaran[0] || null,
    };
  });
}

export async function createSchool(
  namaSekolah: string,
  alamat?: string,
  tingkat?: Tingkat,
  tier?: SubscriptionTier,
  adminData?: { name: string; email: string; password?: string },
  paymentPlan?: { jumlahBulan: number; nominal?: number }
) {
  let aktifSampai: Date | null = null;
  if (paymentPlan && paymentPlan.jumlahBulan > 0) {
    aktifSampai = new Date();
    aktifSampai.setMonth(aktifSampai.getMonth() + paymentPlan.jumlahBulan);
  }

  const school = await prisma.sekolah.create({
    data: {
      namaSekolah,
      alamat,
      tingkat: tingkat || "SD",
      tier: tier || "FREE",
      aktifSampai,
    },
  });

  if (paymentPlan && paymentPlan.jumlahBulan > 0) {
    await prisma.pembayaran.create({
      data: {
        sekolahId: school.id,
        jumlahBulan: paymentPlan.jumlahBulan,
        nominal: paymentPlan.nominal || 0,
      },
    });
  }

  if (adminData && adminData.email) {
    const rawPassword = adminData.password || "admin123";
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    await prisma.user.create({
      data: {
        name: adminData.name || "School Admin",
        email: adminData.email,
        password: hashedPassword,
        role: "ADMIN",
        sekolahId: school.id,
      },
    });
  }

  return school;
}

export async function updateSchool(
  id: number,
  namaSekolah: string,
  alamat?: string,
  tier?: SubscriptionTier,
  adminData?: { name?: string; email?: string; password?: string },
  paymentPlan?: { addMonths?: number; nominal?: number; aktifSampai?: string }
) {
  const currentSchool = await prisma.sekolah.findUnique({
    where: { id },
    include: { users: true },
  });

  if (!currentSchool) throw new Error("Sekolah tidak ditemukan.");

  let updatedAktifSampai = currentSchool.aktifSampai;

  if (paymentPlan) {
    if (paymentPlan.aktifSampai) {
      updatedAktifSampai = new Date(paymentPlan.aktifSampai);
    } else if (paymentPlan.addMonths && paymentPlan.addMonths > 0) {
      const baseDate = currentSchool.aktifSampai && new Date(currentSchool.aktifSampai) > new Date()
        ? new Date(currentSchool.aktifSampai)
        : new Date();
      baseDate.setMonth(baseDate.getMonth() + paymentPlan.addMonths);
      updatedAktifSampai = baseDate;

      await prisma.pembayaran.create({
        data: {
          sekolahId: id,
          jumlahBulan: paymentPlan.addMonths,
          nominal: paymentPlan.nominal || 0,
        },
      });
    }
  }

  const updatedSchool = await prisma.sekolah.update({
    where: { id },
    data: {
      namaSekolah,
      alamat,
      aktifSampai: updatedAktifSampai,
      tier: tier || currentSchool.tier,
    },
  });

  // Upsert admin user if admin email is provided
  if (adminData && adminData.email) {
    const existingAdmin = currentSchool.users.find((u) => u.role === "ADMIN");

    if (existingAdmin) {
      const updateData: any = {
        name: adminData.name || existingAdmin.name,
        email: adminData.email,
      };
      if (adminData.password && adminData.password.trim() !== "") {
        updateData.password = await bcrypt.hash(adminData.password, 10);
      }

      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: updateData,
      });
    } else {
      const rawPassword = adminData.password || "admin123";
      const hashedPassword = await bcrypt.hash(rawPassword, 10);

      await prisma.user.create({
        data: {
          name: adminData.name || "School Admin",
          email: adminData.email,
          password: hashedPassword,
          role: "ADMIN",
          sekolahId: id,
        },
      });
    }
  }

  return updatedSchool;
}

export async function addSchoolPayment(
  sekolahId: number,
  jumlahBulan: number,
  nominal?: number
) {
  const school = await prisma.sekolah.findUnique({ where: { id: sekolahId } });
  if (!school) throw new Error("Sekolah tidak ditemukan.");

  const baseDate = school.aktifSampai && new Date(school.aktifSampai) > new Date()
    ? new Date(school.aktifSampai)
    : new Date();

  baseDate.setMonth(baseDate.getMonth() + jumlahBulan);

  const payment = await prisma.pembayaran.create({
    data: {
      sekolahId,
      jumlahBulan,
      nominal: nominal || 0,
    },
  });

  await prisma.sekolah.update({
    where: { id: sekolahId },
    data: {
      aktifSampai: baseDate,
    },
  });

  return payment;
}

export async function deleteSchool(id: number) {
  return await prisma.sekolah.update({
    where: { id },
    data: {
      isRetired: true,
    },
  });
}

export async function activateSchool(id: number) {
  return await prisma.sekolah.update({
    where: { id },
    data: {
      isRetired: false,
    },
  });
}

export async function getSchoolMembers(sekolahId: number) {
  return await prisma.user.findMany({
    where: { sekolahId },
    orderBy: { role: "asc" },
  });
}

export async function getSchoolDetailStats(sekolahId: number) {
  const school = await prisma.sekolah.findUnique({
    where: { id: sekolahId },
    include: {
      users: true,
      kelas: true,
      pembayaran: {
        orderBy: { tanggalBayar: "desc" },
      },
    },
  });

  if (!school) {
    throw new Error("Sekolah tidak ditemukan.");
  }

  // Fetch all jobs belonging to teachers in this school
  const schoolJobs = await prisma.generationJob.findMany({
    where: {
      buku: {
        guru: {
          sekolahId,
        },
      },
    },
    include: {
      buku: {
        include: {
          guru: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Fetch TaskQueue items related to students in this school
  const studentIds = school.users.filter((u) => u.role === "SISWA").map((u) => u.id);
  const attempts = await prisma.sesiUjianSiswa.findMany({
    where: { siswaId: { in: studentIds } },
    select: { id: true },
  });
  const attemptIds = attempts.map((a) => a.id);

  const allTasks = await prisma.taskQueue.findMany({
    orderBy: { createdAt: "desc" },
  });

  const schoolTasks = allTasks.filter((t) => {
    const payload = t.payload as any;
    if (payload && payload.attemptId && attemptIds.includes(Number(payload.attemptId))) {
      return true;
    }
    // Also include pdf extraction tasks if bab/buku is in this school
    return false;
  });

  // Calculate token usage by timeframe (Week, Month, All-Time)
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  let tokensThisWeek = 0;
  let tokensThisMonth = 0;
  let tokensAllTime = 0;

  schoolJobs.forEach((job) => {
    const tokens = job.tokensSpent || 0;
    const createdAt = new Date(job.createdAt);

    tokensAllTime += tokens;
    if (createdAt >= oneMonthAgo) tokensThisMonth += tokens;
    if (createdAt >= oneWeekAgo) tokensThisWeek += tokens;
  });

  schoolTasks.forEach((task) => {
    const tokens = task.tokensSpent || 0;
    const createdAt = new Date(task.createdAt);

    tokensAllTime += tokens;
    if (createdAt >= oneMonthAgo) tokensThisMonth += tokens;
    if (createdAt >= oneWeekAgo) tokensThisWeek += tokens;
  });

  // Status breakdown for GenerationJob
  const genJobStatusCount: Record<string, number> = {};
  schoolJobs.forEach((j) => {
    genJobStatusCount[j.status] = (genJobStatusCount[j.status] || 0) + 1;
  });

  // Status breakdown for TaskQueue
  const taskQueueStatusCount: Record<string, number> = {};
  schoolTasks.forEach((t) => {
    taskQueueStatusCount[t.status] = (taskQueueStatusCount[t.status] || 0) + 1;
  });

  // Activity over last 14 days
  const last14DaysMap: Record<string, { date: string; jobs: number; tokens: number }> = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split("T")[0];
    last14DaysMap[dateStr] = { date: dateStr, jobs: 0, tokens: 0 };
  }

  schoolJobs.forEach((j) => {
    const dateStr = new Date(j.createdAt).toISOString().split("T")[0];
    if (last14DaysMap[dateStr]) {
      last14DaysMap[dateStr].jobs += 1;
      last14DaysMap[dateStr].tokens += j.tokensSpent || 0;
    }
  });

  return {
    school: {
      id: school.id,
      name: school.namaSekolah,
      address: school.alamat,
      isRetired: school.isRetired,
      aktifSampai: school.aktifSampai,
      tier: school.tier,
    },
    pembayaranHistory: school.pembayaran.map((p) => ({
      id: p.id,
      jumlahBulan: p.jumlahBulan,
      tanggalBayar: p.tanggalBayar,
      nominal: p.nominal,
    })),
    counts: {
      membersCount: school.users.length,
      teachersCount: school.users.filter((u) => u.role === "GURU").length,
      studentsCount: school.users.filter((u) => u.role === "SISWA").length,
      adminsCount: school.users.filter((u) => u.role === "ADMIN").length,
      classesCount: school.kelas.length,
      genJobsCount: schoolJobs.length,
      tasksCount: schoolTasks.length,
    },
    tokens: {
      thisWeek: tokensThisWeek,
      thisMonth: tokensThisMonth,
      allTime: tokensAllTime,
    },
    genJobStatus: Object.entries(genJobStatusCount).map(([status, count]) => ({ status, count })),
    taskQueueStatus: Object.entries(taskQueueStatusCount).map(([status, count]) => ({ status, count })),
    activityHistory: Object.values(last14DaysMap),
    members: school.users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
    })),
  };
}

/* ==========================================
 * LLM API Keys CRUD
 * ========================================== */
import { encryptApiKey } from "@/src/lib/utils/hasher";

export async function getApiKeys() {
  return await prisma.llmApiKey.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function createApiKey(data: {
  provider: string;
  name?: string;
  key: string;
  isActive?: boolean;
}) {
  const hashedKey = encryptApiKey(data.key);
  return await prisma.llmApiKey.create({
    data: {
      provider: data.provider.toUpperCase(),
      name: data.name || null,
      key: hashedKey,
      isActive: data.isActive !== undefined ? data.isActive : true,
    },
  });
}

export async function updateApiKey(
  id: string,
  data: {
    provider?: string;
    name?: string;
    key?: string;
    isActive?: boolean;
  }
) {
  const updateData: any = {};
  if (data.provider !== undefined) updateData.provider = data.provider.toUpperCase();
  if (data.name !== undefined) updateData.name = data.name;
  if (data.key !== undefined && data.key.trim() !== "") {
    updateData.key = encryptApiKey(data.key);
  }
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  return await prisma.llmApiKey.update({
    where: { id },
    data: updateData,
  });
}

export async function deleteApiKey(id: string) {
  return await prisma.llmApiKey.delete({
    where: { id },
  });
}

export async function toggleApiKeyStatus(id: string) {
  const existing = await prisma.llmApiKey.findUnique({ where: { id } });
  if (!existing) throw new Error("API Key tidak ditemukan");

  return await prisma.llmApiKey.update({
    where: { id },
    data: { isActive: !existing.isActive },
  });
}

/* ==========================================
 * LLM Task Routing CRUD
 * ========================================== */
export async function getTaskRoutings(taskTypeFilter?: string) {
  return await prisma.llmTaskRouting.findMany({
    where: taskTypeFilter && taskTypeFilter !== "ALL" ? { taskType: taskTypeFilter } : {},
    orderBy: [{ taskType: "asc" }, { priority: "asc" }],
  });
}

export async function createTaskRouting(data: {
  taskType: string;
  provider: string;
  modelName: string;
  priority: number;
  isActive?: boolean;
}) {
  return await prisma.llmTaskRouting.create({
    data: {
      taskType: data.taskType,
      provider: data.provider.toUpperCase(),
      modelName: data.modelName,
      priority: data.priority,
      isActive: data.isActive !== undefined ? data.isActive : true,
    },
  });
}

export async function updateTaskRouting(
  id: string,
  data: {
    taskType?: string;
    provider?: string;
    modelName?: string;
    priority?: number;
    isActive?: boolean;
  }
) {
  const updateData: any = {};
  if (data.taskType !== undefined) updateData.taskType = data.taskType;
  if (data.provider !== undefined) updateData.provider = data.provider.toUpperCase();
  if (data.modelName !== undefined) updateData.modelName = data.modelName;
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  return await prisma.llmTaskRouting.update({
    where: { id },
    data: updateData,
  });
}

export async function deleteTaskRouting(id: string) {
  return await prisma.llmTaskRouting.delete({
    where: { id },
  });
}

export async function toggleTaskRoutingStatus(id: string) {
  const existing = await prisma.llmTaskRouting.findUnique({ where: { id } });
  if (!existing) throw new Error("Task Routing tidak ditemukan");

  return await prisma.llmTaskRouting.update({
    where: { id },
    data: { isActive: !existing.isActive },
  });
}

