"use server";

import { Content } from "@google/genai";
import prisma from "../db/prisma";
import { getModelName } from "../llm/router";
import { processPdfWithGeminiFailover } from "../llm/providers";

export async function processPdfWithGemini(
  jobId: number,
  tempFilePath: string,
) {
  try {
    // 1. Update job status
    const job = await prisma.generationJob.update({
      where: {
        id: jobId,
      },
      data: {
        status: "PROCESSING_PDF",
      },
      select: {
        bukuId: true,
        babId: true,
        buku: {
          select: {
            judul: true,
          },
        },
        bab: {
          select: {
            id: true,
            judulBab: true,
          },
        },
      },
    });

    const bookTitle = job.buku.judul;

    // 2. Gemini PDF processing with project-level failover
    return await processPdfWithGeminiFailover(
      tempFilePath,
      async (ai, activeFile) => {
        console.log(
          "[Gemini] File is active. URI:",
          activeFile.uri,
        );

        console.log(
          "[Gemini] Requesting content generation...",
        );

        // 3. Single Bab Processing
        if (job.babId && job.bab) {
          const response = await ai.models.generateContent({
            model: await getModelName(
              "process-book",
              "GEMINI",
            ),
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
- 'kompetensi': an array of objects representing the competencies of this chapter. If competencies doesn't exist, please make the competency first based on the learning goals. Each competency object must have:
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

          console.log(
            "[Gemini] Single bab content generated successfully. Length:",
            response.text?.length,
          );

          const extractedData = JSON.parse(
            response.text ?? "{}",
          );

          const updatedBab = await prisma.bab.update({
            where: {
              id: job.babId,
            },
            data: {
              learningGoals: JSON.stringify(
                extractedData.learningGoals || [],
              ),
            },
          });

          if (
            extractedData.kompetensi &&
            Array.isArray(extractedData.kompetensi)
          ) {
            for (const komp of extractedData.kompetensi) {
              const kp =
                await prisma.kompetensiPelajaran.create({
                  data: {
                    nomerKompetensi: String(
                      komp.nomerKompetensi || "",
                    ),
                    isiKompetensi: String(
                      komp.isiKompetensi || "",
                    ),
                    namaBab: job.bab.judulBab,
                    namaBuku: bookTitle,
                  },
                });

              await prisma.kompetensiBab.create({
                data: {
                  babId: job.babId,
                  nomerKompetensi: String(
                    komp.nomerKompetensi || "",
                  ),
                  isiKompetensi: String(
                    komp.isiKompetensi || "",
                  ),
                  kompetensiPelajaranId: kp.id,
                },
              });
            }
          }

          return {
            objectives: [updatedBab],
            tokens:
              response.usageMetadata?.totalTokenCount ?? 0,
          };
        }

        // 4. Full Book Processing
        const response = await ai.models.generateContent({
          model: await getModelName(
            "process-book",
            "GEMINI",
          ),
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
- 'kompetensi': an array of objects representing the competencies of this chapter. If competencies doesn't exist, please make the competency first based on the learning goals. Each competency object must have:
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

        console.log(
          "[Gemini] Content generated successfully. Length:",
          response.text?.length,
        );

        const extractedData = JSON.parse(
          response.text ?? "[]",
        );

        const savedObjectives = [];

        for (const chapter of extractedData) {
          const startPg =
            typeof chapter.startPage === "number"
              ? chapter.startPage
              : null;

          const endPg =
            typeof chapter.endPage === "number"
              ? chapter.endPage
              : null;

          const bab = await prisma.bab.create({
            data: {
              bukuId: job.bukuId,
              judulBab: chapter.chapterTitle,
              startPage: startPg,
              endPage: endPg,
              learningGoals: JSON.stringify(
                chapter.learningGoals || [],
              ),
            },
          });

          // Automatically link extracted book images
          // to this chapter if page numbers match.
          if (
            startPg !== null &&
            endPg !== null
          ) {
            await prisma.bukuImage.updateMany({
              where: {
                bukuId: job.bukuId,
                pageNumber: {
                  gte: startPg,
                  lte: endPg,
                },
              },
              data: {
                babId: bab.id,
              },
            });
          }

          if (
            chapter.kompetensi &&
            Array.isArray(chapter.kompetensi)
          ) {
            for (const komp of chapter.kompetensi) {
              const kp =
                await prisma.kompetensiPelajaran.create({
                  data: {
                    nomerKompetensi: String(
                      komp.nomerKompetensi || "",
                    ),
                    isiKompetensi: String(
                      komp.isiKompetensi || "",
                    ),
                    namaBab: chapter.chapterTitle,
                    namaBuku: bookTitle,
                  },
                });

              await prisma.kompetensiBab.create({
                data: {
                  babId: bab.id,
                  nomerKompetensi: String(
                    komp.nomerKompetensi || "",
                  ),
                  isiKompetensi: String(
                    komp.isiKompetensi || "",
                  ),
                  kompetensiPelajaranId: kp.id,
                },
              });
            }
          }

          savedObjectives.push(bab);
        }

        return {
          objectives: savedObjectives,
          tokens:
            response.usageMetadata?.totalTokenCount ?? 0,
        };
      },
    );
  } catch (error: any) {
    console.error(
      "[Gemini Error] processPdfWithGemini failed!",
    );

    console.error(
      "[Gemini Error] Message:",
      error.message || error,
    );

    if (error.status) {
      console.error(
        "[Gemini Error] Status:",
        error.status,
      );
    }

    if (error.stack) {
      console.error(
        "[Gemini Error] Stack:",
        error.stack,
      );
    }

    if (error.error) {
      console.error(
        "[Gemini Error] Inner Error Object:",
        JSON.stringify(
          error.error,
          null,
          2,
        ),
      );
    }

    return {
      error: error.message,
    };
  }
}