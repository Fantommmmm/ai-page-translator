import type { Env, ProviderResult, TranslateRequest } from "../../types";
import { buildTranslationPrompt, parseTranslationsFromText } from "../../utils/prompt";
import { assertTranslationCount, ensureFreeOnly, type TranslationProvider } from "./BaseProvider";

const MODEL = "llama-3.1-8b-instant";

export class GroqProvider implements TranslationProvider {
  readonly name = "groq-developer-free-tier";
  readonly policy = { freeOnly: true, label: "Groq developer free tier compatible model", model: MODEL } as const;

  isAvailable(env: Env, request: TranslateRequest): boolean {
    return request.mode === "free-only" && Boolean(env.GROQ_API_KEY);
  }

  async translate(env: Env, request: TranslateRequest): Promise<ProviderResult> {
    ensureFreeOnly(request, this);
    const key = env.GROQ_API_KEY;
    if (!key) throw new Error("GROQ_API_KEY is not configured");

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({ model: MODEL, temperature: 0, messages: [{ role: "user", content: buildTranslationPrompt(request.texts, request.sourceLanguage, request.targetLanguage) }] })
    });
    if (!response.ok) throw new Error(`Groq failed with HTTP ${response.status}: ${await response.text()}`);
    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const translations = parseTranslationsFromText(data.choices?.[0]?.message?.content ?? "");
    assertTranslationCount(this.name, request.texts, translations);
    return { provider: this.name, translations };
  }
}
