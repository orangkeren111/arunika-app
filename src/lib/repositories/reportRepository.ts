import * as siswaDB from "../services/db/siswa/siswaDB";
import { ReportProps } from "@/src/app/types/report";

export const reportRepository = {
  fetchReportDataForStudent: async (
    attemptId: number,
  ): Promise<ReportProps> => {
    // 1. Fetch raw answers from the DB
    const rawAnswers = await siswaDB.getListJawaban(attemptId);

    if (!rawAnswers || rawAnswers.length === 0) {
      throw new Error("No answers found for this attempt.");
    }

    // 2. Fetch the AI feedback from SavedResponses
    const aiFeedback = await siswaDB.getGeneratedAIFeedback(attemptId);

    // 3. Fetch attempt details including enabled competencies
    const attemptDetail = await siswaDB.getAttemptDetailForReport(attemptId);

    const activeCompetencies = attemptDetail?.jadwalUjian?.ujian?.templateKompetensi || [];

    // Calculate competency scores (using criteria count for total to handle 0 answers properly)
    const competencyScores = activeCompetencies.map((tk) => {
      const answersForComp = rawAnswers.filter((ans) => ans.soalAsli?.kompetensiBabId === tk.kompetensiBabId);
      const correct = answersForComp.filter((ans) => ans.isCorrect).length;
      return {
        code: tk.kompetensiBab.nomerKompetensi,
        name: tk.kompetensiBab.isiKompetensi,
        correct: correct,
        total: tk.jumlahSoal,
      };
    });

    // Calculate total questions in the exam across all enabled competencies or exam question count
    const totalExamQuestions = activeCompetencies.length > 0
      ? activeCompetencies.reduce((sum, tk) => sum + tk.jumlahSoal, 0)
      : (attemptDetail?.jadwalUjian?.ujian?.jumlahSoal || rawAnswers.length);

    let correctCount = 0;
    const questions = rawAnswers.map((ans) => {
      if (ans.isCorrect) correctCount++;

      return {
        id: ans.id.toString(),
        prompt: ans.teksSoal,
        studentAnswer: ans.jawabanSiswa || "No answer provided",
        isCorrect: ans.isCorrect || false,
      };
    });

    // Extract relations safely
    const attempt = rawAnswers[0].attempt;
    const student = attempt.siswa;
    const schoolName = student.sekolah?.namaSekolah || "Arunika Academy";
    const className = attempt.jadwalUjian?.kelas?.namaKelas || "Umum";
    const teacherName = attempt.jadwalUjian?.kelas?.teacher?.name || "Guru Arunika";

    return {
      schoolName,
      studentName: student.name || "Unknown Student",
      className,
      teacherName,
      jadwalId: attempt.jadwalUjianId?.toString(),
      overallScore: {
        correct: correctCount,
        total: totalExamQuestions,
      },
      overviewText: aiFeedback.overviewText ?? "",
      weaknessText: aiFeedback.weaknessText ?? "",
      recommendationText: aiFeedback.recommendationText ?? "",
      competencyScores: competencyScores,
      questions: questions,
      status: aiFeedback.status,
    };
  },
};
