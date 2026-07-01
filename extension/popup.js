const fields = {
  workerUrl: document.getElementById("workerUrl"),
  sourceLanguage: document.getElementById("sourceLanguage"),
  targetLanguage: document.getElementById("targetLanguage"),
  mode: document.getElementById("mode"),
  status: document.getElementById("status")
};

function setStatus(message) { fields.status.textContent = message; }

async function activeTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tabs[0]?.id) throw new Error("No active tab");
  return tabs[0];
}

async function sendToContent(message) {
  const tab = await activeTab();
  return chrome.tabs.sendMessage(tab.id, message);
}

chrome.storage.sync.get({ workerUrl: "", sourceLanguage: "Chinese", targetLanguage: "Russian", mode: "free-only" }, (settings) => {
  fields.workerUrl.value = settings.workerUrl;
  fields.sourceLanguage.value = settings.sourceLanguage;
  fields.targetLanguage.value = settings.targetLanguage;
  fields.mode.value = "free-only";
});

document.getElementById("save").addEventListener("click", () => {
  chrome.storage.sync.set({
    workerUrl: fields.workerUrl.value.trim(),
    sourceLanguage: fields.sourceLanguage.value.trim() || "Chinese",
    targetLanguage: fields.targetLanguage.value.trim() || "Russian",
    mode: "free-only"
  }, () => setStatus("Settings saved."));
});

document.getElementById("translate").addEventListener("click", async () => {
  try {
    const workerUrl = fields.workerUrl.value.trim();
    if (!workerUrl) throw new Error("Enter Worker URL first");
    await chrome.storage.sync.set({ workerUrl, sourceLanguage: fields.sourceLanguage.value.trim() || "Chinese", targetLanguage: fields.targetLanguage.value.trim() || "Russian", mode: "free-only" });
    setStatus("Translating...");
    const result = await sendToContent({ type: "TRANSLATE_PAGE", settings: { workerUrl, sourceLanguage: fields.sourceLanguage.value.trim() || "Chinese", targetLanguage: fields.targetLanguage.value.trim() || "Russian", mode: "free-only" } });
    setStatus(result?.message || "Done.");
  } catch (error) { setStatus(error.message || String(error)); }
});

document.getElementById("restore").addEventListener("click", async () => {
  try {
    const result = await sendToContent({ type: "RESTORE_ORIGINAL" });
    setStatus(result?.message || "Original text restored.");
  } catch (error) { setStatus(error.message || String(error)); }
});
