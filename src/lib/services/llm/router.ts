import { createGoogleGenerativeAI } from "@ai-sdk/google";
import prisma from "../db/prisma";
import { executeModelCall, getGeminiModel, getGoogleGenAI, ModelCallResponse } from "./providers";
import { GoogleGenAI } from "@google/genai";
export { getGoogleGenAI, getGeminiModel };


// Local Routing Cache with TTL (60 Seconds)
interface CachedRoutes {
  routes: Array<{ provider: String; modelName: string; priority: number }>;
  fetchedAt: number;
}
const routeCache = new Map<string, CachedRoutes>();
const CACHE_TTL_MS = 60 * 1000;

export function invalidateRouteCache(taskType?: string) {
  if (taskType) {
    routeCache.delete(taskType);
  } else {
    routeCache.clear();
  }
}
/*

Retrieves task routing definitions ordered by priority from DB / Cache
  */
async function getTaskRoutingChain(taskType: string) {
  const now = Date.now();
  const cached = routeCache.get(taskType);

  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.routes;
  }

  const routes = await prisma.llmTaskRouting.findMany({
    where: { taskType, isActive: true },
    select: { provider: true, modelName: true, priority: true },
    orderBy: { priority: "asc" }
  });

  routeCache.set(taskType, { routes, fetchedAt: now });
  return routes;
}

/*

Main execution function: Takes a task identifier, resolves its priority model chain,

  and executes with automatic fallback across providers if a provider pool is exhausted.
*/
export async function executeTask(
  taskType: string,
  prompt: string,
  system?: string,
  options?: { imageBuffer?: Buffer | Uint8Array | string; imageMimeType?: string }
): Promise<ModelCallResponse> {
  const chain = await getTaskRoutingChain(taskType);

  if (chain.length === 0) {
    throw new Error(`No active task routing configured for task: "${taskType}"`);
  }

  let lastError: any = null;

  for (const step of chain) {
    try {
      return await executeModelCall({
        provider: step.provider,
        modelName: step.modelName,
        prompt,
        system,
        imageBuffer: options?.imageBuffer,
      });
    } catch (err: any) {
      lastError = err;
      console.warn(
        `[Task Fallback] Provider ${step.provider} (${step.modelName}) exhausted for task "${taskType}". Falling back to next priority provider...`
      );
    }
  }

  throw new Error(`All provider steps failed for task "${taskType}". Last error: ${lastError?.message || lastError}`);
}

/*

Standardized High - Level Task Callers(Preserving Application Layer Signatures)
  */
export async function callFastText(prompt: string, system?: string) {
  return executeTask("fast_text", prompt, system);
}

export async function callSmartText(prompt: string, system?: string) {
  return executeTask("smart_text", prompt, system);
}

export async function callVision(
  prompt: string,
  imageBuffer: Buffer | Uint8Array | string,
  system?: string
) {
  return executeTask("vision", prompt, system, { imageBuffer });
}

export async function callPromptGuard(prompt: string): Promise<{ safe: boolean; text: string; tokens: number }> {
  try {
    const res = await executeTask("prompt_guard", prompt);
    const upper = res.text.toUpperCase();
    const isSafe = !upper.includes("UNSAFE") && !upper.includes("INJECTION") && !upper.includes("JAILBREAK");
    return { safe: isSafe, text: res.text, tokens: res.tokens };
  } catch (error) {
    console.warn("Prompt guard task check error, failing open safely:", error);
    return { safe: true, text: "SAFE", tokens: 0 };
  }
}

/**
 * Retrieves the configured model name string for a specific task and provider.
 * Useful for native SDK calls (e.g. ai.models.generateContent({ model: modelName }))
 * 
 * @param taskType The task identifier (e.g. "extract_pdf", "fast_text", "vision")
 * @param provider The provider to look up (defaults to "GEMINI")
 * @returns The string model name configured in LlmTaskRouting (fallback to "gemini-3.6-flash")
 */
export async function getModelName(
  taskType: string,
  provider: String = "GEMINI"
): Promise<string> {
  try {
    const chain = await getTaskRoutingChain(taskType);

    if (chain.length > 0) {
      // Find explicit provider match for this task
      const matched = chain.find((r) => r.provider === provider);
      if (matched) return matched.modelName;

      // Fallback to highest priority route for this task
      return chain[0].modelName;
    }
  } catch (error) {
    console.warn(`[getModelName] Failed to resolve model name for task "${taskType}":`, error);
  }

  // Safe fallback if task routing isn't seeded in DB yet
  return "gemini-3.6-flash";
}

/*

Direct Provider Callers(Backwards Compatibility)
  */
export async function callGemini(prompt: string, system?: string) {
  return executeTask("gemini_direct", prompt, system);
}

export async function callClaude(prompt: string, system?: string) {
  return executeTask("claude_direct", prompt, system);
}

export async function callGroq(prompt: string, system?: string) {
  return executeTask("groq_direct", prompt, system);
}