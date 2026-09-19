import prisma from "@/src/lib/services/db/prisma";
import {
  callPromptGuard,
  callSmartText,
} from "@/src/lib/services/llm/router";
import { generateQuestionsWithLLM } from "@/src/lib/services/process-book/generate-questions";
import { processPdfWithGemini } from "@/src/lib/services/process-book/upload-gemini";
import { extractAndStorePdfPageImages } from "@/src/lib/services/process-book/extract-pdf-images";
import { processKurikulumExtract } from "@/src/lib/services/process-book/extract-kurikulum";
import { processPendingBookImages } from "@/src/lib/services/process-book/process-images";
import { NextResponse } from "next/server";
import fs from "fs/promises";
import { generateReport } from "@/src/lib/services/report/generator";


const globalForWorker = globalThis as unknown as {
  isWorkerRunning?: boolean;
  lastWorkerRunTimestamp?: number;
};

export async function GET() {
  const now = Date.now();
  const COOLDOWN_MS = 60_000; // 1 minute limit

  // 1. Rate Limit Guard: 1 request per minute
  if (
    globalForWorker.lastWorkerRunTimestamp &&
    now - globalForWorker.lastWorkerRunTimestamp < COOLDOWN_MS
  ) {
    const remainingSec = Math.ceil(
      (COOLDOWN_MS - (now - globalForWorker.lastWorkerRunTimestamp)) / 1000
    );
    return NextResponse.json({
      skipped: true,
      message: `Rate limit active: 1 sweep per minute. Retry in ${remainingSec}s.`,
    });
  }

  // 2. Concurrency Lock Guard: Prevent overlapping runs
  if (globalForWorker.isWorkerRunning) {
    return NextResponse.json({
      skipped: true,
      message: "Sweep already in progress. Skipping overlapping request.",
    });
  }

  // Acquire Lock & Record Timestamp
  globalForWorker.isWorkerRunning = true;
  globalForWorker.lastWorkerRunTimestamp = now;

  try {
    await Promise.allSettled([
      processGenerationStateMachine(), // 1. Book PDF & Question Generation
      processTaskQueueBatch(),          // 2. Report Generation & TaskQueue
    ]);

    return NextResponse.json({ message: "Sweep completed successfully" });
  } catch (error) {
    console.error("Sweeper crash:", error);
    return NextResponse.json({ error: "Sweeper failed" }, { status: 500 });
  } finally {
    globalForWorker.isWorkerRunning = false;
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

      // Check if bab_id is present in the result to determine the next state
      const nextStatus = job.babId === null ? "EXTRACTING_IMAGES" : "GENERATING_QUESTIONS";
      if (result.error) {
        if (job.attempts >= 2) {
          await prisma.generationJob.update({
            where: { id: job.id },
            data: {
              status: "FAILED",
              updatedAt: new Date(),
            },
          });
          return;
        }

        await prisma.generationJob.update({
          where: { id: job.id },
          data: {
            attempts: job.attempts + 1,
            updatedAt: new Date(),
          },
        });
        return;
      }
      await prisma.generationJob.update({
        where: { id: job.id },
        data: {
          status: nextStatus,
          tokensSpent: { increment: result.tokens },
          updatedAt: new Date(),
        },
      });
      return;
    }

    // PHASE 2: Extract embedded images from local PDF file
    if (job.status === "EXTRACTING_IMAGES") {
      if (job.fileUrl) {
        await extractAndStorePdfPageImages(job.bukuId, job.fileUrl, job.babId);
        // Clean up the local temp PDF file after image extraction completes
        await fs.unlink(job.fileUrl).catch(() => { });
      }

      // Advance to WAITING_EXTRACTION_VALIDATION state for teacher review
      await prisma.generationJob.update({
        where: { id: job.id },
        data: {
          status: "WAITING_EXTRACTION_VALIDATION",
          updatedAt: new Date(),
        },
      });
      return;
    }

    // PHASE 3: Vision AI Image Captioning for kept images of this book
    if (job.status === "CAPTIONING_IMAGES") {
      // Process pending kept images for this specific bukuId
      await processPendingBookImages(job.bukuId);

      // Check if any PENDING kept images remain for this book
      const remainingPendingCount = await prisma.bukuImage.count({
        where: {
          bukuId: job.bukuId,
          status: "PENDING",
          isKept: true,
        },
      });

      // If all kept images for this book are captioned, advance to WAITING_CAPTION_VALIDATION!
      if (remainingPendingCount === 0) {
        await prisma.generationJob.update({
          where: { id: job.id },
          data: {
            status: "WAITING_CAPTION_VALIDATION",
            updatedAt: new Date(),
          },
        });
      }
      return;
    }

    // PHASE 4: Generate Questions for each Bab or specific Bab
    if (job.status === "GENERATING_QUESTIONS") {
      let results: any[] = [];

      if (job.babId) {
        // Single Bab generation
        results = [await generateQuestionsWithLLM(job.babId, job.jumlahSoal)];
      } else {
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
        results = await Promise.all(
          babs.map((bab: any) => generateQuestionsWithLLM(bab.id, job.jumlahSoal)),
        );
      }

      const additionalTokens = results.reduce((sum, r) => sum + r.tokens, 0);

      // Job is finished!
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
    const errMsg = error.message ? error.message.toString() : String(error);
    const currentAttempts = ((job as any).attempts ?? 0) + 1;

    if (currentAttempts < 3) {
      console.warn(
        `GenerationJob ${job.id} failed attempt ${currentAttempts}/3. Re-queueing for next sweep. Error: ${errMsg}`,
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

    // Fail count reached 3 -> Mark as FAILED
    console.error(`GenerationJob ${job.id} marked FAILED after ${currentAttempts} attempts. Error: ${errMsg}`);
    await prisma.generationJob.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        attempts: currentAttempts,
        errorMessage: errMsg || "Failed after 3 attempts due to LLM/Provider error",
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

        let tokensSpent = 0;
        if (task.type === "generate_report") {
          const reportResult = await generateReport(task, payload);
          tokensSpent += reportResult.tokens;

        } else if (task.type === "extract_kurikulum") {
          const result = await processKurikulumExtract(payload.tempFilePath);
          tokensSpent = result.tokens;
        } else if (task.type === "generate_soal") {
          const result = await generateQuestionsWithLLM(
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
        const currentAttempts = (task.attempts ?? 0) + 1;
        const errMsg = error.message ? error.message.toString() : String(error);

        if (currentAttempts < 3) {
          // Re-queue task with incremented attempts
          console.warn(`Task ${task.id} failed attempt ${currentAttempts}/3. Re-queueing. Error: ${errMsg}`);
          await prisma.taskQueue.update({
            where: { id: task.id },
            data: {
              status: "pending",
              attempts: currentAttempts,
              errorLog: `Attempt ${currentAttempts}/3 failed: ${errMsg}`,
              lockedAt: null,
              updatedAt: new Date(),
            },
          });
        } else {
          // Fail count reached 3 -> Mark as failed
          console.error(`Task ${task.id} marked failed after ${currentAttempts} attempts. Error: ${errMsg}`);
          await prisma.taskQueue.update({
            where: { id: task.id },
            data: {
              status: "failed",
              attempts: currentAttempts,
              errorLog: errMsg || "Failed after 3 attempts.",
              updatedAt: new Date(),
            },
          });

          // Cascade failure to SavedResponse table
          if (task.type === "generate_report") {
            const payload = task.payload as any;
            await prisma.savedResponses.update({
              where: { attemptId: payload.attemptId },
              data: { status: "ERROR" },
            }).catch(() => { });
          }
        }
      }
    }),
  );
}
