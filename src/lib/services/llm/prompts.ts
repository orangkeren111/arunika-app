/**
 * 3. Book Route Prompts
 */
export const BOOK_PROMPTS = {
  chapterSummary: (chapterContent: string) => `
This is a chapter from a textbook. Please provide a comprehensive summary for this chapter focusing strictly on its core understanding and key academic concepts.

Chapter Content:
${chapterContent}
`,

  generateQuestions: (jumlahSoal: number, judulBab: string, summary: string) => `
Based on the following chapter summary and chapter title, generate ${(jumlahSoal) / 4} questions for EACH Bloom's Taxonomy level category (C1 to C4), total ${jumlahSoal} questions. 
Join various complexity weights ranging from 1 to 10 (1 being simplest, 10 being highly complex).

You MUST return the output purely as a JSON array matching this structure (e.g):
[{
  "bloomLevel": "C1",
  "difficulty": 5,
  "soal": "What is the primary function of...",
  "options": ["A", "B", "C", "D"],
  "correctIndex": 0,
  "explanation": "Because..."
}]
Chapter Title:
${judulBab}

Chapter Summary:
${summary}
`,

  generateQuestionsByKompetensi: (
    jumlahSoal: number,
    judulBab: string,
    kompetensiCode: string,
    kompetensiText: string,
    goodQuestions: string[],
    badQuestions: string[]
  ) => `
Based on the following chapter title, competency code, and competency description, generate ${jumlahSoal} questions with various type, mostly MCQ but a sprinkle of ESSAY (optimal is 5:1).
Join various complexity weights ranging from 1 to 10 (1 being simplest, 10 being highly complex) and each question having their own Bloom's Taxonomy levels (C1 to C6).

Competency Code: ${kompetensiCode}
Competency Description: ${kompetensiText}
Chapter Title: ${judulBab}

${goodQuestions.length > 0 ? `AVOID generating questions similar to these existing GOOD questions:\n${goodQuestions.map((q, i) => `- ${q}`).join("\n")}` : ""}

${badQuestions.length > 0 ? `DO NOT generate questions similar to these BAD/REJECTED questions (the teacher rejected these, so learn from this feedback to generate better ones):\n${badQuestions.map((q, i) => `- ${q}`).join("\n")}` : ""}

You MUST return the output purely as a JSON object with a key "questions" containing a JSON array of objects matching this structure:
If tipeSoal is MCQ then
[{
  "bloomLevel": "C1",
  "difficulty": 5,
  "soal": "What is the primary function of...",
  "options": ["A", "B", "C", "D"],
  "correctIndex": 0,
  "tipeSoal": "MCQ",
  "linkGambarSoal": "string",
  "explanation": "Because..."
}]
else if tipeSoal is ESSAY then
[{
  "bloomLevel": "C2",
  "difficulty": 6,
  "tipeSoal": "ESSAY",
  "linkGambarSoal": "string",  
  "soal": "Explain the process of photosynthesis and why it is crucial for ecosystems.",
  "explanation": "Photosynthesis is..."
}]
Do not include any markdown formatting like \`\`\`json.
`,
};

/**
 * 8. Report Prompts
 */
export const REPORT_PROMPTS = {
  analysis: (historicalData: string) => `
You are an expert educational evaluator. Review the following historical quiz data for a student.
You MUST respond with a valid JSON object containing exactly three keys: "overview", "weakness", and "recommendation".
Do not include any markdown formatting like \`\`\`json.

1. "overview": A brief summary of their overall performance.
2. "weakness": Identify specific concepts or Bloom's Taxonomy levels they struggle with.
3. "recommendation": Actionable steps for improvement.

Student Data:
${historicalData}
`,
};
