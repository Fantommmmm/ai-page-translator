import type { Env, ProviderResult, TranslateRequest } from "../../types";
import { buildTranslationPrompt, parseTranslationsFromText } from "../../utils/prompt";
import { assertTranslationCount, ensureFreeOnly, type TranslationProvider } from "./BaseProvider";

const MODEL = "gemini-1.5-flash";

export class GeminiProvider implements TranslationProvider {
  readonly name = "gemini-flash-free-tier";
  readonly policy = { freeOnly: true, label: "Google AI Studio Gemini API free tier compatible Flash model", model: MODEL } as const;

  isAvailable(env: Env, request: TranslateRequest): boolean {
    return request.mode === "free-only" && Boolean(env.GEMINI_API_KEY);
  }

  async translate(env: Env, request: TranslateRequest): Promise<ProviderResult> {
    ensureFreeOnly(request, this);
    const key = env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY is not configured");

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        generationConfig: { temperature: 0, responseMimeType: "application/json" },
        contents: [{ role: "user", parts: [{ text: buildTranslationPrompt(request.texts, request.sourceLanguage, request.targetLanguage) }] }]
      })
    });
    if (!response.ok) throw new Error(`Gemini failed with HTTP ${response.status}: ${await response.text()}`);
    const data = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
    const translations = parseTranslationsFromText(text);
    assertTranslationCount(this.name, request.texts, translations);
    return { provider: this.name, translations };
  }
}
