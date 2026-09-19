"use server";
// lib/generator.ts
import prisma from "../db/prisma";
import { REPORT_PROMPTS } from "../llm/prompts";
import { callPromptGuard, callSmartText } from "../llm/router";

export async function generateReport(task: any, payload: any) {
  let tokensSpent = 0;

  // Step 1: Prompt Guard Verification
  const textToGuard = String(
    payload.studentInputOnly || payload.prompt || ""
  ).slice(0, 1500);

  const guardCheck = await callPromptGuard(textToGuard);
  tokensSpent += guardCheck.tokens;

  if (!guardCheck.safe) {
    console.warn(
      `Task ${task.id} failed prompt guard check:`,
      guardCheck.text
    );

    await prisma.savedResponses.update({
      where: { attemptId: payload.attemptId },
      data: {
        overview:
          "Peringatan Keamanan: Terdeteksi indikasi manipulasi prompt pada jawaban/pertanyaan.",
        weakness:
          "Tidak dapat menganalisis karena masalah keamanan.",
        recommendation:
          "Silakan periksa jawaban siswa secara manual.",
        status: "FAILED",
      },
    });

    throw new Error("Prompt guard rejected payload");
  }

  // Step 2: Smart Text Execution
  const result = await callSmartText(payload.prompt);
  tokensSpent += result.tokens;

  let rawText = result.text
    .replace(/```json|```/g, "")
    .trim();

  const sanitizeJsonLatex = (str: string) => {
    let cleaned = str.replace(
      /\f([a-zA-Z]+)/g,
      "\\\\f$1"
    );

    cleaned = cleaned.replace(
      /\\(?![\\"\/bfnrtu])/g,
      "\\\\"
    );

    // Escape literal control characters inside JSON strings
    let result = "";
    let insideString = false;
    let escaped = false;

    for (const char of cleaned) {
      if (char === '"' && !escaped) {
        insideString = !insideString;
        result += char;
        continue;
      }

      if (insideString) {
        if (char === "\n") {
          result += "\\n";
          continue;
        }

        if (char === "\r") {
          result += "\\r";
          continue;
        }

        if (char === "\t") {
          result += "\\t";
          continue;
        }
      }

      result += char;
      escaped = char === "\\" && !escaped;

      if (char !== "\\") {
        escaped = false;
      }
    }

    return result;
  };

  let parsedResult: any = {};

  try {
    // First attempt: direct JSON parse
    parsedResult = JSON.parse(rawText);
  } catch {
    try {
      // Second attempt: parse sanitized JSON
      parsedResult = JSON.parse(
        sanitizeJsonLatex(rawText)
      );
    } catch {
      try {
        // Third attempt: extract JSON object from model output
        const startIdx = rawText.indexOf("{");
        const endIdx = rawText.lastIndexOf("}");

        if (startIdx !== -1 && endIdx > startIdx) {
          const jsonSub = rawText.slice(
            startIdx,
            endIdx + 1
          );

          parsedResult = JSON.parse(
            sanitizeJsonLatex(jsonSub)
          );
        } else {
          throw new Error(
            "No valid JSON object bounds found in model output."
          );
        }
      } catch (parseErr: any) {
        console.error(
          `[Report Generator Error] Failed parsing JSON for Task ${task.id}`
        );

        console.error(
          `[Report Generator Error] Raw LLM Output:\n${result.text}`
        );

        throw new Error(
          `LLM output invalid JSON: ${parseErr.message}`
        );
      }
    }
  }

  // Step 3: Update SavedResponse
  await prisma.savedResponses.update({
    where: { attemptId: payload.attemptId },
    data: {
      overview: parsedResult.overview,
      weakness: parsedResult.weakness,
      recommendation: parsedResult.recommendation,
      status: "DONE",
    },
  });

  // Step 4: Update essay answers
  if (Array.isArray(parsedResult.essayChecks)) {
    for (const check of parsedResult.essayChecks) {
      if (check.jawabanId) {
        await prisma.jawabanSiswa
          .update({
            where: {
              id: Number(check.jawabanId),
            },
            data: {
              aiResponse: check.aiResponse || null,
              isCorrect:
                typeof check.isCorrect === "boolean"
                  ? check.isCorrect
                  : undefined,
              nilaiPoin:
                typeof check.points === "number"
                  ? check.points
                  : undefined,
            },
          })
          .catch((e) => {
            console.error(
              `Failed to update JawabanSiswa ${check.jawabanId}:`,
              e
            );
          });
      }
    }
  }

  return {
    result: parsedResult,
    tokens: tokensSpent,
  };
}

/**
 * Calculates metrics and enqueues the LLM generation task.
 * Called immediately when the user finishes the exam.
 */
export async function enqueueStudentReport(attemptId: number) {
  // 0. Validate report isn't queued
  const existingReport = await prisma.taskQueue.findFirst({
    where: {
      type: "generate_report",
      payload: { path: ["attemptId"], equals: attemptId }
    },
  });
  if (existingReport) {
    return { success: true, message: "Report already queued." };
  }
  // 1. Fetch data with question details
  const history = await prisma.jawabanSiswa.findMany({
    where: { attemptId },
    include: {
      soalAsli: {
        include: {
          kompetensiBab: true,
        },
      },
    },
  });

  if (history.length === 0) {
    throw new Error("No answers found for this attempt.");
  }

  // 2. Pre-calculate metrics & aggregate stats to save LLM tokens
  const total = history.length;
  const correct = history.filter((h) => h.isCorrect).length;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  // Aggregate stats by Bloom Level
  const bloomSummary: Record<string, { total: number; correct: number }> = {};
  history.forEach((h) => {
    const level = h.bloomLevel || "Unknown";
    if (!bloomSummary[level]) bloomSummary[level] = { total: 0, correct: 0 };
    bloomSummary[level].total += 1;
    if (h.isCorrect) bloomSummary[level].correct += 1;
  });

  const bloomText = Object.entries(bloomSummary)
    .map(([lvl, stat]) => `${lvl}: ${stat.correct}/${stat.total} (${Math.round((stat.correct / stat.total) * 100)}%)`)
    .join(", ");

  // Collect untrusted student input text specifically for prompt guard check (max 1500 chars)
  const studentInputOnly = history
    .filter((h) => h.type === "ESSAY" && h.jawabanSiswa)
    .map((h) => `Q${h.id}: ${h.jawabanSiswa}`)
    .join("\n")
    .slice(0, 1500);

  // Format history for LLM Prompt concisely
  const historyText = history
    .map((h) => {
      const kompetensi = h.soalAsli?.kompetensiBab?.isiKompetensi || "Umum";
      const nomerKompetensi = h.soalAsli?.kompetensiBab?.nomerKompetensi || "-";

      if (h.type === "MCQ") {
        // Lightweight concise log for objective questions
        return `[MCQ] ID:${h.id} | Komp:(${nomerKompetensi}) ${kompetensi} | Bloom:${h.bloomLevel || "Unknown"} | Result:${h.isCorrect ? "BENAR" : "SALAH"}`;
      } else {
        // Detailed context for essay questions requiring LLM grading
        const correctRef = h.jawabanBenarEssay || h.soalAsli?.jawabanBenarEssay || "Gunakan standar penilaian umum";
        return `[ESSAY] ID:${h.id} | Komp:(${nomerKompetensi}) ${kompetensi} | Bloom:${h.bloomLevel || "Unknown"} | Question:"${h.teksSoal}" | Key:"${correctRef}" | Student Answer:"${h.jawabanSiswa || "Tidak dijawab"}" | Marked Correct:${h.isCorrect}`;
      }
    })
    .join("\n");

  const fullPromptText = `Overall Metrics: Total Questions: ${total}, Total Accuracy: ${accuracy}%, Bloom Breakdown: [${bloomText}]\n\nStudent History Logs:\n${historyText}`;

  const prompt = REPORT_PROMPTS.analysis(fullPromptText);

  // 3. Create the placeholder in SavedResponses for client polling
  await prisma.savedResponses.upsert({
    where: { attemptId: attemptId },
    update: { status: "PENDING" },
    create: {
      attemptId: attemptId,
      status: "PENDING",
      overview: "",
      weakness: "",
      recommendation: "",
    },
  });

  // 4. Insert Job into Queue with studentInputOnly payload for prompt guard
  await prisma.taskQueue.create({
    data: {
      type: "generate_report",
      payload: {
        attemptId: attemptId,
        prompt: prompt,
        studentInputOnly: studentInputOnly || "No essay answers provided.",
      },
    },
  });

  // 5. Return deterministic data immediately (used for the UI before PDF is ready)
  return {
    success: true,
    message: "Report generation queued.",
    interimData: {
      totalQuestions: total,
      accuracy: accuracy,
      highestTaxonomy: history[history.length - 1]?.bloomLevel || "Q1",
    },
  };
}
