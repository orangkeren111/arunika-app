export interface CompetencyScore {
  code: string;
  name: string;
  correct: number;
  total: number;
}
export interface ChartProps {
  questions: QuestionDetail[];
}
export interface QuestionDetail {
  id: string;
  teksSoal: string;
  studentAnswer: string;
  isCorrect: boolean;
  catatanKoreksi: string;
  linkGambarSoal?: string;
  options?: string[];
  correctAnswer?: string;
  type?: "MCQ" | "ESSAY";
  eloBefore?: number;
  bloomLevel?: string;
  difficulty?: number;
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
