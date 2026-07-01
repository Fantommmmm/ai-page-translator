import { TranslationEngine } from "./translation/TranslationEngine";
import type { Env, TranslateRequest } from "./types";
import { jsonResponse, readJson } from "./utils/json";

const MAX_TEXTS = 80;
const MAX_TEXT_LENGTH = 2_000;
const MAX_TOTAL_CHARS = 20_000;
const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "content-type"
};

function validateRequest(value: unknown, env: Env): TranslateRequest {
  if (!value || typeof value !== "object") throw new Error("Request body must be an object");
  const body = value as Record<string, unknown>;
  const texts = body.texts;
  if (!Array.isArray(texts) || !texts.every((item) => typeof item === "string")) throw new Error("texts must be an array of strings");
  if (texts.length === 0 || texts.length > MAX_TEXTS) throw new Error(`texts must contain 1-${MAX_TEXTS} items`);
  if (texts.some((text) => text.length === 0 || text.length > MAX_TEXT_LENGTH)) throw new Error(`each text must contain 1-${MAX_TEXT_LENGTH} characters`);
  if (texts.reduce((sum, text) => sum + text.length, 0) > MAX_TOTAL_CHARS) throw new Error(`total text length must be <= ${MAX_TOTAL_CHARS} characters`);

  const sourceLanguage = typeof body.sourceLanguage === "string" && body.sourceLanguage.trim() ? body.sourceLanguage.trim() : env.DEFAULT_SOURCE_LANGUAGE ?? "Chinese";
  const targetLanguage = typeof body.targetLanguage === "string" && body.targetLanguage.trim() ? body.targetLanguage.trim() : env.DEFAULT_TARGET_LANGUAGE ?? "Russian";
  if (body.mode !== "free-only") throw new Error("Only mode=free-only is allowed");
  return { texts, sourceLanguage, targetLanguage, mode: "free-only" };
}

async function handleTranslate(request: Request, env: Env): Promise<Response> {
  const payload = await readJson(request);
  const translateRequest = validateRequest(payload, env);
  const result = await new TranslationEngine().translate(env, translateRequest);
  return jsonResponse(result, { headers: CORS_HEADERS });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });
    const url = new URL(request.url);
    try {
      if (url.pathname === "/translate" && request.method === "POST") return await handleTranslate(request, env);
      return jsonResponse({ error: "Not found" }, { status: 404, headers: CORS_HEADERS });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return jsonResponse({ error: message }, { status: 400, headers: CORS_HEADERS });
    }
  }
};
