import { User, Kelas, Stats } from "@/src/app/types/admin";
import {
  Buku,
  Bab,
  Soal,
  UjianTemplate,
  JadwalUjian,
  AttemptReport,
} from "@/src/app/types/guru";

// --- DATA IN-MEMORY ---

export let mockStats: Stats = {
  totalUsers: 1,
  totalClasses: 3,
  totalTeachers: 2,
  totalStudents: 2,
};

export let mockUsers: User[] = [
  { id: 1, name: "Budi Santoso", role: "GURU", email: "budi@arunika.edu" },
  { id: 2, name: "Siti Aminah", role: "GURU", email: "siti@arunika.edu" },
  {
    id: 3,
    name: "Andi Wijaya",
    role: "SISWA",
    email: "andi@student.arunika.edu",
  },
  {
    id: 4,
    name: "Rina Melati",
    role: "SISWA",
    email: "rina@student.arunika.edu",
  },
  { id: 5, name: "Rina Melati", role: "ADMIN", email: "admin@arunika.edu" },
];

export let mockKelas: Kelas[] = [
  { id: 1, name: "10 MIPA 1", teacherId: 1, studentCount: 2 },
  { id: 2, name: "10 IPS 2", teacherId: 2, studentCount: 0 },
  { id: 3, name: "11 MIPA 1", teacherId: 1, studentCount: 0 },
];

export let mockBuku: Buku[] = [
  {
    id: "1",
    title: "Biologi Kelas X",
    description: "Materi Biologi dasar",
    chapterCount: 2,
  },
  {
    id: "2",
    title: "Biologi Kelas XI",
    description: "Materi Lanjutan Biologi",
    chapterCount: 0,
  },
];

export let mockBab: Bab[] = [
  {
    id: "101",
    bookId: "1",
    title: "Bab 1: Ruang Lingkup Biologi",
    questionCount: 2,
  },
  {
    id: "102",
    bookId: "1",
    title: "Bab 2: Keanekaragaman Hayati",
    questionCount: 0,
  },
];

export let mockSoal: Soal[] = [
  {
    id: "s1",
    babId: "101",
    type: "MCQ",
    text: "Cabang ilmu biologi yang mempelajari tentang sel adalah...",
    options: ["Sitologi", "Histologi", "Morfologi", "Fisiologi"],
    correctAnswer: "Sitologi",
    difficulty: 1,
  },
  {
    id: "s2",
    babId: "101",
    type: "MCQ",
    text: "Organel sel yang berfungsi sebagai tempat respirasi seluler adalah...",
    options: ["Nukleus", "Mitokondria", "Ribosom", "Lisosom"],
    correctAnswer: "Mitokondria",
    difficulty: 1,
  },
  {
    id: "s3",
    babId: "101",
    type: "ESSAY",
    text: "Jelaskan perbedaan antara sel tumbuhan dan sel hewan beserta fungsi masing-masing organel yang membedakannya!",
    difficulty: 1,
  },
];

export let mockTemplates: UjianTemplate[] = [
  { id: "u1", title: "UH 1 Biologi Kls X", questionCount: 3, durasiMenit: 60 },
];

export let mockJadwal: JadwalUjian[] = [
  {
    id: "j1",
    templateId: "u1",
    className: "10 MIPA 1",
    startTime: "2026-06-25 08:00",
    type: "Ulangan Harian",
    status: "Active",
  },
  {
    id: "j2",
    templateId: "u1",
    className: "10 MIPA 1",
    startTime: "2026-06-20 08:00",
    type: "Ulangan Harian",
    status: "Completed",
  },
];

export let mockAttempts: AttemptReport[] = [
  {
    id: "a1",
    jadwalId: "j2",
    studentName: "Andi Wijaya",
    score: 85,
    status: "Graded",
    feedback: "Kerja bagus, pemahaman konsep sel sudah sangat baik.",
    aiSummary:
      "Siswa menunjukkan penguasaan kuat pada materi sitologi, namun perlu pengayaan pada materi metabolisme.",
  },
  {
    id: "a2",
    jadwalId: "j2",
    studentName: "Rina Melati",
    score: null,
    status: "Pending Essay",
  },
];

// Helper to recalculate statistics dynamically
export const syncStats = () => {
  mockStats.totalClasses = mockKelas.length;
  mockStats.totalTeachers = mockUsers.filter((u) => u.role === "GURU").length;
  mockStats.totalStudents = mockUsers.filter((u) => u.role === "SISWA").length;
};
