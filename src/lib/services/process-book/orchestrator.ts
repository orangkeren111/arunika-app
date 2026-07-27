"use server";

// lib/orchestrator.ts
import { processPdfWithGemini } from "./upload-gemini";
import { generateQuestionsWithGroq } from "./generate-questions";
import prisma from "../db/prisma";

export async function runGenerationPipeline(
  jobId: number,
  filePathOrUrl: string,
) {
  try {
    // STEP 1: Update status to show we are reading the PDF
    await prisma.generationJob.update({
      where: { id: jobId },
      data: { status: "PROCESSING_PDF" },
    });

    // STEP 2: Call Gemini to get learning objectives
    const objectives = await processPdfWithGemini(jobId, filePathOrUrl);

    // STEP 3: Update status to show we are creating the questions
    await prisma.generationJob.update({
      where: { id: jobId },
      data: { status: "GENERATING_QUESTIONS" },
    });

    // STEP 4: Loop through objectives and call Groq for each
    // We use Promise.all to do this concurrently for massive speed
    await Promise.all(
      objectives.map((objective) => generateQuestionsWithGroq(objective.id)),
    );

    // STEP 5: Mark the whole job as DONE
    await prisma.generationJob.update({
      where: { id: jobId },
      data: { status: "DONE" },
    });
  } catch (error) {
    // If ANYTHING fails, catch it and mark the job as FAILED
    console.error(`Pipeline failed for Job ${jobId}:`, error);
    await prisma.generationJob.update({
      where: { id: jobId },
      data: { status: "FAILED", errorMessage: error.message },
    });
  }
}
