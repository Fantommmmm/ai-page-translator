# Windows setup guide

You do not need a Mac, Xcode, or Codex CLI to develop this repository. The Worker and extension source files are plain TypeScript, HTML, CSS, and JavaScript.

## 1. Download the project from GitHub

Install Git for Windows from <https://git-scm.com/download/win>, then open PowerShell:

```powershell
git clone https://github.com/YOUR_USER/ai-page-translator.git
cd ai-page-translator
```

Or use GitHub's **Code → Download ZIP**, extract it, and open PowerShell in the extracted folder.

## 2. Install Node.js

Install the current LTS version from <https://nodejs.org/>. Verify:

```powershell
node --version
npm --version
```

## 3. Install Worker dependencies

```powershell
cd worker
npm install
npm run typecheck
```

## 4. Install and log in to Wrangler

This project already includes Wrangler as a dev dependency, so you can run it with `npx`:

```powershell
npx wrangler login
```

A browser window opens for Cloudflare authentication.

## 5. Add provider secrets

Add at least one free/free-tier provider key. Missing keys are skipped automatically. Put secrets only into Cloudflare with `wrangler secret put`; do not paste provider keys into `extension/` files or the popup.

```powershell
npx wrangler secret put GEMINI_API_KEY
npx wrangler secret put QWEN_API_KEY
npx wrangler secret put CEREBRAS_API_KEY
npx wrangler secret put GROQ_API_KEY
npx wrangler secret put HUGGINGFACE_API_KEY
```

You do not have to configure every provider. Start by adding Cloudflare Worker secrets `GEMINI_API_KEY` and `QWEN_API_KEY` if you have both free/free-tier quotas, then add other providers later if needed. Qwen also requires non-secret Worker variables `QWEN_ENDPOINT` and `QWEN_MODEL`; set them in `worker/wrangler.toml` to values that match your free/free-tier Qwen account. You do not have to add all secrets. For Cloudflare Workers AI, enable the `AI` binding in `worker/wrangler.toml` only if your Cloudflare account has an eligible free tier.

## 6. Deploy the Worker

```powershell
npm run deploy
```

Copy the deployed `workers.dev` URL.

## 7. Test with curl in PowerShell

PowerShell has `curl` as an alias on some systems, so use `curl.exe` explicitly:

```powershell
curl.exe -X POST "https://YOUR-WORKER.workers.dev/translate" `
  -H "Content-Type: application/json" `
  -d "{\"texts\":[\"你好世界\"],\"sourceLanguage\":\"Chinese\",\"targetLanguage\":\"Russian\",\"mode\":\"free-only\"}"
```

Expected shape:

```json
{"provider":"...","translations":["..."]}
```

## 8. Package the extension without local Mac/Xcode

The `extension/` folder is a standard Manifest v3 WebExtension source directory. Zip the contents of the folder, not the parent folder:

```powershell
cd ..\extension
Compress-Archive -Path * -DestinationPath ..\ai-page-translator-extension.zip -Force
```

If you want Safari distribution without owning a Mac, use Apple's current Safari Web Extension Packager/App Store Connect workflow where available, or a cloud CI/macOS service only for the packaging/signing step. Development of this repository's code does not require a local Mac.

## 9. Apple Developer account limitations

- Public App Store distribution normally requires an Apple Developer Program membership.
- Apple review, signing, certificates, App Store Connect metadata, and regional availability are controlled by Apple and can change.
- iPhone Safari extensions must comply with Apple's extension and App Store rules.
- Without an Apple-approved distribution path, you can still develop and deploy the Cloudflare Worker, but end-user iPhone installation is limited by Apple's platform rules.

## 10. Windows commands summary

```powershell
git clone https://github.com/YOUR_USER/ai-page-translator.git
cd ai-page-translator\worker
npm install
npm run typecheck
npx wrangler login
npx wrangler secret put GEMINI_API_KEY
npx wrangler secret put QWEN_API_KEY
npm run deploy
cd ..\extension
Compress-Archive -Path * -DestinationPath ..\ai-page-translator-extension.zip -Force
```
