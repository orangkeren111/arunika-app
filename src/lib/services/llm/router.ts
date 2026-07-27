// llm/router.ts
import prisma from "../db/prisma";
import { callGemini, callClaude, callGroq, LLMProvider } from "./providers";

/**
 * 2. The strategy holder that decides which LLM to call
 */
export async function executeLLMStrategy(
  provider: LLMProvider,
  prompt: string,
  system?: string,
): Promise<string> {
  switch (provider) {
    case "gemini":
      return await callGemini(prompt, system);
    case "claude":
      return await callClaude(prompt, system);
    case "groq":
      return await callGroq(prompt, system);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

/**
 * Determines the best available model.
 * Checks the TaskQueue to see if a specific provider is saturated.
 */
export async function getAvailableModelForTask(
  taskType: string,
): Promise<LLMProvider> {
  // Check how many tasks are currently processing per provider
  const activeTasks = await prisma.taskQueue.groupBy({
    by: ["provider"],
    where: { status: "processing" },
    _count: true,
  });

  // Helper function to check saturation
  const isSaturated = (prov: string, limit: number) => {
    const stat = activeTasks.find((t) => t.provider === prov);
    return stat ? stat._count >= limit : false;
  };

  switch (taskType) {
    case "extract_pdf":
      return "gemini";

    case "generate_report":
      // Primary: Claude. Fallback: Gemini if Claude has > 5 concurrent jobs.
      if (!isSaturated("claude", 5)) return "claude";
      if (!isSaturated("gemini", 5)) return "gemini";
      return "groq"; // Last resort

    case "analyze_mistake":
      return "groq";

    default:
      return "groq";
  }
}

/**
 * Atomic Database Queue Consumer
 */
export async function processNextTask() {
  const lockTime = new Date();

  // PostgreSQL-specific atomic lock and fetch
  const tasks = await prisma.$queryRaw<any[]>`
    UPDATE "task_queue"
    SET status = 'processing', "lockedAt" = ${lockTime}
    WHERE id = (
      SELECT id FROM "task_queue"
      WHERE status = 'pending' OR (status = 'processing' AND "lockedAt" < NOW() - INTERVAL '5 minutes')
      ORDER BY "createdAt" ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    )
    RETURNING *;
  `;

  if (!tasks || tasks.length === 0) return null;

  const task = tasks[0];

  // Dynamically assign provider based on current queue load
  const assignedProvider = await getAvailableModelForTask(task.type);

  // Update task with assigned provider so the saturation check works correctly
  await prisma.taskQueue.update({
    where: { id: task.id },
    data: { provider: assignedProvider },
  });

  try {
    console.log(
      `Executing Task ${task.id} (${task.type}) via ${assignedProvider}`,
    );
    let result = "";

    // Route based on task type
    if (task.type === "generate_report") {
      const rawResult = await executeLLMStrategy(
        assignedProvider,
        task.payload.prompt,
      );

      // Parse the JSON returned by the LLM
      const parsedResult = JSON.parse(rawResult);

      // Save the 3 sections back to SavedResponses
      await prisma.savedResponses.update({
        where: { attemptId: task.payload.attemptId },
        data: {
          overview: parsedResult.overview,
          weakness: parsedResult.weakness,
          recommendation: parsedResult.recommendation,
          status: "COMPLETED",
        },
      });
    }
    // Handle other task types...

    // Mark task queue as completed
    await prisma.taskQueue.update({
      where: { id: task.id },
      data: { status: "completed" },
    });
  } catch (error: any) {
    await prisma.taskQueue.update({
      where: { id: task.id },
      data: {
        status: task.attempts >= 3 ? "failed" : "pending",
        attempts: task.attempts + 1,
        errorLog: error.message,
      },
    });

    // If it fails, also mark the SavedResponse as failed so the client knows
    if (task.type === "generate_report" && task.attempts >= 3) {
      await prisma.savedResponses.update({
        where: { attemptId: task.payload.attemptId },
        data: { status: "FAILED" },
      });
    }
  }
}
