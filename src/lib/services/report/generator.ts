"use server";
// lib/generator.ts
import prisma from "../db/prisma";
import { REPORT_PROMPTS } from "../llm/prompts";

/**
 * Calculates metrics and enqueues the LLM generation task.
 * Called immediately when the user finishes the exam.
 */
export async function enqueueStudentReport(attemptId: number) {
  // 1. Fetch data
  const history = await prisma.jawabanSiswa.findMany({
    where: { attemptId },
  });

  if (history.length === 0) {
    throw new Error("No answers found for this attempt.");
  }

  // 2. Pre-calculate metrics to save LLM tokens
  const total = history.length;
  const correct = history.filter((h) => h.isCorrect).length;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  // Format history for LLM Prompt
  const historyText = history
    .map(
      (h) =>
        `Taxonomy: ${h.bloomLevel || "Unknown"}, Correct: ${h.isCorrect}, Answer: ${h.jawabanSiswa || "None"}`,
    )
    .join("\n");

  const prompt = REPORT_PROMPTS.analysis(historyText);

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

  // 4. Insert Job into Queue
  await prisma.taskQueue.create({
    data: {
      type: "generate_report",
      payload: {
        attemptId: attemptId,
        prompt: prompt,
      },
    },
  });

  // 5. Fire and forget the worker trigger (so the user doesn't wait)
  fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/llm/worker`, {
    method: "POST",
  }).catch(() => {});

  // 6. Return deterministic data immediately (used for the UI before PDF is ready)
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
