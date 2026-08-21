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
): Promise<{ text: string; tokens: number }> {
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
    case "extract_kurikulum":
      return "gemini";

    case "generate_report":
      // Primary: Claude. Fallback: Gemini if Claude has > 5 concurrent jobs.
      if (!isSaturated("groq", 5)) return "groq";
      if (!isSaturated("gemini", 5)) return "gemini";
      return "groq"; // Last resort

    case "analyze_mistake":
      return "groq";

    default:
      return "groq";
  }
}
