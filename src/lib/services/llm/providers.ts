import { generateText, LanguageModel } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import prisma from "../db/prisma";
import { GoogleGenAI } from "@google/genai";
import { decryptApiKey, encryptApiKey } from "@/src/lib/utils/hasher";



// In-Memory Key Cache with TTL (60 Seconds) to minimize database reads
interface CachedKeys {
  keys: Array<{ id: string; key: string }>;
  fetchedAt: number;
}
const keyCache = new Map<String, CachedKeys>();
const CACHE_TTL_MS = 60 * 1000;

export function invalidateKeyCache(provider?: String) {
  if (provider) {
    keyCache.delete(provider);
  } else {
    keyCache.clear();
  }
}

/*

Retrieves valid API keys for a provider(active and not in cooldown)
  */
async function getValidApiKeys(provider: String): Promise<Array<{ id: string; key: string }>> {
  const now = Date.now();
  const cached = keyCache.get(provider);

  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.keys;
  }

  const keys = await prisma.llmApiKey.findMany({
    where: {
      provider: String(provider),
      isActive: true,
      OR: [
        { cooldownUntil: null },
        { cooldownUntil: { lte: new Date() } }
      ]
    },
    select: { id: true, key: true },
    orderBy: { lastUsedAt: "asc" } // Prefers least recently used keys (round-robin style)
  });

  // Decrypt all keys at once
  const readyKeys = keys.map((item) => ({
    id: item.id,
    key: decryptApiKey(item.key),
  }));

  keyCache.set(provider, { keys: readyKeys, fetchedAt: now });
  return readyKeys;
}

/*

Places an API key on a temporary cooldown upon rate - limiting or server failure
*/
async function markKeyCooldown(keyId: string, durationMinutes = 5) {
  const cooldownUntil = new Date(Date.now() + durationMinutes * 60 * 1000);
  try {
    await prisma.llmApiKey.update({
      where: { id: keyId },
      data: {
        cooldownUntil,
        errorCount: { increment: 1 }
      }
    });
    invalidateKeyCache();
  } catch (err) {
    console.error(`Failed to mark key ${keyId} on cooldown:`, err);
  }
}

/*

Records key usage timestamp and resets error counts on success
  */
async function markKeySuccess(keyId: string) {
  try {
    await prisma.llmApiKey.update({
      where: { id: keyId },
      data: {
        lastUsedAt: new Date(),
        errorCount: 0,
        cooldownUntil: null
      }
    });
  } catch (err) {
    console.error(`Failed to record key success for ${keyId}:`, err);
  }
}

/*

Dynamically instantiates the appropriate AI SDK client model using a specific API key
*/
function createSdkModel(provider: String, apiKey: string, modelName: string): LanguageModel {
  switch (provider) {
    case "GEMINI": {
      const google = createGoogleGenerativeAI({ apiKey });
      return google(modelName);
    }
    case "ANTHROPIC": {
      const anthropic = createAnthropic({ apiKey });
      return anthropic(modelName);
    }
    case "GROQ": {
      const groq = createOpenAI({
        baseURL: "https://api.groq.com/openai/v1",
        apiKey
      });
      return groq(modelName);
    }
    case "OPENROUTER": {
      const openrouter = createOpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey,
        headers: {
          "HTTP-Referer": "https://arunika.app",
          "X-Title": "Arunika LMS"
        }
      });
      return openrouter(modelName);
    }
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

export interface ModelCallPayload {
  provider: String;
  modelName: string;
  prompt: string;
  system?: string;
  imageBuffer?: Buffer | Uint8Array | string;
}

export interface ModelCallResponse {
  text: string;
  tokens: number;
  providerUsed: String;
  modelUsed: string;
}

/*

Low - level execution engine: Rotates through available API keys for a given provider.

  Catches 429 / 5xx errors, triggers key cooldown, and tries the next available key.
*/
export async function executeModelCall(payload: ModelCallPayload): Promise<ModelCallResponse> {
  const keys = await getValidApiKeys(payload.provider);

  if (keys.length === 0) {
    throw new Error(`No active API keys available for provider: ${payload.provider}`);
  }

  let lastError: any = null;

  for (const { id: keyId, key } of keys) {
    try {
      const model = createSdkModel(payload.provider, key, payload.modelName);

      let textResult: string;
      let usageResult: any;

      if (payload.imageBuffer) {
        // Multimodal execution for Vision tasks
        const { text, usage } = await generateText({
          model,
          system: payload.system,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: payload.prompt },
                {
                  type: "image",
                  image: payload.imageBuffer,
                }
              ]
            }
          ]
        });
        textResult = text;
        usageResult = usage;
      } else {
        // Standard text execution
        const { text, usage } = await generateText({
          model,
          system: payload.system,
          prompt: payload.prompt
        });
        textResult = text;
        usageResult = usage;
      }

      // Asynchronously record success
      markKeySuccess(keyId).catch(() => { });

      return {
        text: textResult,
        tokens: usageResult?.totalTokens ?? 0,
        providerUsed: payload.provider,
        modelUsed: payload.modelName
      };
    } catch (error: any) {
      lastError = error;
      const errorMessage = String(error?.message || error);
      const statusCode = error?.status || error?.statusCode;

      const isRateLimit = statusCode === 429 || errorMessage.includes("429") || errorMessage.toLowerCase().includes("quota");
      const isServerError = statusCode >= 500 && statusCode < 600;

      if (isRateLimit || isServerError) {
        console.warn(`[Key Failure] Provider ${payload.provider} (Key ID: ${keyId}) failed. Placing key on cooldown. Reason: ${errorMessage}`);
        await markKeyCooldown(keyId, isRateLimit ? 10 : 2);
        continue; // Try next key in the pool
      }

      // If it's a prompt format or client input error (400), don't retry other keys
      throw error;
    }
  }

  throw new Error(`All keys for provider ${payload.provider} failed. Last error: ${lastError?.message || lastError}`);
}


/**
 * Instantiates and returns a GoogleGenAI SDK client powered by an active database API key.
 * Includes a reportError helper so feature functions can report 429/5xx key errors back to the pool.
 */
export async function getGoogleGenAI(): Promise<{
  ai: GoogleGenAI;
  keyId: string;
  reportError: (err: any) => Promise<void>;
}> {
  const keys = await getValidApiKeys("GEMINI");
  if (keys.length === 0) {
    throw new Error("No active GEMINI API keys available in database.");
  }

  const { id: keyId, key } = keys[0];
  const ai = new GoogleGenAI({ apiKey: key });

  return {
    ai,
    keyId,
    reportError: async (err: any) => {
      const errorMessage = String(err?.message || err);
      const statusCode = err?.status || err?.statusCode;
      const isRateLimit = statusCode === 429 || errorMessage.includes("429") || errorMessage.toLowerCase().includes("quota");
      const isServerError = statusCode >= 500 && statusCode < 600;

      if (isRateLimit || isServerError) {
        await markKeyCooldown(keyId, isRateLimit ? 10 : 2);
      }
    }
  };
}

/**
 * Returns a Vercel AI SDK Google Generative AI LanguageModelV1 instance
 * powered by an active database key.
 */
export async function getGeminiModel(modelName: string = "gemini-3.5-flash-lite"): Promise<{
  model: LanguageModel;
  keyId: string;
}> {
  const keys = await getValidApiKeys("GEMINI");
  if (keys.length === 0) {
    throw new Error("No active GEMINI API keys available in database.");
  }

  const { id: keyId, key } = keys[0];
  const google = createGoogleGenerativeAI({ apiKey: key });

  return {
    model: google(modelName),
    keyId
  };
}