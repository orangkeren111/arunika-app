import * as adminDB from "../services/db/admin/adminDB";
import { Kelas, Stats, User } from "@/src/app/types/admin";

export const adminRepository = {
  // --- STATS ---
  getStats: async (): Promise<Stats> => {
    const dbStats = await adminDB.getStats();
    // Sesuaikan mapping ini dengan interface Stats kamu
    return {
      totalUsers: dbStats.totalUsers,
      totalClasses: dbStats.totalKelas,
      totalStudents: dbStats.totalSiswa,
      totalTeachers: dbStats.totalGuru,
    };
  },

  // --- USERS ---
  getUsers: async (sekolah_id: number): Promise<User[]> => {
    const users = await adminDB.getUsers(sekolah_id);
    return users as unknown as User[];
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

  addUser: async (
    user: Omit<User, "id">,
    sekolah_id: number,
  ): Promise<User> => {
    // Karena id di Prisma auto-increment, kita cukup pass datanya
    const newUser = await adminDB.addUser({
      name: user.name,
      email: user.email,
      password: "123",
      role: user.role, // Pastikan tipe enum cocok antara frontend dan Prisma
      sekolah: { connect: { id: sekolah_id } }, // Contoh: Default ke sekolah id 1
    });
    return newUser as unknown as User;
  },

  updateUser: async (id: number, data: Partial<User>): Promise<User> => {
    const updatedUser = await adminDB.updateUser(id, data);
    return updatedUser as unknown as User;
  },

  deleteUser: async (id: number): Promise<boolean> => {
    try {
      await adminDB.deleteUser(id);
      return true;
    } catch (error) {
      return false;
    }
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
};
