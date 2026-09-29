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
    kompetensiCode: string,
    kompetensiText: string,
    goodQuestions: string[],
    badQuestions: string[],
    tingkatan?: string,
  ) => `
Based on the following chapter title, competency code, and competency description, generate ${jumlahSoal} questions with various types, mainly MCQ and a few ESSAY. The target is for ${tingkatan} students, so adjust the difficulty, vocabulary, and complexity accordingly.

Join various complexity weights ranging from 1 to 10 (1 being simplest, 10 being highly complex), with each question having its own Bloom's Taxonomy level (C1 to C6).

LANGUAGE RULES:

* First determine the subject/lesson language from the chapter title, competency description, and provided context.
* Generate the questions, options, explanations, and tags primarily in the language being taught.
* If the lesson is English, use English.
* If the lesson is Mandarin/Chinese, use Chinese Hanzi characters. Pinyin may be included when pedagogically relevant, but do not replace Hanzi with Latin transliteration when Hanzi is appropriate.
* If the lesson is another foreign language, use that target language and its appropriate writing system/script.
* If the lesson is Indonesian, use Indonesian.
* For foreign-language lessons, the target language of the lesson takes priority over the language used in the chapter metadata or competency description.
* Do not translate a foreign-language lesson into Indonesian merely because the competency description or chapter metadata is written in Indonesian.
* For questions testing the meaning or translation of a foreign-language word, phrase, or sentence, use the target language where appropriate and provide the Indonesian translation only when it is necessary to test or explain the intended learning objective.

FORMATTING RULES:

* All generated text fields must use plain text.
* Do NOT use Markdown formatting.
* Do NOT use **bold**, *italic*, headings, bullet Markdown, backticks, or other Markdown syntax.
* Use normal numbered lists or simple hyphen lists when needed.
* Do not include formatting characters such as **, *, ##, # or >.

IMPORTANT FOR MATHEMATICAL & CHEMICAL FORMULAS (LATEX & JSON ESCAPING):

* Whenever generating questions, options, or explanations containing mathematical equations, formulas, fractions, powers, roots, variables, or chemical equations/compounds (e.g. H2O, CO2, chemical reactions):
* You MUST use LaTeX syntax enclosed in $...$ for inline math/chemistry (e.g., $x^2 + y^2 = z^2$, $\text{H}_2\text{O}$, $2\text{H}_2 + \text{O}_2 \rightarrow 2\text{H}_2\text{O}$, $\frac{a}{b}$, $\sqrt{x}$) or \(...\) for block math.
* CRITICAL JSON ESCAPING RULE: Because your response MUST be valid JSON, EVERY backslash '' in LaTeX syntax MUST be double-escaped as '\\' in the output string (e.g., write "\\frac{x + 2}{5}" NOT "\frac{x + 2}{5}", write "\\text{H}_2\\text{O}" NOT "\text{H}_2\text{O}", write "\\sqrt{x}" NOT "\sqrt{x}").
* Single backslashes such as \f or \t inside LaTeX will cause JSON parser errors.
* Never output raw LaTeX commands without $...$ or \(...\) delimiters.

COMPETENCY:
Competency Code: ${kompetensiCode}
Competency Description: ${kompetensiText}
Chapter Title: ${judulBab}

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
