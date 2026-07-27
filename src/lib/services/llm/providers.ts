import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai"; // Groq uses OpenAI compatible SDK

// Initialize SDKs
const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const groq = createOpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
});

export type LLMProvider = "gemini" | "claude" | "groq";

/**
 * 1. Caller functions for Gemini, Claude, and Groq
 * Standardizing the interface so the router can swap them effortlessly.
 */

export async function callGemini(
  prompt: string,
  system?: string,
): Promise<string> {
  const { text } = await generateText({
    model: google("models/gemini-1.5-flash"),
    system,
    prompt,
  });
  return text;
}

export async function callClaude(
  prompt: string,
  system?: string,
): Promise<string> {
  const { text } = await generateText({
    model: anthropic("claude-3-5-sonnet-20240620"),
    system,
    prompt,
  });
  return text;
}

export async function callGroq(
  prompt: string,
  system?: string,
): Promise<string> {
  const { text } = await generateText({
    model: groq("llama-3.3-70b-versatile"),
    system,
    prompt,
  });
  return text;
}
