import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { GoogleGenAI } from "@google/genai";

// Initialize SDK Instances (Singletons)
export const googleGenAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
export const DEFAULT_GEMINI_MODEL = process.env.QUIZ_AGENT_MODEL || "gemini-3.5-flash-lite";

export const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
export const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
export const groq = createOpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
});
export const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || process.env.GROQ_API_KEY,
  headers: {
    "HTTP-Referer": "https://arunika.app",
    "X-Title": "Arunika LMS",
  },
});

export type LLMProvider = "gemini" | "claude" | "groq" | "openrouter";

/**
 * Model Resolver Functions (Centralized Model Configuration)
 */
export function getVisionModel() {
  if (process.env.GROQ_API_KEY) {
    return groq("qwen/qwen3.6-27b");
  }
  if (process.env.GEMINI_API_KEY) {
    return google("models/gemini-3.5-flash-lite");
  }
  return groq("llama-3.2-11b-vision-preview");
}

export function getFallbackVisionModel() {
  if (process.env.GEMINI_API_KEY) {
    return google("models/gemini-3.5-flash-lite");
  }
  return google("models/gemini-3.5-flash-lite");
}

export function getFastTextModel() {
  return google("gemini-3.5-flash-lite");

  const modelName = process.env.FAST_TEXT_MODEL || "llama-3.1-8b-instant";
  if (process.env.GROQ_API_KEY) {
    return groq(modelName);
  }
  return google("models/gemini-3.5-flash-lite");
}

export function getSmartTextModel() {
  return google("gemini-3.5-flash-lite");

  const modelName = process.env.SMART_TEXT_MODEL || "llama-3.3-70b-versatile";
  if (process.env.GROQ_API_KEY) {
    return groq(modelName);
  }
  if (process.env.ANTHROPIC_API_KEY) {
    return anthropic("claude-3-5-sonnet-20240620");
  }
}

export function getPromptGuardModel() {
  if (process.env.GROQ_API_KEY) {
    return groq("meta-llama/llama-prompt-guard-2-86m");
  }
  return google("models/gemini-3.5-flash-lite");
}

/**
 * Standardized Caller Functions
 */
export async function callPromptGuard(
  prompt: string,
): Promise<{ safe: boolean; text: string; tokens: number }> {
  try {
    const { text, usage } = await generateText({
      model: getPromptGuardModel(),
      prompt: prompt,
    });
    const isSafe = !text.toUpperCase().includes("UNSAFE") && !text.toUpperCase().includes("INJECTION") && !text.toUpperCase().includes("JAILBREAK");
    return { safe: isSafe, text, tokens: usage?.totalTokens ?? 0 };
  } catch (error) {
    console.warn("Prompt guard check error, failing open safely:", error);
    return { safe: true, text: "SAFE", tokens: 0 };
  }
}

export async function callGemini(
  prompt: string,
  system?: string,
): Promise<{ text: string; tokens: number }> {
  const { text, usage } = await generateText({
    model: google("models/gemini-3.5-flash-lite"),
    system,
    prompt,
  });
  return { text, tokens: usage.totalTokens ?? 0 };
}

export async function callClaude(
  prompt: string,
  system?: string,
): Promise<{ text: string; tokens: number }> {
  const { text, usage } = await generateText({
    model: anthropic("claude-3-5-sonnet-20240620"),
    system,
    prompt,
  });
  return { text, tokens: usage.totalTokens ?? 0 };
}

export async function callGroq(
  prompt: string,
  system?: string,
): Promise<{ text: string; tokens: number }> {
  const { text, usage } = await generateText({
    model: getSmartTextModel(),
    system,
    prompt,
  });
  return { text, tokens: usage.totalTokens ?? 0 };
}
