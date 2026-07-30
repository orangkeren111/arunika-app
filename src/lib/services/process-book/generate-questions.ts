"use server";

import Groq from "groq-sdk";
import prisma from "../db/prisma";
import { BOOK_PROMPTS } from "../llm/prompts";
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function generateQuestionsWithGroq(babId: number, jumlahSoal: number = 10) {
  // 1. Fetch the specific learning goal from Prisma
  const objective = await prisma.bab.findUnique({
    where: { id: babId },
  });

  if (!objective) throw new Error("Objective not found");

  const prompt = BOOK_PROMPTS.generateQuestions(jumlahSoal, objective.judulBab, objective.learningGoals ?? "");

  // 2. Ask Groq to generate the specific questions enforcing strict JSON
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  const parsedResponse = JSON.parse(
    completion.choices[0].message.content || "{}",
  );

  const tokens = completion.usage?.total_tokens ?? 0;

  // 3. Save the final questions to the database
  await prisma.bankSoal.createMany({
    data: parsedResponse.questions.map((q: any) => ({
      babId: objective.id,
      teksSoal: q.soal,
      type: "MCQ",
      opsiJawaban: q.options,
      jawabanBenarMcq: q.options[q.correctIndex],
      difficulty: Number(q.difficulty ?? 0),
      bloomLevel: q.bloomLevel,
    })),
  });

  return { questions: parsedResponse.questions, tokens };
}
