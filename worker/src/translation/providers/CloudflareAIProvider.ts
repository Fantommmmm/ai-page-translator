import type { Env, ProviderResult, TranslateRequest } from "../../types";
import { buildTranslationPrompt, parseTranslationsFromText } from "../../utils/prompt";
import { assertTranslationCount, ensureFreeOnly, type TranslationProvider } from "./BaseProvider";

const MODEL = "@cf/meta/llama-3.1-8b-instruct";

export class CloudflareAIProvider implements TranslationProvider {
  readonly name = "cloudflare-workers-ai-free-tier";
  readonly policy = { freeOnly: true, label: "Cloudflare Workers AI free tier compatible model", model: MODEL } as const;

  isAvailable(env: Env, request: TranslateRequest): boolean {
    return request.mode === "free-only" && Boolean(env.AI);
  }

  async translate(env: Env, request: TranslateRequest): Promise<ProviderResult> {
    ensureFreeOnly(request, this);
    if (!env.AI) throw new Error("Cloudflare AI binding is not configured");
    const result = await env.AI.run(MODEL, {
      messages: [{ role: "user", content: buildTranslationPrompt(request.texts, request.sourceLanguage, request.targetLanguage) }],
      temperature: 0
    }) as { response?: string };
    const translations = parseTranslationsFromText(result.response ?? "");
    assertTranslationCount(this.name, request.texts, translations);
    return { provider: this.name, translations };
  }
}
