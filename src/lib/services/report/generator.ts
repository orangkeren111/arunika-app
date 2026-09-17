"use server";
// lib/generator.ts
import prisma from "../db/prisma";
import { REPORT_PROMPTS } from "../llm/prompts";

/**
 * Calculates metrics and enqueues the LLM generation task.
 * Called immediately when the user finishes the exam.
 */
export async function enqueueStudentReport(attemptId: number) {
  // 1. Fetch data with question details
  const history = await prisma.jawabanSiswa.findMany({
    where: { attemptId },
    include: {
      soalAsli: {
        include: {
          kompetensiBab: true,
        },
      },
    },
  });

  if (history.length === 0) {
    throw new Error("No answers found for this attempt.");
  }

  // 2. Pre-calculate metrics & aggregate stats to save LLM tokens
  const total = history.length;
  const correct = history.filter((h) => h.isCorrect).length;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  // Aggregate stats by Bloom Level
  const bloomSummary: Record<string, { total: number; correct: number }> = {};
  history.forEach((h) => {
    const level = h.bloomLevel || "Unknown";
    if (!bloomSummary[level]) bloomSummary[level] = { total: 0, correct: 0 };
    bloomSummary[level].total += 1;
    if (h.isCorrect) bloomSummary[level].correct += 1;
  });

  const bloomText = Object.entries(bloomSummary)
    .map(([lvl, stat]) => `${lvl}: ${stat.correct}/${stat.total} (${Math.round((stat.correct / stat.total) * 100)}%)`)
    .join(", ");

  // Collect untrusted student input text specifically for prompt guard check (max 1500 chars)
  const studentInputOnly = history
    .filter((h) => h.type === "ESSAY" && h.jawabanSiswa)
    .map((h) => `Q${h.id}: ${h.jawabanSiswa}`)
    .join("\n")
    .slice(0, 1500);

  // Format history for LLM Prompt concisely
  const historyText = history
    .map((h) => {
      const kompetensi = h.soalAsli?.kompetensiBab?.isiKompetensi || "Umum";
      const nomerKompetensi = h.soalAsli?.kompetensiBab?.nomerKompetensi || "-";

      if (h.type === "MCQ") {
        // Lightweight concise log for objective questions
        return `[MCQ] ID:${h.id} | Komp:(${nomerKompetensi}) ${kompetensi} | Bloom:${h.bloomLevel || "Unknown"} | Result:${h.isCorrect ? "BENAR" : "SALAH"}`;
      } else {
        // Detailed context for essay questions requiring LLM grading
        const correctRef = h.jawabanBenarEssay || h.soalAsli?.jawabanBenarEssay || "Gunakan standar penilaian umum";
        return `[ESSAY] ID:${h.id} | Komp:(${nomerKompetensi}) ${kompetensi} | Bloom:${h.bloomLevel || "Unknown"} | Question:"${h.teksSoal}" | Key:"${correctRef}" | Student Answer:"${h.jawabanSiswa || "Tidak dijawab"}" | Marked Correct:${h.isCorrect}`;
      }
    })
    .join("\n");

  const fullPromptText = `Overall Metrics: Total Questions: ${total}, Total Accuracy: ${accuracy}%, Bloom Breakdown: [${bloomText}]\n\nStudent History Logs:\n${historyText}`;

  const prompt = REPORT_PROMPTS.analysis(fullPromptText);

  // 3. Create the placeholder in SavedResponses for client polling
  await prisma.savedResponses.upsert({
    where: { attemptId: attemptId },
    update: { status: "PENDING" },
    create: {
      attemptId: attemptId,
      status: "PENDING",
      overview: "",
      weakness: "",
      recommendation: "",
    },
  });

  // 4. Insert Job into Queue with studentInputOnly payload for prompt guard
  await prisma.taskQueue.create({
    data: {
      type: "generate_report",
      payload: {
        attemptId: attemptId,
        prompt: prompt,
        studentInputOnly: studentInputOnly || "No essay answers provided.",
      },
    },
  });

  // 5. Return deterministic data immediately (used for the UI before PDF is ready)
  return {
    success: true,
    message: "Report generation queued.",
    interimData: {
      totalQuestions: total,
      accuracy: accuracy,
      highestTaxonomy: history[history.length - 1]?.bloomLevel || "Q1",
    },
  };
}
