import type { Env, ProviderResult, TranslateRequest } from "../types";
import { CloudflareAIProvider } from "./providers/CloudflareAIProvider";
import { GeminiProvider } from "./providers/GeminiProvider";
import { CerebrasProvider } from "./providers/CerebrasProvider";
import { GroqProvider } from "./providers/GroqProvider";
import { HuggingFaceProvider } from "./providers/HuggingFaceProvider";
import { QwenProvider } from "./providers/QwenProvider";
import type { TranslationProvider } from "./providers/BaseProvider";

export class TranslationEngine {
  private readonly providers: TranslationProvider[];

  constructor(providers: TranslationProvider[] = [
    new GeminiProvider(),
    new QwenProvider(),
    new GroqProvider(),
    new CerebrasProvider(),
    new CloudflareAIProvider(),
    new HuggingFaceProvider()
  ]) {
    this.providers = providers;
  }

  async translate(env: Env, request: TranslateRequest): Promise<ProviderResult> {
    const errors: string[] = [];
    for (const provider of this.providers) {
      if (!provider.isAvailable(env, request)) {
        errors.push(`${provider.name}: skipped because it is not configured or not allowed in ${request.mode}`);
        continue;
      }
      try {
        return await provider.translate(env, request);
      } catch (error) {
        errors.push(`${provider.name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    throw new Error(`No translation provider succeeded. ${errors.join(" | ")}`);
  }
}
