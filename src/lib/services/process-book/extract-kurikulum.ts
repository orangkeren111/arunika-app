"use server";

import { GoogleGenAI, Content, File as GeminiFile } from "@google/genai";
import prisma from "../db/prisma";
import fs from "fs/promises";
import { processPdfWithGeminiFailover } from "../llm/providers";
import { getModelName } from "../llm/router";

export async function processKurikulumExtract(tempFilePath: string) {
  try {
    const result = await processPdfWithGeminiFailover(
      tempFilePath,
      async (ai, activeFile) => {
        // Ask Gemini to extract curriculum details
        const response = await ai.models.generateContent({
          model: await getModelName("process-book", "GEMINI"),
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
                  text: `Read this single chapter (bab) document. Return a JSON object with:
- 'chapterTitle': string, title or main topic of this chapter/bab
- 'learningGoals': an array of strings summarizing the key learning objectives/goals
- 'kompetensi': an array of objects representing the competencies of this chapter. Each competency object must have:
  - 'nomerKompetensi': code or number of competency (e.g. '3.1', '4.1')
  - 'isiKompetensi': description of the competency`,
                },
              ],
            },
          ] as Content[],
          config: {
            responseMimeType: "application/json",
          },
        });

        const text = response.text ?? "{}";
        const data = JSON.parse(text);
        const kurikulumArray = data.kurikulum || [];

        // Save to KompetensiPelajaran table
        for (const item of kurikulumArray) {
          await prisma.kompetensiPelajaran.create({
            data: {
              nomerKompetensi: String(
                item.nomerKompetensi || "",
              ),
              isiKompetensi: String(
                item.isiKompetensi || "",
              ),
              namaBab: String(
                item.namaBab || "",
              ),
              namaBuku: String(
                item.namaBuku || "",
              ),
            },
          });
        }

        return {
          tokens:
            response.usageMetadata?.totalTokenCount ?? 0,
        };
      },
    );

    // Delete local temp file after processing succeeds
    await fs.unlink(tempFilePath).catch(() => { });

    return result;
  } catch (error: any) {
    console.error(
      "[Gemini Error] processKurikulumExtract failed!",
    );
    console.error(
      "[Gemini Error] Message:",
      error.message || error,
    );

    return {
      error: error.message,
    };
  }
}
