// import prisma from "../db/prisma";
// /**
//  * 4. PDF OCR Text Extractor and Splitter
//  */
// export async function extractAndSplitPdf(bookId: string, pdfUrl: string) {
//   // Mocking the OCR process (In reality, you'd use pdf-parse, AWS Textract, or Gemini 1.5 Pro native PDF)
//   console.log(`Downloading and OCR parsing PDF: ${pdfUrl}`);

//   const mockPages = [
//     { page: 1, text: "Bab 1: Pendahuluan. Ini adalah teks awal." },
//     { page: 2, text: "Teori dasar. Bab 2: Lanjutan teori." },
//   ];

//   // A. Save to RawText table
//   for (const p of mockPages) {
//     await prisma.rawText.create({
//       data: {
//         bookId,
//         page: p.page,
//         content: p.text,
//       },
//     });
//   }

//   // B. Splitter logic: Find "Bab X" and split into RawBab table
//   // This is a naive regex approach. Better to let Gemini do this via the Queue!
//   const allText = mockPages.map((p) => p.text).join(" ");
//   const babRegex = /Bab\s+(\d+):?([\s\S]*?)(?=Bab\s+\d+:?|$)/gi;

//   let match;
//   while ((match = babRegex.exec(allText)) !== null) {
//     const babNumber = parseInt(match[1], 10);
//     const content = match[2].trim();

//     await prisma.rawBab.create({
//       data: {
//         bookId,
//         babNumber,
//         content,
//       },
//     });
//   }
// }
