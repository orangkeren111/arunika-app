import prisma from "../db/prisma";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { PNG } from "pngjs";

/**
 * Smart Image Filter
 * Evaluates whether an embedded PDF image is substantial educational content (diagram/photo/chart)
 * or merely a page border, header bar, background accent line, or solid color banner.
 */
function isContentImage(imgObj: any, srcData: Uint8Array): boolean {
  const width = imgObj.width;
  const height = imgObj.height;

  // 1. Dimension Check: Filter out small icons, bullet points, logos (< 80x80 px)
  if (width < 80 || height < 80) return false;

  // 2. Aspect Ratio Check: Filter out long horizontal divider lines or vertical margin bars
  const ratio = width / height;
  if (ratio > 4.5 || ratio < 0.22) return false;

  // 3. Solid Color / Monochromatic Check (Banners, colored boxes, background blocks)
  const totalPixels = width * height;
  if (totalPixels <= 0 || !srcData || srcData.length === 0) return false;

  const sampleCount = 400;
  const step = Math.max(1, Math.floor(totalPixels / sampleCount));
  const channels = Math.max(1, Math.floor(srcData.length / totalPixels));

  let firstR = -1, firstG = -1, firstB = -1;
  let sameColorCount = 0;
  let samplesTaken = 0;

  for (let p = 0; p < totalPixels; p += step) {
    const idx = p * channels;
    if (idx + (channels - 1) >= srcData.length) break;

    const r = srcData[idx];
    const g = channels >= 2 ? srcData[idx + 1] : r;
    const b = channels >= 3 ? srcData[idx + 2] : r;

    if (firstR === -1) {
      firstR = r;
      firstG = g;
      firstB = b;
    } else {
      // Allow slight noise tolerance (delta <= 6 per RGB channel)
      if (Math.abs(r - firstR) <= 6 && Math.abs(g - firstG) <= 6 && Math.abs(b - firstB) <= 6) {
        sameColorCount++;
      }
    }
    samplesTaken++;
  }

  // If > 88% of sampled pixels are identical in color, it's a solid banner/box/border
  if (samplesTaken > 20 && sameColorCount / samplesTaken > 0.88) {
    return false;
  }

  return true;
}

/**
 * Embedded PDF Image & Text Extractor
 * Extracts relevant content images from PDF pages, grabs surrounding page text context,
 * and saves BukuImage database records with status "PENDING" for downstream AI captioning.
 */
export async function extractAndStorePdfPageImages(
  bukuId: number,
  pdfFilePath: string,
) {
  try {
    const uploadDir = path.join(process.cwd(), "public", "uploads", "book_images");
    await fs.mkdir(uploadDir, { recursive: true });

    const pdfBuffer = await fs.readFile(pdfFilePath);
    const data = new Uint8Array(pdfBuffer);

    let pdfjsLib: any;
    try {
      pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.js");
    } catch {
      pdfjsLib = await import("pdfjs-dist");
    }

    if (pdfjsLib.GlobalWorkerOptions) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = "";
    }

    const loadingTask = pdfjsLib.getDocument({
      data,
      useSystemFonts: true,
      disableFontFace: true,
    });
    const pdfDoc = await loadingTask.promise;

    console.log(`[PDF Extractor] Processing ${pdfDoc.numPages} PDF pages for images and page context...`);

    const existingBabs = await prisma.bab.findMany({
      where: { bukuId },
      select: { id: true, startPage: true, endPage: true },
    });

    let totalSavedCount = 0;
    const seenImageHashes = new Set<string>();

    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);

      // Extract page text content to provide rich contextText for downstream LLM processing
      let pageText = "";
      try {
        const textContent = await page.getTextContent();
        pageText = textContent.items
          .map((item: any) => item.str || "")
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();
      } catch (textErr) {
        console.warn(`[PDF Extractor] Could not extract text from page ${pageNum}:`, textErr);
      }

      const operatorList = await page.getOperatorList();
      let pageImageCount = 0;

      for (let i = 0; i < operatorList.fnArray.length; i++) {
        const fn = operatorList.fnArray[i];

        if (
          fn === pdfjsLib.OPS.paintImageXObject ||
          fn === pdfjsLib.OPS.paintInlineImageXObject ||
          fn === pdfjsLib.OPS.paintImageMaskXObject
        ) {
          const imgName = operatorList.argsArray[i][0];
          try {
            const imgObj = page.objs.has(imgName)
              ? page.objs.get(imgName)
              : page.commonObjs?.has(imgName)
              ? page.commonObjs.get(imgName)
              : null;

            if (!imgObj || !imgObj.width || !imgObj.height || !imgObj.data) continue;

            const srcData: Uint8Array = imgObj.data;

            // Apply smart content filter (filters out icons, lines, borders, solid banners)
            if (!isContentImage(imgObj, srcData)) {
              continue;
            }

            pageImageCount++;
            totalSavedCount++;

            const filename = `book_${bukuId}_img_p${pageNum}_${pageImageCount}_${Date.now()}.png`;
            const localFilePath = path.join(uploadDir, filename);

            const png = new PNG({ width: imgObj.width, height: imgObj.height });
            const dstData = png.data;

            if (imgObj.kind === pdfjsLib.ImageKind.RGBA_32BPP) {
              png.data = Buffer.from(srcData);
            } else if (imgObj.kind === pdfjsLib.ImageKind.RGB_24BPP) {
              let j = 0;
              for (let k = 0; k < srcData.length; k += 3) {
                dstData[j++] = srcData[k];     // Red
                dstData[j++] = srcData[k + 1]; // Green
                dstData[j++] = srcData[k + 2]; // Blue
                dstData[j++] = 255;            // Alpha
              }
            } else {
              const totalPixels = imgObj.width * imgObj.height;
              const channels = Math.max(1, Math.floor(srcData.length / totalPixels));
              let j = 0;
              for (let k = 0; k < srcData.length; k += channels) {
                dstData[j++] = srcData[k];
                dstData[j++] = channels >= 2 ? srcData[k + 1] : srcData[k];
                dstData[j++] = channels >= 3 ? srcData[k + 2] : srcData[k];
                dstData[j++] = channels >= 4 ? srcData[k + 3] : 255;
              }
            }

            const buffer = PNG.sync.write(png);

            // Compute MD5 hash of raw image buffer to eliminate identical duplicate images (e.g. repeated logos)
            const imgHash = crypto.createHash("md5").update(buffer).digest("hex");
            if (seenImageHashes.has(imgHash)) {
              console.log(`[PDF Extractor] Skipping duplicate image (${imgHash.slice(0, 8)}) on page ${pageNum}`);
              continue;
            }
            seenImageHashes.add(imgHash);

            await fs.writeFile(localFilePath, buffer);

            const publicImagePath = `/uploads/book_images/${filename}`;

            const matchingBab = existingBabs.find(
              (b) => b.startPage !== null && b.endPage !== null && pageNum >= b.startPage && pageNum <= b.endPage
            );

            // Save record with status "PENDING" & actual extracted page text as contextText
            await prisma.bukuImage.create({
              data: {
                bukuId,
                babId: matchingBab?.id ?? null,
                imagePath: publicImagePath,
                pageNumber: pageNum,
                contextText: pageText.slice(0, 2500) || `Teks halaman ${pageNum}`,
                status: "PENDING",
              },
            });

            console.log(
              `[PDF Extractor] Saved content image ${filename} (${imgObj.width}x${imgObj.height}px) on page ${pageNum}`
            );
          } catch (imgErr) {
            console.warn(`[PDF Extractor] Could not process image ${imgName} on page ${pageNum}:`, imgErr);
          }
        }
      }
    }

    console.log(
      `[PDF Extractor] Finished extraction for bukuId ${bukuId}. Stored ${totalSavedCount} content images (PENDING).`
    );
  } catch (error) {
    console.error("[PDF Extractor] Error during embedded image extraction:", error);
  }
}



