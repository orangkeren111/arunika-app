export interface TaxonomyScore {
  level: "C1" | "C2" | "C3" | "C4";
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
  overallScore: { correct: number; total: number };
  overviewText: string;
  weaknessText: string;
  recommendationText: string;
  taxonomyScores: TaxonomyScore[];
  questions: QuestionDetail[];
  status?: string;
}
