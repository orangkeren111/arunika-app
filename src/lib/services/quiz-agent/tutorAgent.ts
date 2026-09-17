"use server";

import { Content, Part } from "@google/genai";
import { finishRemediationAndResumeQuizToolDeclaration } from "./tools";
import { updateQuizSessionMode } from "../db/quiz/quizDB";
import { getGoogleGenAI } from "../llm/providers";
import { getModelName } from "../llm/router";

export interface ChatMessageItem {
  role: "user" | "tutor";
  text: string;
}

export interface TutorChatResult {
  text: string;
  resumeQuiz: boolean;
  summary?: string;
}

const TUTOR_SYSTEM_PROMPT = `
You are Captain Chili (Kapten Chili), a warm, relaxed, and encouraging Capybara AI Teacher.
You are conducting 1-on-1 natural language micro-tutoring for a student in Indonesian.

Persona Guidelines:
- Tone: Extremely encouraging, warm, friendly, growth-minded, relaxed yet focused ("Santai tapi fokus bersama Kapten Chili! 🦫🌶️").
- Format: Keep your response concise (1-2 sentences maximum).
- Goal: Help the student understand their misconceptions on the failed tags/topics.
- When to resume quiz: If the student demonstrates clear concept understanding in their response, OR if the conversation reaches 3-4 chat turns, you MUST invoke the tool "finishRemediationAndResumeQuiz" with readyToResume = true.
`;

export async function runTutorAgentChat(
  sessionId: number,
  chatHistory: ChatMessageItem[],
  failedTags: string[] = [],
  contextSummary: string = ""
): Promise<TutorChatResult> {
  const { ai, reportError } = await getGoogleGenAI()
  let responseText = "Santai tapi fokus! Kapten Chili ada di sini untuk mendampingimu. Mari kita bahas topik ini bersama! 🦫🌶️";
  let resumeQuiz = false;
  let summary = "";

  // Turn count check: if user has already sent 3 or more messages, encourage closing remediation
  const userTurns = chatHistory.filter((m) => m.role === "user").length;

  try {
    const formattedHistory = chatHistory
      .map((m) => `${m.role === "user" ? "Murid" : "Kapten Chili"}: ${m.text}`)
      .join("\n");

    const promptText = `
Failed Topics / Tags needing remediation: ${failedTags.join(", ") || "Konsep Dasar"}
Context Summary: ${contextSummary}
Current User Chat Turns: ${userTurns}

Chat History:
${formattedHistory}

Respond to the student's latest message as Kapten Chili (1-2 sentences in Indonesian).
If the student clearly grasps the concept OR if Current User Chat Turns >= 3, call tool "finishRemediationAndResumeQuiz".
`;

    const contents: Content[] = [
      {
        role: "user",
        parts: [{ text: promptText }],
      },
    ];

    const tools = [
      {
        functionDeclarations: [finishRemediationAndResumeQuizToolDeclaration],
      },
    ];

    const response = await ai.models.generateContent({
      model: await getModelName("quiz_agent", "GEMINI"),
      contents,
      config: {
        tools,
        systemInstruction: TUTOR_SYSTEM_PROMPT,
      },
    });

    const candidate = response.candidates?.[0];
    const textPart = candidate?.content?.parts?.find((p) => p.text);
    if (textPart && textPart.text) {
      responseText = textPart.text.trim();
    }

    const functionCalls = response.functionCalls;
    if (functionCalls && functionCalls.length > 0) {
      const finishCall = functionCalls.find((c) => c.name === "finishRemediationAndResumeQuiz");
      if (finishCall && finishCall.args) {
        const args = finishCall.args as any;
        if (args.readyToResume === true) {
          resumeQuiz = true;
          summary = args.summary || "Remediasi selesai. Siap kembali ke kuis!";
        }
      }
    }

    // Auto-resume fallback if turn count >= 3 even if LLM didn't call tool
    if (userTurns >= 3) {
      resumeQuiz = true;
    }

    if (resumeQuiz) {
      // Update session mode back to QUIZ_ACTIVE in database
      await updateQuizSessionMode(sessionId, "QUIZ_ACTIVE");
    }
  } catch (error) {
    console.error("Error in runTutorAgentChat:", error);
  }

  return {
    text: responseText,
    resumeQuiz,
    summary,
  };
}
