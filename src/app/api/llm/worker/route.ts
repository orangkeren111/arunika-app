import prisma from "@/src/lib/services/db/prisma";
import {
  executeLLMStrategy,
  getAvailableModelForTask,
} from "@/src/lib/services/llm/router";
import { generateQuestionsWithGroq } from "@/src/lib/services/process-book/generate-questions";
import { processPdfWithGemini } from "@/src/lib/services/process-book/upload-gemini";
import { extractAndStorePdfPageImages } from "@/src/lib/services/process-book/extract-pdf-images";
import { processKurikulumExtract } from "@/src/lib/services/process-book/extract-kurikulum";
import { processPendingBookImages } from "@/src/lib/services/process-book/process-images";
import { NextResponse } from "next/server";
import fs from "fs/promises";


export async function GET() {
  try {
    await Promise.allSettled([
      processGenerationStateMachine(), // 1. Book PDF & Question Generation
      processTaskQueueBatch(),          // 2. Report Generation & TaskQueue
      processPendingBookImages(),       // 3. Book Image Vision AI Captioning
    ]);

    return NextResponse.json({ message: "Sweep completed successfully" });
  } catch (error) {
    console.error("Sweeper crash:", error);
    return NextResponse.json({ error: "Sweeper failed" }, { status: 500 });
  }
}

export async function POST() {
  return GET();
}

/**
 * 1. GenerationJob Sweeper (The Book)
 * Handles PDF processing, Image Extraction, and Question Generation in distinct steps.
 */
async function processGenerationStateMachine() {
  const job = await prisma.generationJob.findFirst({
    where: {
      OR: [
        { status: "PENDING" },
        { status: "EXTRACTING_IMAGES" },
        { status: "CAPTIONING_IMAGES" },
        { status: "GENERATING_QUESTIONS" },
        // Fallback: If Vercel timed out during PDF reading, retry after 5 mins
        {
          status: "PROCESSING_PDF",
          updatedAt: { lt: new Date(Date.now() - 5 * 60 * 1000) },
        },
      ],
    },
    orderBy: { createdAt: "asc" },
  });

  if (!job) return;

  // ATOMIC CLAIM: Try to lock it so other cron pings don't grab it
  const claimResult = await prisma.generationJob.updateMany({
    where: {
      id: job.id,
      status: job.status, // Only update if status hasn't changed
    },
    data: {
      status: job.status === "PENDING" ? "PROCESSING_PDF" : job.status,
      updatedAt: new Date(),
    },
  });

  if (claimResult.count === 0) return; // Another worker grabbed it first!

  console.log(`Advancing GenerationJob ${job.id} from state: ${job.status}`);

  try {
    // PHASE 1: Parse PDF text & chapter structure via Gemini (Zero image extraction yet)
    if (job.status === "PENDING" || job.status === "PROCESSING_PDF") {
      const result = await processPdfWithGemini(job.id, job.fileUrl ?? "");

      // Advance to EXTRACTING_IMAGES state
      await prisma.generationJob.update({
        where: { id: job.id },
        data: {
          status: "EXTRACTING_IMAGES",
          tokensSpent: { increment: result.tokens },
          updatedAt: new Date(),
        },
      });
      return;
    }

    // PHASE 2: Extract embedded images from local PDF file
    if (job.status === "EXTRACTING_IMAGES") {
      if (job.fileUrl) {
        await extractAndStorePdfPageImages(job.bukuId, job.fileUrl);
        // Clean up the local temp PDF file after image extraction completes
        await fs.unlink(job.fileUrl).catch(() => { });
      }

      // Advance to CAPTIONING_IMAGES state
      await prisma.generationJob.update({
        where: { id: job.id },
        data: {
          status: "CAPTIONING_IMAGES",
          updatedAt: new Date(),
        },
      });
      return;
    }

    // PHASE 3: Vision AI Image Captioning & Agentic Filter for this book
    if (job.status === "CAPTIONING_IMAGES") {
      // Process pending images for this specific bukuId
      await processPendingBookImages(job.bukuId);

      // Check if any PENDING images remain for this book
      const remainingPendingCount = await prisma.bukuImage.count({
        where: {
          bukuId: job.bukuId,
          status: "PENDING",
        },
      });

      // If all images for this book are captioned & processed, advance to GENERATING_QUESTIONS!
      if (remainingPendingCount === 0) {
        await prisma.generationJob.update({
          where: { id: job.id },
          data: {
            status: "GENERATING_QUESTIONS",
            updatedAt: new Date(),
          },
        });
      }
      return;
    }

    //    // PHASE 2: Generate Questions for each Bab
    if (job.status === "GENERATING_QUESTIONS") {
      // Use nested relation to get babs tied to the buku for this job
      const babs = await prisma.bab.findMany({
        where: {
          buku: {
            jobs: {
              some: {
                id: job.id,
              },
            },
          },
          soal: {
            none: {},
          },
        },
        include: {
          buku: {
            include: {
              jobs: true,
            },
          },
          soal: true,
        },
      });

      // Execute Groq concurrently for massive speed
      const results = await Promise.all(
        babs.map((bab: any) => generateQuestionsWithGroq(bab.id, job.jumlahSoal)),
      );

      const additionalTokens = results.reduce((sum, r) => sum + r.tokens, 0);

      // Entire book is finished!
      await prisma.generationJob.update({
        where: { id: job.id },
        data: {
          status: "DONE",
          tokensSpent: { increment: additionalTokens },
          updatedAt: new Date()
        },
      });
      return;
    }
  } catch (error: any) {
    // Rate Limit / Outage Check (429, 503, 500+, etc.)
    const errCode = error.status || error.statusCode;
    const errMsg = error.message ? error.message.toString() : String(error);

    const isRateLimit = errCode === 429 || errMsg.includes("429");
    const isServerDown =
      (typeof errCode === "number" && errCode >= 500 && errCode <= 599) ||
      errMsg.includes("503") ||
      errMsg.includes("UNAVAILABLE") ||
      errMsg.includes("Service Unavailable");

    const currentAttempts = ((job as any).attempts ?? 0) + 1;
    const isExhausted = currentAttempts >= 3;

    if ((isRateLimit || isServerDown) && !isExhausted) {
      console.warn(
        `Provider overloaded/503 for GenerationJob ${job.id} (Attempt ${currentAttempts}/3). Backing off to retry next sweep.`,
      );
      await prisma.generationJob.update({
        where: { id: job.id },
        data: {
          status:
            job.status === "PROCESSING_PDF"
              ? "PENDING"
              : job.status === "EXTRACTING_IMAGES"
                ? "EXTRACTING_IMAGES"
                : job.status === "CAPTIONING_IMAGES"
                  ? "CAPTIONING_IMAGES"
                  : "GENERATING_QUESTIONS",
          attempts: currentAttempts,
          errorMessage: `Attempt ${currentAttempts}/3 failed: ${errMsg}`,
          updatedAt: new Date(),
        },
      });
      return;
    }

    // Hard Error OR Max Attempts (3) reached -> Mark as FAILED
    console.error(`GenerationJob ${job.id} marked FAILED after attempt ${currentAttempts}. Error: ${errMsg}`);
    await prisma.generationJob.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        attempts: currentAttempts,
        errorMessage: errMsg || "Failed after 3 attempts due to Gemini/Provider error",
        updatedAt: new Date(),
      },
    });
  }
}

/**
 * 2. TaskQueue Sweeper (The Reports/Responses)
 * Grabs 6 tasks at a time, tracks LLM routing, and updates SavedResponses.
 */
async function processTaskQueueBatch() {
  // 1. Find 10 recent pending tasks
  const pendingTasks = await prisma.taskQueue.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "asc" },
    take: 10,
  });

  if (pendingTasks.length === 0) return;

  const taskIds = pendingTasks.map((t: any) => t.id);

  //  // 2. ATOMIC CLAIM: Update to processing
  await prisma.taskQueue.updateMany({
    where: {
      id: { in: taskIds },
      status: "pending",
    },
    data: {
      status: "processing",
      lockedAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // 3. Re-fetch claimed tasks
  const claimedTasks = await prisma.taskQueue.findMany({
    where: {
      id: { in: taskIds },
      status: "processing",
    },
  });

  if (claimedTasks.length === 0) return;

  console.log(
    `Processing batch of ${claimedTasks.length} tasks from TaskQueue...`,
  );

  //  // Use Promise.allSettled so if 1 fails, the other 5 still save!
  await Promise.allSettled(
    claimedTasks.map(async (task: any) => {
      try {
        const payload = task.payload as any; // Cast Json to object

        // Dynamically assign provider based on current active jobs
        const assignedProvider = await getAvailableModelForTask(task.type);
        console.log(
          `Executing Task ${task.id} (${task.type}) via ${assignedProvider}`,
        );

        // Update task with assigned provider so saturation check works
        await prisma.taskQueue.update({
          where: { id: task.id },
          data: { provider: assignedProvider },
        });

        let tokensSpent = 0;
        if (task.type === "generate_report") {
          const result = await executeLLMStrategy(
            assignedProvider,
            payload.prompt,
          );
          tokensSpent = result.tokens;
          const parsedResult = JSON.parse(result.text);

          // Update the SavedResponse table based on the payload's attemptId
          await prisma.savedResponses.update({
            where: { attemptId: payload.attemptId },
            data: {
              overview: parsedResult.overview,
              weakness: parsedResult.weakness,
              recommendation: parsedResult.recommendation,
              status: "DONE",
            },
          });
        } else if (task.type === "extract_kurikulum") {
          const result = await processKurikulumExtract(payload.tempFilePath);
          tokensSpent = result.tokens;
        } else if (task.type === "generate_soal") {
          const result = await generateQuestionsWithGroq(
            payload.babId,
            payload.totalJumlahSoal || 10
          );
          tokensSpent = result.tokens;
        }

        // Mark task as completed
        await prisma.taskQueue.update({
          where: { id: task.id },
          data: { status: "completed", tokensSpent },
        });
      } catch (error: any) {
        //        console.error(`Task ${task.id} failed:`, error);

        const isRateLimit =
          error.status === 429 ||
          (error.message && error.message.includes("429"));
        const isServerDown = error.status >= 500;
        const isExhausted = task.attempts >= 3;

        if ((isRateLimit || isServerDown) && !isExhausted) {
          // Soft Fail: Provider busy, put back in queue for next sweep
          await prisma.taskQueue.update({
            where: { id: task.id },
            data: {
              status: "pending",
              attempts: task.attempts + 1,
              errorLog: "Provider overloaded, backing off",
              lockedAt: null,
              updatedAt: new Date(),
            },
          });
        } else {
          // Hard Fail: JSON Parse error or max attempts reached
          await prisma.taskQueue.update({
            where: { id: task.id },
            data: {
              status: "failed",
              attempts: task.attempts + 1,
              errorLog: error.message,
            },
          });

          // Cascade failure to SavedResponse table
          if (task.type === "generate_report") {
            const payload = task.payload as any;
            await prisma.savedResponses.update({
              where: { attemptId: payload.attemptId },
              data: { status: "ERROR" },
            });
          }
        }
      }
    }),
  );
}
