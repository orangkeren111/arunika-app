export interface CompetencyScore {
  code: string;
  name: string;
  correct: number;
  total: number;
}

export interface QuestionDetail {
  id: string;
  prompt: string;
  studentAnswer: string;
  isCorrect: boolean;
  catatanKoreksi: string;
  linkGambarSoal?: string;
}

export interface ReportProps {
  schoolName: string;
  testTitle: string;
  studentName: string;
  className: string;
  teacherName: string;
  jadwalId?: string;
  siswaId?: number;
  overallScore: { correct: number; total: number };
  overviewText: string;
  weaknessText: string;
  recommendationText: string;
  competencyScores: CompetencyScore[];
  questions: QuestionDetail[];
  status?: string;
}
