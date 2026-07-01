chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ sourceLanguage: "Chinese", targetLanguage: "Russian", mode: "free-only" });
});
