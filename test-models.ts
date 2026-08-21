import { GoogleGenAI, Content, File as GeminiFile } from "@google/genai";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs/promises";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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

async function testAllFiles() {
  const tmpDir = path.join(__dirname, "tmp");
  const files = await fs.readdir(tmpDir);
  console.log("Found files in tmp:", files);

  for (const filename of files) {
    if (!filename.endsWith(".pdf")) continue;
    const tempFilePath = path.join(tmpDir, filename);
    console.log(`\n--- Testing file: ${filename} ---`);
    let uploadedName: string | undefined;

    try {
      const uploadedFile = await ai.files.upload({
        file: tempFilePath,
        config: { mimeType: "application/pdf" },
      });
      uploadedName = uploadedFile.name ?? undefined;
      console.log("  Uploaded successfully, name:", uploadedName);

      const activeFile = await waitForFileActive(uploadedName!);
      console.log("  File active. URI:", activeFile.uri);

      console.log("  Generating content with gemini-3.6-flash...");
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
                text: "Read this document. Return a JSON array of objects. Each object represents a chapter (bab) and must have: 'chapterTitle', 'learningGoals', 'kompetensi'.",
              },
            ],
          },
        ] as Content[],
        config: { responseMimeType: "application/json" },
      });

      console.log("  Success! Response text length:", response.text?.length);
      console.log("  Response Snippet:", response.text?.substring(0, 300) + "...");
    } catch (err: any) {
      console.error("  Failed:", err.message || err);
    } finally {
      if (uploadedName) {
        await ai.files.delete({ name: uploadedName }).catch(() => {});
      }
    }
  }
}

testAllFiles();
