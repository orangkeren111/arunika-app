import prisma from "../db/prisma";
import fs from "fs/promises";
import path from "path";
import { callSmartText, callVision } from "../llm/router";

/**
 * Image Processing Worker / Agentic Quality Filter:
 * Processes pending BukuImages using Vision AI (configured in providers.ts).
 * Analyzes image content & page context. Deletes non-educational clutter (logos, banners, watermarks)
 * from disk and DB, and captions useful educational images.
 */
export async function processPendingBookImages(bukuId?: number) {
  try {
    let targetBukuId = bukuId;

    if (!targetBukuId) {
      // Pick 1 book that has already finished PDF extraction and has PENDING images
      const extractedBook = await prisma.buku.findFirst({
        where: {
          images: { some: { status: "PENDING" } },
          jobs: {
            some: {
              status: { in: ["GENERATING_QUESTIONS", "DONE"] },
            },
          },
        },
        select: { id: true },
      });

      if (!extractedBook) return;
      targetBukuId = extractedBook.id;
    }

    const pendingImages = await prisma.bukuImage.findMany({
      where: {
        bukuId: targetBukuId,
        status: "PENDING",
        isKept: true,
      },
      take: 10,
    });

    if (pendingImages.length === 0) return;

    for (const img of pendingImages) {
      try {
        let caption = "";
        let keywords: string[] = [];

        // Fetch Bab context based on linked babId or physical page range
        let babContext = img.babId
          ? await prisma.bab.findUnique({
            where: { id: img.babId },
            select: { judulBab: true, learningGoals: true },
          })
          : null;

        if (!babContext) {
          babContext = await prisma.bab.findFirst({
            where: {
              bukuId: img.bukuId,
              startPage: { lte: img.pageNumber },
              endPage: { gte: img.pageNumber },
            },
            select: { judulBab: true, learningGoals: true },
          });
        }

        const babInfoStr = babContext
          ? `Bab: ${babContext.judulBab}${babContext.learningGoals ? ` (${babContext.learningGoals})` : ""}`
          : "Bab: Unknown / Not specified";

        // Resolve absolute image path from disk
        const relativePath = img.imagePath.startsWith("/") ? img.imagePath.slice(1) : img.imagePath;
        const fullImagePath = path.isAbsolute(relativePath)
          ? relativePath
          : path.join(process.cwd(), "public", relativePath);

        let imageBuffer: Buffer | null = null;
        try {
          imageBuffer = await fs.readFile(fullImagePath);
        } catch {
          console.warn(`[Image Processor] Could not find image file at ${fullImagePath}, using text context fallback.`);
        }

        const promptText = `Analisis gambar materi pembelajaran dari halaman ${img.pageNumber} berikut.
Konteks Bab: ${babInfoStr}
${img.contextText ? `Konteks teks halaman: "${img.contextText.slice(0, 800)}"` : ""}

Tugas Evaluasi Agentic:
1. Evaluasi apakah gambar ini merupakan materi pembelajaran yang berguna (seperti diagram, grafik, tabel, rumus, atau ilustrasi konsep).
2. Jika gambar ini HANYA berupa logo penerbit/sekolah, ikon kecil, dekorasi margin, header/footer banner, nomor halaman, atau gambar acak tanpa nilai edukatif, tandai action = "DELETE".
3. Jika gambar ini RELEVAN dan berguna untuk materi pembelajaran, tandai action = "KEEP", buat caption/deskripsi singkat (maksimal 2 kalimat), dan ekstrak 3-6 keywords relevan.

Keluarkan HANYA format JSON valid tanpa markdown codeblock:
Jika relevan: { "action": "KEEP", "caption": "...", "keywords": ["...", "..."] }
Jika tidak relevan: { "action": "DELETE", "reason": "Alasan singkat (misal: logo penerbit / header banner)" }`;

        let rawResponseText = "";

        if (imageBuffer) {
          try {
            // Pass ACTUAL IMAGE to Vision AI model singleton
            const result = await callVision(promptText, imageBuffer);
            rawResponseText = result.text;
          } catch (visionErr: any) {
            console.warn(`[Image Processor] Vision AI call failed for image ${img.id}:`, visionErr?.message || visionErr);
            // Fallback 
            try {
              const fallbackResult = await callVision(promptText, imageBuffer)
              rawResponseText = fallbackResult.text;
            } catch (fallbackErr: any) {
              console.warn(`[Image Processor] Gemini Vision fallback failed for image ${img.id}:`, fallbackErr?.message || fallbackErr);
            }

          }
        }

        // Text-only fallback if image call failed or image file was unreadable
        if (!rawResponseText && img.contextText && img.contextText.trim().length > 10) {
          try {
            const result = await callSmartText(promptText)
            rawResponseText = result.text;
          } catch (textErr: any) {
            console.warn(`[Image Processor] Text fallback failed for image ${img.id}:`, textErr?.message || textErr);
          }
        }

        if (rawResponseText) {
          try {
            const cleanJson = rawResponseText.replace(/```json|```/g, "").trim();
            const parsed = JSON.parse(cleanJson);

            // Agentic Decision: Delete irrelevant/useless images (logos, page accents, watermarks)
            if (parsed.action === "DELETE") {
              console.log(
                `[Image Agent] Deleting irrelevant image ID ${img.id} on page ${img.pageNumber} (Reason: ${parsed.reason || "Non-educational content"})`
              );
              await prisma.bukuImage.delete({ where: { id: img.id } });
              await fs.unlink(fullImagePath).catch(() => { });
              continue;
            }

            caption = parsed.caption || `Gambar materi halaman ${img.pageNumber}`;
            keywords = Array.isArray(parsed.keywords) ? parsed.keywords : [];
          } catch {
            caption = rawResponseText.slice(0, 150) || `Gambar ilustrasi pada halaman ${img.pageNumber}`;
            keywords = ["ilustrasi", "materi", `halaman_${img.pageNumber}`];
          }
        } else {
          caption = `Gambar ilustrasi pada halaman ${img.pageNumber}`;
          keywords = ["ilustrasi", "halaman", `page_${img.pageNumber}`];
        }

        await prisma.bukuImage.update({
          where: { id: img.id },
          data: {
            caption,
            keywords,
            status: "PROCESSED",
          },
        });
        console.log(`[Image Processor] Successfully processed & captioned image ID ${img.id}`);
      } catch (err: any) {
        console.error(`[Image Processor Error] Failed processing image ID ${img.id}:`, err?.message || err);
        await prisma.bukuImage.update({
          where: { id: img.id },
          data: { status: "FAILED" },
        });
      }
    }
  } catch (error) {
    console.error("Error processing pending book images:", error);
  }
}
