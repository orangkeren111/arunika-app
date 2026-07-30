import prisma from "@/src/lib/services/db/prisma";
import {
  executeLLMStrategy,
  getAvailableModelForTask,
} from "@/src/lib/services/llm/router";
import { generateQuestionsWithGroq } from "@/src/lib/services/process-book/generate-questions";
import { processPdfWithGemini } from "@/src/lib/services/process-book/upload-gemini";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await Promise.allSettled([
      processGenerationStateMachine(),
      processTaskQueueBatch(),
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
 * Handles PDF processing and Question Generation in distinct steps.
 */
async function processGenerationStateMachine() {
  const job = await prisma.generationJob.findFirst({
    where: {
      OR: [
        { status: "PENDING" },
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

  //  // ATOMIC CLAIM: Try to lock it so other cron pings don't grab it
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
    //    // PHASE 1: Extract PDF
    if (job.status === "PENDING" || job.status === "PROCESSING_PDF") {
      const result = await processPdfWithGemini(job.id, job.fileUrl ?? "");

      // Advance to next state and STOP.
      // Next cron ping will pick it up for Phase 2, avoiding Vercel timeouts!
      await prisma.generationJob.update({
        where: { id: job.id },
        data: {
          status: "GENERATING_QUESTIONS",
          tokensSpent: { increment: result.tokens },
          updatedAt: new Date()
        },
      });
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
    //    console.error(`GenerationJob ${job.id} failed:`, error);

    // Rate Limit / Outage Check
    const isRateLimit =
      error.status === 429 || (error.message && error.message.includes("429"));
    const isServerDown = error.status >= 500;

    if (isRateLimit || isServerDown) {
      console.warn(
        `Provider exhausted for GenerationJob ${job.id}. Backing off to retry next sweep.`,
      );
      await prisma.generationJob.update({
        where: { id: job.id },
        data: {
          status:
            job.status === "PROCESSING_PDF"
              ? "PENDING"
              : "GENERATING_QUESTIONS",
          updatedAt: new Date(),
        },
      });
      return;
    }

    // Hard Error
    await prisma.generationJob.update({
      where: { id: job.id },
      data: { status: "FAILED", errorMessage: error.message },
    });
  }
}

/**
 * 2. TaskQueue Sweeper (The Reports/Responses)
 * Grabs 6 tasks at a time, tracks LLM routing, and updates SavedResponses.
 */
async function processTaskQueueBatch() {
  //  // 1. Find oldest 6 pending tasks
  const pendingTasks = await prisma.taskQueue.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "asc" },
    take: 6,
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
