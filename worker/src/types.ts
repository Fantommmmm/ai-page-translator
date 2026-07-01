export type TranslationMode = "free-only";

export interface TranslateRequest {
  texts: string[];
  sourceLanguage: string;
  targetLanguage: string;
  mode: TranslationMode;
}

export interface TranslateResponse {
  provider: string;
  translations: string[];
}

export interface ProviderResult {
  provider: string;
  translations: string[];
}

export interface Ai {
  run(model: string, input: unknown): Promise<unknown>;
}

export interface Env {
  GEMINI_API_KEY?: string;
  QWEN_API_KEY?: string;
  QWEN_ENDPOINT?: string;
  QWEN_MODEL?: string;
  GROQ_API_KEY?: string;
  CEREBRAS_API_KEY?: string;
  HUGGINGFACE_API_KEY?: string;
  DEFAULT_SOURCE_LANGUAGE?: string;
  DEFAULT_TARGET_LANGUAGE?: string;
  AI?: Ai;
}
