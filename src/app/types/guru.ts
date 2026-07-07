export interface Buku {
  id: string;
  title: string;
  description: string;
  chapterCount: number;
}

export interface Bab {
  id: string;
  bookId: string;
  title: string;
  questionCount: number;
}

export interface Soal {
  id: string;
  babId: string;
  type: "MCQ" | "ESSAY";
  text: string;
  options?: string[]; // Untuk MCQ
  correctAnswer?: string;
}
export interface SoalTemplate {
  id: string;
  babId: string;
  soalAsliId: string;
  type: "MCQ" | "ESSAY";
  text: string;
  options?: string[]; // Untuk MCQ
  correctAnswer?: string;
}

export interface UjianTemplate {
  id: string;
  title: string;
  questionCount: number;
  // createdAt: string;
}

export interface TipeUjian {
  id: string;
  namaTipeUjian: string;
}

export interface Kelas {
  id: number;
  name: string;
  teacherId: number;
  teacherName?: string;
  studentCount: number;
}

export interface JadwalUjian {
  id: string;
  templateId: string;
  className: string;
  startTime: string;
  type: string; // e.g., 'Ulangan Harian', 'Ujian Akhir'
  status: string;
}

export interface AttemptReport {
  id: string;
  jadwalId: string;
  studentName: string;
  score: number | null;
  status: string;
  feedback?: string;
  aiSummary?: string;
}
