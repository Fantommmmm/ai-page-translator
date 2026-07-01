const ORIGINALS = new WeakMap();
const TOUCHED_NODES = new Set();
const CACHE_PREFIX = "apt-cache:";
const BATCH_SIZE = 40;
let overlay;

function showOverlay(message) {
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.style.cssText = "position:fixed;z-index:2147483647;top:12px;right:12px;max-width:280px;padding:10px 12px;border-radius:10px;background:rgba(0,0,0,.82);color:white;font:14px -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;box-shadow:0 4px 18px rgba(0,0,0,.25)";
    document.documentElement.appendChild(overlay);
  }
  overlay.textContent = message;
}
function hideOverlay() { if (overlay) overlay.remove(); overlay = undefined; }
function isIgnoredElement(element) {
  const tag = element.tagName?.toLowerCase();
  return ["script", "style", "noscript", "textarea", "input", "select", "option"].includes(tag) || element.isContentEditable;
}
function hasChinese(text) { return /[\u3400-\u9fff\uf900-\ufaff]/.test(text); }
function isMeaningful(text) { return text.trim().length > 0 && hasChinese(text) && /[\p{L}\u3400-\u9fff]/u.test(text.replace(/[\d\p{P}\p{S}\s]/gu, "")); }
function collectTextNodes() {
  const nodes = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || isIgnoredElement(parent) || !isMeaningful(node.nodeValue || "")) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  while (walker.nextNode()) nodes.push(walker.currentNode);
  return nodes;
}
async function cacheKey(settings, text) {
  const bytes = new TextEncoder().encode(`${settings.sourceLanguage}:${settings.targetLanguage}:${text}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return CACHE_PREFIX + hash.slice(0, 48);
}
async function cacheGet(key) { return new Promise((resolve) => chrome.storage.local.get(key, (items) => resolve(items[key]))); }
async function cacheSet(key, value) { return chrome.storage.local.set({ [key]: value }); }
async function translateBatch(settings, texts) {
  const url = settings.workerUrl.replace(/\/$/, "") + "/translate";
  const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ texts, sourceLanguage: settings.sourceLanguage, targetLanguage: settings.targetLanguage, mode: "free-only" }) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Worker HTTP ${response.status}`);
  if (!Array.isArray(data.translations) || data.translations.length !== texts.length) throw new Error("Worker returned an invalid translations array");
  return data.translations;
}
async function translatePage(settings) {
  const nodes = collectTextNodes();
  let changed = 0;
  for (let index = 0; index < nodes.length; index += BATCH_SIZE) {
    showOverlay(`AI Page Translator: ${Math.min(index, nodes.length)}/${nodes.length}`);
    const batchNodes = nodes.slice(index, index + BATCH_SIZE);
    const originals = batchNodes.map((node) => node.nodeValue || "");
    const translations = [];
    const missingTexts = [];
    const missingIndexes = [];
    for (let i = 0; i < originals.length; i++) {
      const key = await cacheKey(settings, originals[i]);
      const cached = await cacheGet(key);
      if (typeof cached === "string") translations[i] = cached; else { missingTexts.push(originals[i]); missingIndexes.push(i); }
    }
    if (missingTexts.length) {
      const fresh = await translateBatch(settings, missingTexts);
      for (let i = 0; i < fresh.length; i++) {
        const batchIndex = missingIndexes[i];
        translations[batchIndex] = fresh[i];
        await cacheSet(await cacheKey(settings, originals[batchIndex]), fresh[i]);
      }
    }
    batchNodes.forEach((node, i) => {
      if (!ORIGINALS.has(node)) ORIGINALS.set(node, originals[i]);
      TOUCHED_NODES.add(node);
      if (translations[i] && node.nodeValue !== translations[i]) { node.nodeValue = translations[i]; changed++; }
    });
  }
  hideOverlay();
  return { message: `Translated ${changed} text nodes.` };
}
function restoreOriginal() {
  let restored = 0;
  for (const node of TOUCHED_NODES) {
    if (ORIGINALS.has(node)) { node.nodeValue = ORIGINALS.get(node); restored++; }
  }
  hideOverlay();
  return { message: `Restored ${restored} text nodes.` };
}
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "TRANSLATE_PAGE") {
    translatePage(message.settings).then(sendResponse).catch((error) => { hideOverlay(); sendResponse({ message: error.message || String(error) }); });
    return true;
  }
  if (message?.type === "RESTORE_ORIGINAL") { sendResponse(restoreOriginal()); return false; }
  return false;
});
