import type { Env, ProviderResult, TranslateRequest } from "../../types";

export interface FreeOnlyPolicy {
  readonly freeOnly: true;
  readonly label: string;
  readonly model: string;
}

export interface TranslationProvider {
  readonly name: string;
  readonly policy: FreeOnlyPolicy;
  isAvailable(env: Env, request: TranslateRequest): boolean;
  translate(env: Env, request: TranslateRequest): Promise<ProviderResult>;
}

export function ensureFreeOnly(request: TranslateRequest, provider: TranslationProvider): void {
  if (request.mode !== "free-only" || !provider.policy.freeOnly) {
    throw new Error(`${provider.name} is blocked because only free-only mode is allowed`);
  }
}


export function assertTranslationCount(provider: string, input: string[], output: string[]): void {
  if (input.length !== output.length) {
    throw new Error(`${provider} returned ${output.length} translations for ${input.length} texts`);
  }
}
