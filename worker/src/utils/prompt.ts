export function buildTranslationPrompt(texts: string[], sourceLanguage: string, targetLanguage: string): string {
  return [
    `Translate each item from ${sourceLanguage} to ${targetLanguage}.`,
    "Return only a JSON array of strings with exactly the same length and order as the input array.",
    "Do not add explanations, markdown, numbering, or extra keys.",
    "Preserve punctuation, whitespace intent, URLs, numbers, and brand names when appropriate.",
    JSON.stringify(texts)
  ].join("\n");
}

export function parseTranslationsFromText(text: string): string[] {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)?.[1]?.trim() ?? trimmed;
  const firstBracket = fenced.indexOf("[");
  const lastBracket = fenced.lastIndexOf("]");
  const jsonText = firstBracket >= 0 && lastBracket >= firstBracket ? fenced.slice(firstBracket, lastBracket + 1) : fenced;
  const parsed: unknown = JSON.parse(jsonText);
  if (!Array.isArray(parsed) || !parsed.every((item) => typeof item === "string")) {
    throw new Error("Provider did not return a JSON string array");
  }
  return parsed;
}
