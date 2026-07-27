import * as siswaDB from "../services/db/siswa/siswaDB";

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

    // 3. Process data into the format expected by the UI
    let correctCount = 0;
    const taxonomyMap: Record<
      string,
      { correct: number; total: number; name: string }
    > = {
      C1: { correct: 0, total: 0, name: "Remembering" },
      C2: { correct: 0, total: 0, name: "Understanding" },
      C3: { correct: 0, total: 0, name: "Applying" },
      C4: { correct: 0, total: 0, name: "Analyzing" },
      C5: { correct: 0, total: 0, name: "Evaluating" },
      C6: { correct: 0, total: 0, name: "Creating" },
    };

    const questions = rawAnswers.map((ans) => {
      if (ans.isCorrect) correctCount++;

      // Safely update taxonomy stats
      const taxLevel = ans.bloomLevel as string;
      if (taxLevel && taxonomyMap[taxLevel]) {
        taxonomyMap[taxLevel].total++;
        if (ans.isCorrect) taxonomyMap[taxLevel].correct++;
      }

      return {
        id: ans.id.toString(),
        prompt: ans.teksSoal,
        studentAnswer: ans.jawabanSiswa || "No answer provided",
        isCorrect: ans.isCorrect || false,
      };
    });

    // Filter out taxonomy levels that weren't tested to keep the UI clean
    const taxonomyScores = Object.entries(taxonomyMap)
      .filter(([_, stats]) => stats.total > 0)
      .map(([level, stats]) => ({
        level: level as "C1" | "C2" | "C3" | "C4", // Typecast for UI props
        name: stats.name,
        correct: stats.correct,
        total: stats.total,
      }));

    // Extract relations safely
    const student = rawAnswers[0].attempt.siswa;
    // Note: Adjust the class/teacher mapping based on how your JadwalUjian is structured

    return {
      schoolName: "Institut Sains dan Teknologi Terpadu Surabaya",
      studentName: student.name || "Unknown Student",
      className: "SIB", // Placeholder: Map from jadwalUjian/Class relation
      teacherName: "Prof. Budi", // Placeholder: Map from jadwalUjian/Teacher relation
      overallScore: {
        correct: correctCount,
        total: rawAnswers.length,
      },
      overviewText: aiFeedback.overviewText ?? "",
      weaknessText: aiFeedback.weaknessText ?? "",
      recommendationText: aiFeedback.recommendationText ?? "",
      taxonomyScores: taxonomyScores,
      questions: questions,
    };
  },
};
