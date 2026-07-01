import type { Env, ProviderResult, TranslateRequest } from "../../types";
import { buildTranslationPrompt, parseTranslationsFromText } from "../../utils/prompt";
import { assertTranslationCount, ensureFreeOnly, type TranslationProvider } from "./BaseProvider";

export class QwenProvider implements TranslationProvider {
  readonly name = "qwen-free-tier";
  readonly policy = { freeOnly: true, label: "Qwen free-tier compatible model", model: "env.QWEN_MODEL" } as const;

  isAvailable(env: Env, request: TranslateRequest): boolean {
    return request.mode === "free-only" && Boolean(env.QWEN_API_KEY) && Boolean(env.QWEN_ENDPOINT) && Boolean(env.QWEN_MODEL);
  }

  async translate(env: Env, request: TranslateRequest): Promise<ProviderResult> {
    ensureFreeOnly(request, this);
    const key = env.QWEN_API_KEY;
    if (!key) throw new Error("QWEN_API_KEY is not configured");
    const endpoint = env.QWEN_ENDPOINT?.trim();
    if (!endpoint) throw new Error("QWEN_ENDPOINT is not configured");
    const model = env.QWEN_MODEL?.trim();
    if (!model) throw new Error("QWEN_MODEL is not configured");

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({
        model,
        temperature: 0,
        messages: [{ role: "user", content: buildTranslationPrompt(request.texts, request.sourceLanguage, request.targetLanguage) }]
      })
    });
    if (!response.ok) throw new Error(`Qwen failed with HTTP ${response.status}: ${await response.text()}`);
    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const translations = parseTranslationsFromText(data.choices?.[0]?.message?.content ?? "");
    assertTranslationCount(this.name, request.texts, translations);
    return { provider: this.name, translations };
  }
}
