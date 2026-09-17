export type Role = "GURU" | "SISWA" | "ADMIN" | "SUPERADMIN";
export type Tingkat = "SD" | "SMP" | "SMA" | "Kuliah";
export interface User {
  id: number;
  name: string;
  role: Role;
  email: string;
  sekolahId?: number | null;

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

export interface UserImportRow {
  email: string;
  name: string;
  password: string;
  role: Role;
}

export interface UserImportResult {
  success: number;
  failed: number;
  errors: string[];
}

export interface UserClass {
  id: number;
  namaKelas: string;
}

export interface UserExamResult {
  id: number;
  ujianId: number;
  judul: string;
  waktuSelesai: string | null;
  nilaiAkhir: number | null;
}

export interface UserBookHistory {
  id: number;
  judul: string;
  createdAt: string;
}

export interface UserDetail {
  user: User;
  classes: UserClass[];
  books: UserBookHistory[];
  exams: UserExamResult[];
}
