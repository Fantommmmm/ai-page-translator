import type { Env, ProviderResult, TranslateRequest } from "../../types";
import { assertTranslationCount, ensureFreeOnly, type TranslationProvider } from "./BaseProvider";

const MODEL = "Helsinki-NLP/opus-mt-zh-ru";

export class HuggingFaceProvider implements TranslationProvider {
  readonly name = "huggingface-free-inference";
  readonly policy = { freeOnly: true, label: "Hugging Face free inference-compatible translation model", model: MODEL } as const;

  isAvailable(env: Env, request: TranslateRequest): boolean {
    return request.mode === "free-only" && Boolean(env.HUGGINGFACE_API_KEY);
  }

  async translate(env: Env, request: TranslateRequest): Promise<ProviderResult> {
    ensureFreeOnly(request, this);
    const key = env.HUGGINGFACE_API_KEY;
    if (!key) throw new Error("HUGGINGFACE_API_KEY is not configured");

    const translations: string[] = [];
    for (const text of request.texts) {
      const response = await fetch(`https://api-inference.huggingface.co/models/${MODEL}`, {
        method: "POST",
        headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
        body: JSON.stringify({ inputs: text, options: { wait_for_model: true } })
      });
      if (!response.ok) throw new Error(`HuggingFace failed with HTTP ${response.status}: ${await response.text()}`);
      const data = await response.json() as Array<{ translation_text?: string }> | { error?: string };
      if (!Array.isArray(data) || typeof data[0]?.translation_text !== "string") {
        throw new Error("HuggingFace returned an unexpected response");
      }
      translations.push(data[0].translation_text);
    }
    assertTranslationCount(this.name, request.texts, translations);
    return { provider: this.name, translations };
  }
}
