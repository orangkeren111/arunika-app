"use server";

import { Content, File as GeminiFile } from "@google/genai";
import prisma from "../db/prisma";
import { getGoogleGenAI } from "../llm/providers";
// Poll until the uploaded file is ACTIVE (or FAILED / timeout)
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

export async function processPdfWithGemini(
  jobId: number,
  tempFilePath: string,
) {
  let uploadedName: string | undefined;
  const { ai, reportError } = await getGoogleGenAI();

  try {
    // 1. Update job status
    const job = await prisma.generationJob.update({
      where: { id: jobId },
      data: { status: "PROCESSING_PDF" },
      select: {
        bukuId: true,
        babId: true,
        buku: { select: { judul: true } },
        bab: { select: { id: true, judulBab: true } },
      },
    });
    const bookTitle = job.buku.judul;

    // 2. Upload to Gemini File API
    console.log("[Gemini] Uploading file to Gemini File API:", tempFilePath);
    const uploadedFile = await ai.files.upload({
      file: tempFilePath,
      config: { mimeType: "application/pdf" },
    });
    uploadedName = uploadedFile.name ?? undefined;

    if (!uploadedName) {
      throw new Error("Upload succeeded but returned no file name");
    }
    console.log("[Gemini] File uploaded, waiting for active. Name:", uploadedName);

    // 2b. Wait until Gemini has finished processing the file
    const activeFile = await waitForFileActive(uploadedName);
    console.log("[Gemini] File is active. URI:", activeFile.uri);

    // 3. Extract Chapters/Bab Goals and Competencies via Gemini
    console.log("[Gemini] Requesting content generation using gemini-3.6-flash...");

    if (job.babId && job.bab) {
      // Single Bab Processing
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
        config: { responseMimeType: "application/json" },
      });

      console.log("[Gemini] Single bab content generated successfully. Length:", response.text?.length);
      const extractedData = JSON.parse(response.text ?? "{}");

      const learningGoalsStr = JSON.stringify(extractedData.learningGoals || []);
      const updatedBab = await prisma.bab.update({
        where: { id: job.babId },
        data: {
          learningGoals: learningGoalsStr,
        },
      });

      if (extractedData.kompetensi && Array.isArray(extractedData.kompetensi)) {
        for (const komp of extractedData.kompetensi) {
          const kp = await prisma.kompetensiPelajaran.create({
            data: {
              nomerKompetensi: String(komp.nomerKompetensi || ""),
              isiKompetensi: String(komp.isiKompetensi || ""),
              namaBab: job.bab.judulBab,
              namaBuku: bookTitle,
            },
          });

          await prisma.kompetensiBab.create({
            data: {
              babId: job.babId,
              nomerKompetensi: String(komp.nomerKompetensi || ""),
              isiKompetensi: String(komp.isiKompetensi || ""),
              kompetensiPelajaranId: kp.id,
            },
          });
        }
      }

      const totalTokens = response.usageMetadata?.totalTokenCount ?? 0;
      return { objectives: [updatedBab], tokens: totalTokens };
    } else {
      // Full Book Processing
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
                text: `Read this document. Return a JSON array of objects. Each object represents a chapter (bab) and must have:
- 'chapterTitle': the title of the chapter/bab
- 'startPage': physical 1-indexed PDF page number of this chapter (count starting from physical page 1 of the PDF file, integer)
- 'endPage': physical 1-indexed PDF page number of this chapter (count starting from physical page 1 of the PDF file, integer)
- 'learningGoals': an array of strings summarizing the key learning objectives/goals
- 'kompetensi': an array of objects representing the competencies of this chapter. Each competency object must have:
  - 'nomerKompetensi': code or number of competency (e.g. '3.1', '4.1')
  - 'isiKompetensi': description of the competency`,
              },
            ],
          },
        ] as Content[],
        config: { responseMimeType: "application/json" },
      });

      console.log("[Gemini] Content generated successfully. Length:", response.text?.length);
      const extractedData = JSON.parse(response.text ?? "[]");

      const savedObjectives = [];
      for (const chapter of extractedData) {
        const startPg = typeof chapter.startPage === "number" ? chapter.startPage : null;
        const endPg = typeof chapter.endPage === "number" ? chapter.endPage : null;

        const bab = await prisma.bab.create({
          data: {
            bukuId: job.bukuId,
            judulBab: chapter.chapterTitle,
            startPage: startPg,
            endPage: endPg,
            learningGoals: JSON.stringify(chapter.learningGoals || []),
          },
        });

        // Automatically link extracted book images to this chapter if page numbers match
        if (startPg !== null && endPg !== null) {
          await prisma.bukuImage.updateMany({
            where: {
              bukuId: job.bukuId,
              pageNumber: { gte: startPg, lte: endPg },
            },
            data: { babId: bab.id },
          });
        }

        if (chapter.kompetensi && Array.isArray(chapter.kompetensi)) {
          for (const komp of chapter.kompetensi) {
            const kp = await prisma.kompetensiPelajaran.create({
              data: {
                nomerKompetensi: String(komp.nomerKompetensi || ""),
                isiKompetensi: String(komp.isiKompetensi || ""),
                namaBab: chapter.chapterTitle,
                namaBuku: bookTitle,
              },
            });

            await prisma.kompetensiBab.create({
              data: {
                babId: bab.id,
                nomerKompetensi: String(komp.nomerKompetensi || ""),
                isiKompetensi: String(komp.isiKompetensi || ""),
                kompetensiPelajaranId: kp.id,
              },
            });
          }
        }
        savedObjectives.push(bab);
      }

      const totalTokens = response.usageMetadata?.totalTokenCount ?? 0;
      return { objectives: savedObjectives, tokens: totalTokens };
    }
  } catch (error: any) {
    console.error("[Gemini Error] processPdfWithGemini failed!");
    console.error("[Gemini Error] Message:", error.message || error);
    if (error.status) console.error("[Gemini Error] Status:", error.status);
    if (error.stack) console.error("[Gemini Error] Stack:", error.stack);
    if (error.error) console.error("[Gemini Error] Inner Error Object:", JSON.stringify(error.error, null, 2));
    return { error: error.message };
  } finally {
    // 5. Clean up Google's servers regardless of success/failure
    if (uploadedName) {
      await ai.files.delete({ name: uploadedName }).catch(() => {
        // don't let cleanup failure mask the real error
      });
    }
  }
}
