"use server";

import { GoogleGenAI, Content, File as GeminiFile } from "@google/genai";
import prisma from "../db/prisma";
import fs from "fs/promises";
import { getGoogleGenAI } from "../llm/providers";

// Poll until the uploaded file is ACTIVE
async function waitForFileActive(
  name: string,
  { timeoutMs = 60_000, intervalMs = 1500 } = {},
): Promise<GeminiFile> {
  const start = Date.now();
  const { ai, reportError } = await getGoogleGenAI();
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

export async function processKurikulumExtract(tempFilePath: string) {
  let uploadedName: string | undefined;
  const { ai, reportError } = await getGoogleGenAI();

  try {
    // 1. Upload to Gemini File API
    const uploadedFile = await ai.files.upload({
      file: tempFilePath,
      config: { mimeType: "application/pdf" },
    });
    uploadedName = uploadedFile.name ?? undefined;

    if (!uploadedName) {
      throw new Error("Upload succeeded but returned no file name");
    }

    const activeFile = await waitForFileActive(uploadedName);

    // 2. Ask Gemini to extract curriculum details
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
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
              text: `Read this curriculum document. Return a JSON object with a key "kurikulum" containing an array of objects.
Each object must represent a competency and have the following fields:
- "nomerKompetensi": a string representing the code or number of the competency (e.g. "3.1", "KD 3.1", etc.)
- "isiKompetensi": a string representing the description of the competency
- "namaBab": a string representing the chapter or topic name
- "namaBuku": a string representing the name of the subject/book/pelajaran this curriculum belongs to.

Ensure the output is clean JSON without any markdown formatting.`,
            },
          ],
        },
      ] as Content[],
      config: { responseMimeType: "application/json" },
    });

    const text = response.text ?? "{}";
    const data = JSON.parse(text);
    const kurikulumArray = data.kurikulum || [];

    // Save to KompetensiPelajaran table
    for (const item of kurikulumArray) {
      await prisma.kompetensiPelajaran.create({
        data: {
          nomerKompetensi: String(item.nomerKompetensi || ""),
          isiKompetensi: String(item.isiKompetensi || ""),
          namaBab: String(item.namaBab || ""),
          namaBuku: String(item.namaBuku || ""),
        },
      });
    }

    // Attempt to delete local temp file
    await fs.unlink(tempFilePath).catch(() => { });

    return { tokens: response.usageMetadata?.totalTokenCount ?? 0 };
  } finally {
    if (uploadedName) {
      await ai.files.delete({ name: uploadedName }).catch(() => { });
    }
  }
}
