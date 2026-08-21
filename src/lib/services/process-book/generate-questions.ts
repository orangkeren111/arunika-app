"use server";

import { generateText } from "ai";
import prisma from "../db/prisma";
import { getSmartTextModel } from "../llm/providers";
import { BOOK_PROMPTS } from "../llm/prompts";

export async function generateQuestionsWithGroq(babId: number, totalJumlahSoal: number = 10) {
  // 1. Fetch chapter (bab) details
  const bab = await prisma.bab.findUnique({
    where: { id: babId },
    include: { kompetensi: true },
  });

  if (!bab) throw new Error("Bab not found");

  const competencies = bab.kompetensi;
  if (competencies.length === 0) {
    throw new Error("No competencies linked to this Bab yet. Please add or link competencies first.");
  }

  // Calculate questions per competency
  const questionsPerComp = Math.max(1, Math.ceil(totalJumlahSoal / competencies.length));
  let totalTokens = 0;
  const allGenerated: any[] = [];

  // Fetch available cropped textbook images for this chapter/book
  const availableImages = await prisma.bukuImage.findMany({
    where: {
      bukuId: bab.bukuId,
      babId: bab.id,
      status: "PROCESSED",
    },
    take: 15,
    select: {
      imagePath: true,
      caption: true,
      keywords: true,
    },
  });

  for (const comp of competencies) {
    // 2. Fetch existing good and bad questions context
    const goodSoals = await prisma.bankSoal.findMany({
      where: { babId, kompetensiBabId: comp.id, isAccepted: true },
      take: 10,
      select: { teksSoal: true },
    });

    const badSoals = await prisma.bankSoal.findMany({
      where: { babId, kompetensiBabId: comp.id, isRejected: true },
      take: 10,
      select: { teksSoal: true },
    });

    const goodList = goodSoals.map((s) => s.teksSoal);
    const badList = badSoals.map((s) => s.teksSoal);

    // Build image catalog prompt string if images are available
    let imageCatalogPrompt = "";
    if (availableImages.length > 0) {
      imageCatalogPrompt = `\n These are taken images to support the question generation: \n${JSON.stringify(
        availableImages.map((img) => ({
          imagePath: img.imagePath,
          caption: img.caption,
          keywords: img.keywords,
        })),
        null,
        2
      )}\n\Note: If the soal fits an image, you can put "linkGambarSoal" with the imagePath in the soal object. If the soal does not need an image, leave "linkGambarSoal" as null. Please remember that not every question has to have an image`;
    }

    const prompt = `${BOOK_PROMPTS.generateQuestionsByKompetensi(
      questionsPerComp,
      bab.judulBab,
      comp.nomerKompetensi,
      comp.isiKompetensi,
      goodList,
      badList
    )}${imageCatalogPrompt}`;

    // 3. Ask central Smart Text Model (providers.ts) to generate questions
    const result = await generateText({
      model: getSmartTextModel(),
      prompt,
    });

    let rawText = result.text.replace(/```json|```/g, "").trim();

    let parsedResponse: any = {};
    try {
      // First attempt: direct JSON parse
      parsedResponse = JSON.parse(rawText);
    } catch {
      try {
        // Second attempt: extract JSON substring matching outermost braces { ... }
        const startIdx = rawText.indexOf("{");
        const endIdx = rawText.lastIndexOf("}");
        if (startIdx !== -1 && endIdx > startIdx) {
          const jsonSub = rawText.slice(startIdx, endIdx + 1);
          parsedResponse = JSON.parse(jsonSub);
        } else {
          throw new Error("No valid JSON object bounds found in model output.");
        }
      } catch (parseErr: any) {
        console.error(`[Question Generator Error] Failed parsing JSON for Bab ID ${babId}, Competency ID ${comp.id}`);
        console.error(`[Question Generator Error] Raw LLM Output:\n${result.text}`);
        throw new Error(`LLM output invalid JSON: ${parseErr.message}`);
      }
    }

    const tokens = result.usage?.totalTokens ?? 0;
    totalTokens += tokens;

    const questions = parsedResponse.questions || [];
    allGenerated.push(...questions);

    // 4. Save the final questions to the database linked to this competency
    await prisma.bankSoal.createMany({
      data: questions.map((q: any) => ({
        babId: bab.id,
        kompetensiBabId: comp.id,
        teksSoal: q.soal,
        type: q.tipeSoal || "MCQ",
        opsiJawaban: q.options || null,
        jawabanBenarMcq: q.options && q.correctIndex !== undefined ? q.options[q.correctIndex] : null,
        difficulty: Number(q.difficulty ?? 5),
        bloomLevel: q.bloomLevel || "C1",
        linkGambarSoal: q.linkGambarSoal || null,
        isAccepted: true,
        isRejected: false,
      })),
    });
  }

  return { questions: allGenerated, tokens: totalTokens };
}

export async function enqueueGenerateQuestions(babId: number, totalJumlahSoal: number = 10) {
  // 1. Enqueue job into taskQueue
  await prisma.taskQueue.create({
    data: {
      type: "generate_soal",
      payload: {
        babId,
        totalJumlahSoal,
      },
    },
  });

  // 2. Fire and forget worker trigger
  fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/llm/worker`, {
    method: "POST",
  }).catch(() => { });

  return { success: true, message: "Question generation queued." };
}
