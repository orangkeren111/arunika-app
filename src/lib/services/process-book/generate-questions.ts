"use server";

import { generateText } from "ai";
import { Prisma } from "@prisma/client";
import prisma from "../db/prisma";
import { BOOK_PROMPTS } from "../llm/prompts";
import { callSmartText } from "../llm/router";
import { parseLLMResponse } from "../../utils/sanitizeJSON";

export async function generateQuestionsWithLLM(babId: number, totalJumlahSoal: number = 10, jumlahSoalMcq: number = 7, jumlahSoalEssay: number = 3, pilihanMcq: number = 4) {
  // 1. Fetch chapter (bab) details
  const bab = await prisma.bab.findUnique({
    where: { id: babId },
    include: { kompetensi: true },
  });
  const buku = await prisma.buku.findUnique({
    where: { id: bab?.bukuId },
    select: { guru: { select: { sekolah: { select: { tingkat: true } } } } },
  })

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
  const numCompetencies = competencies.length
  const baseMcq = Math.floor(jumlahSoalMcq / numCompetencies);
  const baseEssay = Math.floor(jumlahSoalEssay / numCompetencies);

  // 2. Calculate the leftovers
  const remainderMcq = jumlahSoalMcq % numCompetencies;
  const remainderEssay = jumlahSoalEssay % numCompetencies;

  for (const [i, comp] of competencies.entries()) {
    // 2. Fetch existing good and bad questions context
    // const goodSoals = await prisma.bankSoal.findMany({
    //   where: { babId, kompetensiBabId: comp.id, isAccepted: true },
    //   take: 10,
    //   select: { teksSoal: true },
    // });

    // const badSoals = await prisma.bankSoal.findMany({
    //   where: { babId, kompetensiBabId: comp.id, isRejected: true },
    //   take: 10,
    //   select: { teksSoal: true },
    // });

    // const goodList = goodSoals.map((s) => s.teksSoal);
    // const badList = badSoals.map((s) => s.teksSoal);

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
      )}\n\Note: If the soal fits an image, you can put "linkGambarSoal" with the imagePath in the soal object. If the soal does not need an image, leave "linkGambarSoal" as null. If there are no image that fits, leave it at null. Please remember that not every question has to have an image, and don't make your own imagePath`;
    }
    const currentMcqCount = baseMcq + (i < remainderMcq ? 1 : 0);
    const currentEssayCount = baseEssay + (i < remainderEssay ? 1 : 0);

    const currentTotal = currentMcqCount + currentEssayCount;
    if (currentTotal === 0) return null;

    const prompt = `${BOOK_PROMPTS.generateQuestionsByKompetensi(
      currentTotal,
      currentMcqCount,
      currentEssayCount,
      pilihanMcq,
      bab.judulBab,
      bab.learningGoals ?? "",
      comp.nomerKompetensi,
      comp.isiKompetensi,
      [],
      [],
      buku?.guru?.sekolah?.tingkat ?? "SMA",
    )}${imageCatalogPrompt}`;

    // 3. Ask central Smart Text Model (providers.ts) to generate questions
    const result = await callSmartText(prompt)

    let rawText = result.text.replace(/```json|```/g, "").trim();

    const sanitizeJsonLatex = (str: string) => {
      // Convert formfeed (\f) followed by letters back to \\f (e.g., \frac)
      let cleaned = str.replace(/\f([a-zA-Z]+)/g, "\\\\f$1");
      // Escape any backslash that is not a valid JSON escape sequence
      return cleaned.replace(/\\(?![\\"\/bfnrtu])/g, "\\\\");
    };
    function isValidImagePath(path: string) {
      return (
        path.startsWith("/uploads/book_images/") &&
        /\.(png|jpg|jpeg|webp)$/i.test(path)
      );
    }

    let parsedResponse: any = {};
    try {
      parsedResponse = parseLLMResponse(result.text)
    } catch (error: any) {
      console.error(`[Question Generator Error] Failed parsing JSON for Bab ID ${babId}, Competency ID ${comp.id}`);
      console.error(`[Question Generator Error] Raw LLM Output:\n${result.text}`);
      throw new Error(`LLM output invalid JSON: ${error.message}`);
    }

    const tokens = result.tokens ?? 0;
    totalTokens += tokens;

    const rawQuestions = parsedResponse.questions || [];

    // 4. Validate questions before inserting into database
    const validQuestions = rawQuestions.filter((q: any) => {
      if (!q || !q.soal || typeof q.soal !== "string" || q.soal.trim() === "") {
        return false;
      }

      const type = q.tipeSoal || "MCQ";
      if (type === "MCQ") {
        // Strict check: MCQ must have non-null options array with at least 2 items and valid correctIndex
        if (
          !Array.isArray(q.options) ||
          q.options.length < 2 ||
          q.options.some((opt: any) => typeof opt !== "string" || opt.trim() === "")
        ) {
          console.warn(`[Question Generator] Dropped invalid MCQ with missing/null options: "${q.soal}"`);
          return false;
        }

        if (
          q.correctIndex === undefined ||
          typeof q.correctIndex !== "number" ||
          q.correctIndex < 0 ||
          q.correctIndex >= q.options.length
        ) {
          console.warn(`[Question Generator] Dropped invalid MCQ with out-of-bounds correctIndex: "${q.soal}"`);
          return false;
        }
      }

      return true;
    });

    allGenerated.push(...validQuestions);

    if (validQuestions.length > 0) {
      // 5. Save the validated questions to the database linked to this competency
      await prisma.bankSoal.createMany({
        data: validQuestions.map((q: any) => ({
          babId: bab.id,
          kompetensiBabId: comp.id,
          teksSoal: q.soal,
          type: q.tipeSoal || "MCQ",
          opsiJawaban: q.options || null,
          jawabanBenarMcq: q.options && q.correctIndex !== undefined ? q.options[q.correctIndex] : null,
          jawabanBenarEssay: q.explanation || q.jawabanBenarEssay || null,
          difficulty: Number(q.difficulty ?? 5),
          bloomLevel: q.bloomLevel || "C1",
          tags: Array.isArray(q.tags) ? q.tags.map(String) : [],
          linkGambarSoal: q.linkGambarSoal && isValidImagePath(q.linkGambarSoal) ? q.linkGambarSoal : null,
          isAccepted: true,
          isRejected: false,
        })),
      });
    }

    // 6. Delete any legacy corrupt questions from bank soal where type = MCQ and opsiJawaban is null or missing
    await prisma.bankSoal.deleteMany({
      where: {
        babId: bab.id,
        kompetensiBabId: comp.id,
        type: "MCQ",
        OR: [
          { opsiJawaban: { equals: Prisma.JsonNull } },
          { jawabanBenarMcq: null },
        ],
      },
    }).catch((err) => {
      console.warn("[Question Generator] Cleanup of invalid questions skipped/warned:", err);
    });
  }

  return { questions: allGenerated, tokens: totalTokens };
}

export async function enqueueGenerateQuestions(babId: number, totalJumlahSoal: number = 10, jumlahSoalMcq: number = 7, jumlahSoalEssay: number = 3, pilihanMcq: number = 4) {
  await prisma.taskQueue.create({
    data: {
      type: "generate_soal",
      payload: {
        babId,
        totalJumlahSoal,
        jumlahSoalMcq,
        jumlahSoalEssay,
        pilihanMcq,
      },
    },
  });
  return { success: true, message: "Question generation queued." };
}
