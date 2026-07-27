// Interfaces remain the same
interface TaxonomyScore {
  level: "C1" | "C2" | "C3" | "C4";
  name: string;
  correct: number;
  total: number;
}

interface QuestionDetail {
  id: string;
  prompt: string;
  studentAnswer: string;
  isCorrect: boolean;
}

interface ReportProps {
  schoolName: string;
  studentName: string;
  className: string;
  teacherName: string;
  overallScore: { correct: number; total: number };
  overviewText: string;
  taxonomyScores: TaxonomyScore[];
  questions: QuestionDetail[];
}
