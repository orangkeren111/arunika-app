export type Role = "GURU" | "SISWA" | "ADMIN" | "SUPERADMIN";

export interface User {
  id: number;
  name: string;
  role: Role;
  email: string;
}

export interface Kelas {
  id: number;
  name: string;
  teacherId: number;
  teacherName?: string;
  studentCount: number;
}

export interface Stats {
  totalUsers: number;
  totalClasses: number;
  totalTeachers: number;
  totalStudents: number;
}
