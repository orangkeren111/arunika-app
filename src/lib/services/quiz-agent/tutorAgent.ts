"use server";

import { Content, Part } from "@google/genai";
import { finishRemediationAndResumeQuizToolDeclaration } from "./tools";
import { generateWithGeminiFailover, getGoogleGenAI } from "../llm/providers";
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
- Format: Keep your response concise (1-3 sentences maximum).
- Goal: Help the student understand their misconceptions on the failed tags/topics.
- Strategy: Ask Socratic questions. Guide them to the answer, do NOT just give it to them. Let them think.
- Autonomy: You are in full control of this session. Keep chatting and testing the student's knowledge until you are absolutely convinced they understand the concept.
- When to resume quiz: ONLY when the student demonstrates clear, unquestionable concept understanding, invoke the tool "finishRemediationAndResumeQuiz" with readyToResume = true. Do not exit early.
`;

export async function runTutorAgentChat(
  sessionId: number,
  chatHistory: ChatMessageItem[],
  failedTags: string[] = [],
  contextSummary: string = ""
): Promise<TutorChatResult> {
  const { ai, reportError } = await getGoogleGenAI()
  let responseText = "Santai tapi fokus! Mari kita bahas topik ini secara mendalam bersama Kapten Chili! 🦫🌶️";
  let resumeQuiz = false;
  let summary = "";

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

Respond to the student's latest message as Kapten Chili. 
If and ONLY if the student clearly grasps the concept, call tool "finishRemediationAndResumeQuiz". Otherwise, keep asking questions.
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

    const response = await generateWithGeminiFailover(async (ai) => {
      return ai.models.generateContent({
        model: await getModelName("quiz_agent", "GEMINI"),
        contents,
        config: {
          tools,
          systemInstruction: TUTOR_SYSTEM_PROMPT,
        },
      });
    })
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

    // Safety fallback: only force exit if the chat goes excessively long (15 turns) to prevent infinite billing
    if (userTurns >= 15) {
      resumeQuiz = true;
    }

    // NOTE: Database Mode updating is now handled safely by the backend quizRepository!

  } catch (error) {
    console.error("Error in runTutorAgentChat:", error);
  }

  return {
    text: responseText,
    resumeQuiz,
    summary,
  };
}