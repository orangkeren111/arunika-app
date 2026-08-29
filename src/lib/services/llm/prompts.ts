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

IMPORTANT FOR MATHEMATICAL & CHEMICAL FORMULAS (LaTeX & JSON ESCAPING):
- Whenever generating questions, options, or explanations containing mathematical equations, formulas, fractions, powers, roots, variables, or chemical equations/compounds (e.g. H2O, CO2, reactions):
- You MUST use LaTeX syntax enclosed in $...$ for inline math/chemistry (e.g., $x^2 + y^2 = z^2$, $\\text{H}_2\\text{O}$, $2\\text{H}_2 + \\text{O}_2 \\rightarrow 2\\text{H}_2\\text{O}$, $\\frac{a}{b}$, $\\sqrt{x}$) or $$...$$ for block math.
- CRITICAL JSON ESCAPING RULE: Because your response MUST be valid JSON, EVERY backslash '\\' in LaTeX syntax MUST be double-escaped as '\\\\' in the output string (e.g., write "\\\\frac{x + 2}{5}" NOT "\\frac{x + 2}{5}", write "\\\\text{H}_2\\\\text{O}" NOT "\\text{H}_2\\text{O}", write "\\\\sqrt{x}" NOT "\\sqrt{x}"). Single backslashes like \\f or \\t inside LaTeX will cause JSON parser errors!
- Never output raw LaTeX commands without $...$ or $$...$$ delimiters.

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

IMPORTANT FOR MATHEMATICAL & CHEMICAL FORMULAS (LaTeX & JSON ESCAPING):
- Whenever generating questions, options, or explanations containing mathematical equations, formulas, fractions, powers, roots, variables, or chemical equations/compounds (e.g. H2O, CO2, chemical reactions):
- You MUST use LaTeX syntax enclosed in $...$ for inline math/chemistry (e.g., $x^2 + y^2 = z^2$, $\\text{H}_2\\text{O}$, $2\\text{H}_2 + \\text{O}_2 \\rightarrow 2\\text{H}_2\\text{O}$, $\\frac{a}{b}$, $\\sqrt{x}$) or $$...$$ for block math.
- CRITICAL JSON ESCAPING RULE: Because your response MUST be valid JSON, EVERY backslash '\\' in LaTeX syntax MUST be double-escaped as '\\\\' in the output string (e.g., write "\\\\frac{x + 2}{5}" NOT "\\frac{x + 2}{5}", write "\\\\text{H}_2\\\\text{O}" NOT "\\text{H}_2\\text{O}", write "\\\\sqrt{x}" NOT "\\sqrt{x}"). Single backslashes like \\f or \\t inside LaTeX will cause JSON parser errors!
- Never output raw LaTeX commands without $...$ or $$...$$ delimiters.

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

export const REPORT_PROMPTS = {
  analysis: (historicalData: string) => `
You are an expert educational evaluator. Review the following student quiz attempt history, which includes question competency, taxonomy level, question type (MCQ or ESSAY), reference answer / correct key, student's answer, and whether it was marked correct.

For any ESSAY questions included in the student data, evaluate the student's essay answer against the question context and reference answer. Determine:
- "isCorrect": boolean (true if the answer demonstrates understanding, false otherwise)
- "points": number (suggested points/score for this essay, e.g. 0 to 100 based on accuracy)
- "aiResponse": string (detailed breakdown explanation of why this point was awarded, what key concepts were covered or missed)

You MUST respond with a valid JSON object matching this structure:
{
  "essayChecks": [
    {
      "jawabanId": 123,
      "isCorrect": true,
      "points": 85,
      "aiResponse": "The student explained..."
    }
  ],
  "overview": "A brief summary of overall performance.",
  "weakness": "Specific concepts or Bloom's Taxonomy levels the student struggles with.",
  "recommendation": "Actionable steps for improvement."
}
Do not include any markdown formatting like \`\`\`json.

Student Data:
${historicalData}

Please return the values in INDONESIAN language
`,
};
