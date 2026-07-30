"use server";

import { GoogleGenAI, Content, File as GeminiFile } from "@google/genai";
import prisma from "../db/prisma";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Poll until the uploaded file is ACTIVE (or FAILED / timeout)
async function waitForFileActive(
  name: string,
  { timeoutMs = 60_000, intervalMs = 1500 } = {},
): Promise<GeminiFile> {
  const start = Date.now();
  let file = await ai.files.get({ name });

  while (file.state === "PROCESSING") {
    if (Date.now() - start > timeoutMs) {
      throw new Error(`Timed out waiting for file ${name} to become ACTIVE`);
    }
    await new Promise((r) => setTimeout(r, intervalMs));
    file = await ai.files.get({ name });
  }

  if (file.state !== "ACTIVE") {
    throw new Error(`File ${name} ended in unexpected state: ${file.state}`);
  }

  return file;
}

export async function processPdfWithGemini(
  jobId: number,
  tempFilePath: string,
) {
  let uploadedName: string | undefined;

  try {
    // 1. Update job status
    const job = await prisma.generationJob.update({
      where: { id: jobId },
      data: { status: "PROCESSING_PDF" },
      select: { bukuId: true },
    });

    // 2. Upload to Gemini File API
    const uploadedFile = await ai.files.upload({
      file: tempFilePath,
      config: { mimeType: "application/pdf" },
    });
    uploadedName = uploadedFile.name ?? undefined;

    if (!uploadedName) {
      throw new Error("Upload succeeded but returned no file name");
    }

    // 2b. Wait until Gemini has finished processing the file
    const activeFile = await waitForFileActive(uploadedName);

    // 3. Extract Chapters and Goals via Gemini
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: [
        {
          role: "user",
          parts: [
            {
              fileData: {
                fileUri: activeFile.uri,
                mimeType: activeFile.mimeType,
              },
            },
            {
              text: "Read this document. Return a JSON array of objects. Each object must have a 'chapterTitle' and an array of 'learningGoals' summarizing the key points.",
            },
          ],
        },
      ] as Content[],
      config: { responseMimeType: "application/json" },
    });

    const extractedData = JSON.parse(response.text ?? "[]");

    const savedObjectives = await Promise.all(
      extractedData.map((chapter: any) =>
        prisma.bab.create({
          data: {
            bukuId: job.bukuId,
            judulBab: chapter.chapterTitle,
            learningGoals: JSON.stringify(chapter.learningGoals),
          },
        }),
      ),
    );

    const totalTokens = response.usageMetadata?.totalTokenCount ?? 0;

    return { objectives: savedObjectives, tokens: totalTokens };
  } catch (error) {
    await prisma.generationJob.update({
      where: { id: jobId },
      data: { status: "FAILED" },
    });
    throw error;
  } finally {
    // 5. Clean up Google's servers regardless of success/failure
    if (uploadedName) {
      await ai.files.delete({ name: uploadedName }).catch(() => {
        // don't let cleanup failure mask the real error
      });
    }
  }
}
