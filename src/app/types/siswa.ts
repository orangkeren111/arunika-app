export interface SiswaKelas {
  id: string;
  name: string;
  teacherName: string;
  studentCount: number;
}

export interface UpcomingExam {
  jadwalId: string;
  title: string;
  className: string;
  startTime: string;
  durationMinutes: number;
  type: string;
  isOngoing?: boolean;
  isEnded?: boolean;
  isFinishedByUser?: boolean;
  status?: string;
}

export interface ExamQuestion {
  id: string;
  type: "MCQ" | "ESSAY";
  text: string;
  options?: string[];
}

export interface ExamHistoryDetail {
  attemptId: string;
  jadwalId: string;
  title: string;
  submittedAt: string;
  score: number | null;
  status: string;
  feedback?: string | null;
  aiSummary?: string | null;
}
