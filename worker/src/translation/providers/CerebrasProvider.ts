import type { Env, ProviderResult, TranslateRequest } from "../../types";
import { buildTranslationPrompt, parseTranslationsFromText } from "../../utils/prompt";
import { assertTranslationCount, ensureFreeOnly, type TranslationProvider } from "./BaseProvider";

const MODEL = "gpt-oss-120b";

export class CerebrasProvider implements TranslationProvider {
  readonly name = "cerebras-free-tier";
  readonly policy = { freeOnly: true, label: "Cerebras free tier compatible model", model: MODEL } as const;

  isAvailable(env: Env, request: TranslateRequest): boolean {
    return request.mode === "free-only" && Boolean(env.CEREBRAS_API_KEY);
  }

  async translate(env: Env, request: TranslateRequest): Promise<ProviderResult> {
    ensureFreeOnly(request, this);
    const key = env.CEREBRAS_API_KEY;
    if (!key) throw new Error("CEREBRAS_API_KEY is not configured");

    const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0,
        messages: [{ role: "user", content: buildTranslationPrompt(request.texts, request.sourceLanguage, request.targetLanguage) }]
      })
    });
    if (!response.ok) throw new Error(`Cerebras failed with HTTP ${response.status}: ${await response.text()}`);
    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const translations = parseTranslationsFromText(data.choices?.[0]?.message?.content ?? "");
    assertTranslationCount(this.name, request.texts, translations);
    return { provider: this.name, translations };
  }
}
