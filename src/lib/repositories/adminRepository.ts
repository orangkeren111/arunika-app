import bcrypt from "bcryptjs";
import * as adminDB from "../services/db/admin/adminDB";
import * as userDetailDB from "../services/db/admin/userDetailDB";
import { Kelas, Role, Stats, User, UserImportRow } from "@/src/app/types/admin";

export const adminRepository = {
  // --- STATS ---
  getStats: async (sekolah_id?: string): Promise<Stats> => {
    const dbStats = await adminDB.getStats(sekolah_id ? Number(sekolah_id) : 1);
    // Sesuaikan mapping ini dengan interface Stats kamu
    return {
      totalUsers: dbStats.totalUsers,
      totalClasses: dbStats.totalKelas,
      totalStudents: dbStats.totalSiswa,
      totalTeachers: dbStats.totalGuru,
    };
  },

  // --- USERS ---
  async getUsers(sekolah_id: number) {
    return await adminDB.getUsers(sekolah_id);
  },

  async addUser(
    user: {
      name: string;
      email: string;
      password: string;
      role: Role;
    },
    sekolah_id: number,
  ) {
    if (!user.name.trim()) {
      throw new Error("Nama wajib diisi.");
    }

    if (!user.email.trim()) {
      throw new Error("Username/email wajib diisi.");
    }

    if (!user.password) {
      throw new Error("Password wajib diisi.");
    }

    if (!["SISWA", "GURU"].includes(user.role)) {
      throw new Error("Role tidak valid.");
    }

    return await adminDB.addUser({
      name: user.name.trim(),
      email: user.email.trim(),
      password: await bcrypt.hash(user.password, 10),
      role: user.role,
      sekolah: {
        connect: {
          id: sekolah_id,
        },
      },
    });
  },

  async addUsersBatch(
    users: UserImportRow[],
    sekolah_id: number,
  ) {
    if (users.length === 0) {
      throw new Error("Tidak ada data pengguna.");
    }

    const preparedUsers = [];

    for (let index = 0; index < users.length; index++) {
      const user = users[index];
      const row = index + 2;

      if (!user.email?.trim()) {
        throw new Error(`Baris ${row}: username wajib diisi.`);
      }

      if (!user.name?.trim()) {
        throw new Error(`Baris ${row}: nama wajib diisi.`);
      }

      if (!user.password) {
        throw new Error(`Baris ${row}: password wajib diisi.`);
      }

      if (!["SISWA", "GURU"].includes(user.role)) {
        throw new Error(
          `Baris ${row}: role harus SISWA atau GURU.`,
        );
      }

      preparedUsers.push({
        name: user.name.trim(),

        // No username column exists in the DB.
        email: user.email.trim(),

        password: await bcrypt.hash(user.password, 10),

        role: user.role,
      });
    }

    return await adminDB.addUsersBatch(preparedUsers, sekolah_id);
  },

  async updateUser(
    id: number,
    data: Partial<User>,
  ) {
    return await adminDB.updateUser(id, {
      ...(data.name !== undefined
        ? { name: data.name }
        : {}),

      ...(data.email !== undefined
        ? { email: data.email }
        : {}),

      ...(data.role !== undefined
        ? { role: data.role }
        : {}),
    });
  },

  async resetPassword(
    id: number,
    newPassword: string,
  ) {
    if (!newPassword.trim()) {
      throw new Error("Password baru wajib diisi.");
    }

    if (newPassword.length < 6) {
      throw new Error(
        "Password minimal terdiri dari 6 karakter.",
      );
    }

    const hashedPassword = await bcrypt.hash(
      newPassword,
      10,
    );

    return await adminDB.resetUserPassword(
      id,
      hashedPassword,
    );
  },

  async deleteUser(id: number) {
    return await adminDB.deleteUser(id);
  },

  getPilihanSiswaKelas: async (
    sekolah_id: number,
    kelas_id: number,
  ): Promise<User[]> => {
    const users = await adminDB.getPilihanSiswaKelas(sekolah_id, kelas_id);
    return users as unknown as User[];
  },

  getTeachers: async (sekolah_id: number): Promise<User[]> => {
    const users = await adminDB.getTeachers(sekolah_id);
    return users as unknown as User[];
  },

  async getUserDetail(userId: number) {
    return await userDetailDB.getUserDetail(
      userId,
    );
  },

  // --- KELAS ---
  getKelas: async (sekolah_id: number): Promise<Kelas[]> => {
    const kelasList = await adminDB.getKelas(sekolah_id);
    return kelasList.map((k) => ({
      id: k.id,
      name: k.namaKelas,
      sekolahId: k.sekolahId,
      teacherId: k.teacherId,
      teacherName: k.teacher.name,
      studentCount: k._count.members,
    })) as unknown as Kelas[];
  },

  addKelas: async (
    kelas: Omit<Kelas, "id" | "studentCount">,
    sekolah_id: number,
  ): Promise<Kelas> => {
    const newKelas = await adminDB.addKelas({
      teacher: { connect: { id: kelas.teacherId } },
      namaKelas: kelas.name,
      sekolah: { connect: { id: sekolah_id } }, // nanti menjadi currentKelas
    });
    return {
      ...newKelas,
      studentCount: 0,
    } as unknown as Kelas;
  },

  updateKelas: async (id: number, data: Partial<Kelas>): Promise<Kelas> => {
    const updated = await adminDB.updateKelas(id, {
      namaKelas: data.name,
      teacher: { connect: { id: data.teacherId } },
    });
    return updated as unknown as Kelas;
  },

  deleteKelas: async (id: number): Promise<boolean> => {
    try {
      await adminDB.deleteKelas(id);
      return true;
    } catch (error) {
      return false;
    }
  },

  // --- MEMBERS MANAGEMENT ---
  getKelasMembers: async (
    kelasId: number,
  ): Promise<{ kelasDetail: any; teacher: any; members: any[] }> => {
    const data = await adminDB.getKelasMembers(kelasId);

    if (!data) {
      return { kelasDetail: null, teacher: null, members: [] };
    }

    const members = data.members
      .map((m) => m.user)
      .filter((m) => m.role == "SISWA");
    const teacher = data.teacher;

    return {
      kelasDetail: { id: data.id, namaKelas: data.namaKelas },
      teacher,
      members,
    };
  },

  addSiswaKeKelas: async (kelasId: number, siswaId: number) => {
    return await adminDB.addSiswaKeKelas({
      kelasId: kelasId,
      siswaId: siswaId,
    });
  },
  removeSiswaFromKelas: async (kelasId: number, siswaId: number) => {
    return await adminDB.removeSiswaFromKelas({
      kelasId: kelasId,
      siswaId: siswaId,
    });
  },
  getKompetensiPelajaranList: async () => {
    return await adminDB.getKompetensiPelajaranList();
  },
  initiateKurikulumExtraction: async (formData: FormData) => {
    return await adminDB.initiateKurikulumExtraction(formData);
  },
  retireKelas: async (id: number) => {
    return await adminDB.retireKelas(id);
  },

  // --- DASHBOARD CHARTS ---
  getDashboardChartData: async (sekolah_id: number) => {
    return await adminDB.getDashboardChartData(sekolah_id);
  },

  // --- CONTROL ---
  getControlData: async (sekolah_id: number) => {
    return await adminDB.getControlData(sekolah_id);
  },

  retryGenerationJob: async (id: number) => {
    return await adminDB.retryGenerationJob(id);
  },

  retryTaskQueueItem: async (id: number) => {
    return await adminDB.retryTaskQueueItem(id);
  },
};
