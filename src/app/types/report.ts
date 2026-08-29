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
}

export interface ReportProps {
  schoolName: string;
  studentName: string;
  className: string;
  teacherName: string;
  jadwalId?: string;
  overallScore: { correct: number; total: number };
  overviewText: string;
  weaknessText: string;
  recommendationText: string;
  competencyScores: CompetencyScore[];
  questions: QuestionDetail[];
  status?: string;
}
