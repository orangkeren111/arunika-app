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
    jumlahSoalMcq: number,
    jumlahSoalEssay: number,
    jumlahPilihan: number,
    judulBab: string,
    isiBab: string,
    kompetensiCode: string,
    kompetensiText: string,
    goodQuestions: string[],
    badQuestions: string[],
    tingkatan?: string,
  ) => String.raw`
Based on the following chapter title, competency code, and competency description, generate ${jumlahSoal} questions with various types, mainly MCQ and a few ESSAY. The target is for ${tingkatan} students, so adjust the difficulty, vocabulary, and complexity accordingly.

Join various complexity weights ranging from 1 to 10 (1 being simplest, 10 being highly complex), with each question having its own Bloom's Taxonomy level (C1 to C6).

LANGUAGE RULES:
1. Determine the intended output language from the uploaded learning material, including its content, subject, and competencies. Do not determine the language solely from the chapter title, competency code, application interface, or presumed country of origin.
2. For ordinary academic subjects that are not foreign-language lessons, generate all questions, options, explanations, and tags in the language used by the learning material and its competency descriptions.
3. For English-language learning materials, generate questions, options, explanations, and tags primarily in English.
4. For Mandarin/Chinese-language learning materials, generate questions, options, explanations, and tags primarily in Chinese Hanzi characters. Pinyin may be included when pedagogically appropriate.
5. For other foreign-language lessons, use the target language being taught and its appropriate writing system, regardless of the language used in the chapter title or competency description.
6. A chapter title may intentionally contain multiple languages. For example, "HSK 3 组词成句 Menyusun kalimat (A5)" is a Mandarin-learning chapter. Generate questions primarily in Mandarin Hanzi; use Indonesian when needed for translation exercises or to assess the intended learning objective.
7. For mathematics, science, and other non-language subjects, use the language of the actual learning material and competency descriptions. For example, if the uploaded material and competencies are in English, generate the questions, options, explanations, and tags in English, even if the application or surrounding metadata uses Indonesian.
8. Do not translate the entire question into Indonesian merely because the application is used in Indonesia or because some metadata is written in Indonesian.
9. Keep the language consistent across questions, options, explanations, and tags, except when another language is explicitly needed for the learning objective.
10. If the language cannot be determined confidently from the learning material, use the competency description as the fallback. If that is also inconclusive, use the chapter title.

FORMATTING RULES:
* All generated text fields must use plain text.
* Do NOT use Markdown formatting.
* Do NOT use **bold**, *italic*, headings, bullet Markdown, backticks, or other Markdown syntax.
* Use normal numbered lists or simple hyphen lists when needed.
* Do not include formatting characters such as **, *, ##, # or >.

IMPORTANT MATHEMATICAL NOTATION AND JSON ESCAPING RULES:
* Represent mathematical expressions, equations, fractions, powers, roots, and chemical formulas using LaTeX notation when appropriate.
* Use $...$ for inline mathematical notation and [...] for display equations.
* For chemical formulas, use LaTeX notation such as $\text{H}_2\text{O}$ when appropriate.
* Since the output must be valid JSON, every LaTeX backslash inside a JSON string must be escaped with another backslash. For example, the JSON representation of $\frac{x+2}{5}$ must contain the string "$\frac{x+2}{5}$".
* Do not output unescaped LaTeX commands such as \frac, \sqrt, \text, \alpha, or \rightarrow inside JSON strings.
* Preserve the mathematical meaning of all expressions. Do not replace, omit, or alter operators, variables, exponents, subscripts, or delimiters.
* Use ordinary plain text for prose and avoid Markdown formatting, except for the required delimiters around mathematical notation.
* Ensure the final response is syntactically valid JSON, including all quotation marks, backslashes, and control characters.

COMPETENCY:
Competency Code: ${kompetensiCode}
Competency Description: ${kompetensiText}

CHAPTER DETAIL: 
Chapter Title: ${judulBab}
Chapter Content (Learning Materials): ${isiBab}

QUESTION REQUIREMENTS:
* Every question MUST directly relate to the provided competency and chapter.
* Do not generate questions that test knowledge unrelated to the competency.
* Ensure the questions cover a reasonable range of Bloom's Taxonomy levels from C1 to C6 when appropriate for the subject and student level.
* Difficulty must be an integer from 1 to 10.
* The difficulty should reflect the actual cognitive complexity of the question.
* Do not make every question the same difficulty or Bloom's level.
* MCQ questions must have exactly ${jumlahPilihan} options.
* For MCQ, correctIndex must be a zero-based index corresponding to the correct option.
* The amount of MCQ question must be exactly ${jumlahSoalMcq} and ESSAY question must be exactly ${jumlahSoalEssay}
* ESSAY questions must not contain correctIndex or options.
* Avoid duplicate or near-duplicate questions.
* Make distractors in MCQ questions plausible and relevant to the competency.
* Do not create trick questions unless the competency specifically requires that skill.
* For ESSAY questions, the explanation should describe the expected reasoning or key points of a correct answer.

OUTPUT FORMAT:
You MUST return the output purely as a JSON object with a key "questions" containing a JSON array of question objects.

For MCQ:
{
"bloomLevel": "C1",
"difficulty": 5,
"soal": "What is the primary function of...",
"options": [
    "Option 1",
    "Option 2",
    "... exactly ${jumlahPilihan} options ..."
],
"correctIndex": 0,
"tipeSoal": "MCQ",
"linkGambarSoal": "string",
"explanation": "Because...",
"tags": ["topic_keyword_1", "topic_keyword_2"]
}

For ESSAY:
{
"bloomLevel": "C2",
"difficulty": 6,
"tipeSoal": "ESSAY",
"linkGambarSoal": "string",
"soal": "Explain the process of photosynthesis and why it is crucial for ecosystems.",
"explanation": "Photosynthesis is...",
"tags": ["topic_keyword_1", "topic_keyword_2"]
}

JSON VALIDATION:

* Return ONLY valid JSON.
* The top-level response MUST be an object containing the "questions" array.
* Do NOT include Markdown fences such as \`\`\`json.
* Do NOT include explanations or commentary outside the JSON object.
* Ensure all strings are properly escaped.
* Ensure the JSON is syntactically valid before returning it.
* Do not add fields that are not specified in the required structure.

  `,
};
/*
if good and bad soal is needed:
${goodQuestions.length > 0 ? `MAKE generating questions similar to these existing GOOD questions:\n${goodQuestions.map((q, i) => `- ${q}`).join("\n")}` : ""}

${badQuestions.length > 0 ? `DO NOT generate questions similar to these BAD/REJECTED questions (the teacher rejected these, so learn from this feedback to generate better ones):\n${badQuestions.map((q, i) => `- ${q}`).join("\n")}` : ""}

*/

export const REPORT_PROMPTS = {
  analysis: (historicalData: string) => `
You are an expert educational evaluator. Review the following student quiz attempt history, which includes question competency, taxonomy level, question type (MCQ or ESSAY), reference answer / correct key, student's answer, and whether it was marked correct.
IMPORTANT OUTPUT RULES:
- All text values must be plain text only.
- Do NOT use Markdown formatting.
- Do NOT use **bold** or *italic*.
- Do NOT use backticks.
- Do NOT use Markdown headings.
- Do NOT use Markdown bullet points.
- For lists, use numbered lines such as "1. ..." or plain hyphens.
- Do not put literal line breaks inside JSON string values. Encode line breaks as \\n.
- Return ONLY valid JSON.

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
