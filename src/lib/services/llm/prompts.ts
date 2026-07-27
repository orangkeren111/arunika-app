/**
 * 3. Book Route Prompts
 */
export const BOOK_PROMPTS = {
  chapterSummary: (chapterContent: string) => `
This is a chapter from a textbook. Please provide a comprehensive summary for this chapter focusing strictly on its core understanding and key academic concepts.

Chapter Content:
${chapterContent}
`,

  generateQuestions: (summary: string) => `
Based on the following chapter summary, generate 10 questions for EACH Bloom's Taxonomy level category (Q1 to Q4). 
Join various complexity weights ranging from 1 to 10 (1 being simplest, 10 being highly complex).

You MUST return the output purely as a JSON array matching this structure:
[{
  "taxonomyLevel": "Q1",
  "complexity": 5,
  "question": "What is the primary function of...",
  "options": ["A", "B", "C", "D"],
  "correctAnswer": "A",
  "explanation": "Because..."
}]

Chapter Summary:
${summary}
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
