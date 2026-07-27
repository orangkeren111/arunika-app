"use server";

import prisma from "../db/prisma";
import fs from "fs/promises";
import path from "path";
import { runGenerationPipeline } from "./orchestrator"; // We will build this next

export async function initiatePdfExtraction(formData: FormData) {
  try {
    // 1. Extract the file from FormData
    const file = formData.get("pdfFile") as File;
    const bukuId = formData.get("bookId") as string;
    if (!file || file.type !== "application/pdf") {
      return { success: false, error: "File must be a valid PDF." };
    }

    // 2. Save the file temporarily to local disk (Perfect for Dev)
    const buffer = Buffer.from(await file.arrayBuffer());

    // Make sure you have a 'tmp' folder in your project root, or use the OS temp dir
    const tempFileName = `${Date.now()}-${file.name}`;
    const tempFilePath = path.join(process.cwd(), "tmp", tempFileName);

    // Ensure directory exists before writing
    await fs.mkdir(path.dirname(tempFilePath), { recursive: true });
    await fs.writeFile(tempFilePath, buffer);

    // 3. Create the Job Queue record in Prisma
    const job = await prisma.generationJob.create({
      data: {
        fileName: file.name,
        fileUrl: tempFilePath, // Storing local path for the worker to find
        status: "PENDING",
        bukuId: Number(bukuId),
      },
    });

    // 4. THE TRIGGER: Fire and Forget
    // We call the orchestrator but DO NOT put 'await' in front of it.
    // This allows Node to execute it in the background while instantly moving to step 5.
    runGenerationPipeline(job.id, tempFilePath);

    // 5. Return success instantly to the frontend UI
    return {
      success: true,
      jobId: job.id,
    };
  } catch (error) {
    console.error("Error initiating PDF extraction:", error);
    return { success: false, error: "Failed to initialize upload job." };
  }
}
