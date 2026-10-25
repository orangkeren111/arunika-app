/**
 * Safely extracts and parses JSON from an LLM response, handling Markdown,
 * conversational preamble/postamble, and unescaped LaTeX math formulas.
 * 
 * @param rawText The raw string output from the LLM
 * @returns The parsed JSON object or array
 */
export function parseLLMResponse(rawText: string): any {
    let text = rawText.trim();

    // 1. SAFELY EXTRACT MARKDOWN BLOCKS (If present)
    // Instead of a global replace that destroys internal backticks, 
    // we only extract the content INSIDE the outermost ```json ... ``` block.
    const markdownRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
    const markdownMatch = text.match(markdownRegex);
    if (markdownMatch && markdownMatch[1]) {
        text = markdownMatch[1].trim();
    }

    // 2. EXTRACT OUTERMOST JSON STRUCTURE
    // This ignores conversational preamble/postamble (e.g., "Here are the questions: [...]")
    const firstBrace = text.indexOf('{');
    const firstBracket = text.indexOf('[');

    // Find the very first JSON opening character
    let startIndex = -1;
    if (firstBrace !== -1 && firstBracket !== -1) {
        startIndex = Math.min(firstBrace, firstBracket);
    } else {
        startIndex = Math.max(firstBrace, firstBracket); // Fallback if one is missing
    }

    if (startIndex !== -1) {
        const isArray = text[startIndex] === '[';
        // Find the corresponding closing character from the end of the string
        const endIndex = isArray ? text.lastIndexOf(']') : text.lastIndexOf('}');

        if (endIndex > startIndex) {
            text = text.substring(startIndex, endIndex + 1);
        }
    }

    // 3. SANITIZE LATEX & INVALID ESCAPES
    // In JSON, \f, \t, \b are control characters (formfeed, tab, backspace).
    // If the LLM generates LaTeX like \frac, \text, \beta, JSON.parse will crash or corrupt it.
    // This regex preserves necessary JSON escapes (\n, \r, \", \\, \/, \u) 
    // but double-escapes everything else so LaTeX survives the JSON parse.
    text = text.replace(/\\(?![/"\\nru])/g, "\\\\");

    // 4. PARSE JSON
    try {
        return JSON.parse(text);
    } catch (error: any) {
        console.error("[JSON Parse Error] Sanitized Output:", text);
        throw new Error(`LLM output invalid JSON after sanitization: ${error.message}`);
    }
}