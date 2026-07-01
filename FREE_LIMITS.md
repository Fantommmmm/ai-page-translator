# Free limits and expectations

There is no truly infinite free translation API. Free tiers can change, become rate-limited, require billing verification, pause during high load, or remove models. This project is free-only, but third-party free limits can change. It is designed to avoid paid-by-default services and to run only in `free-only` mode, but it cannot guarantee that third-party providers will remain free forever.

## What the project enforces

- OpenAI API is not used.
- The Worker accepts only `mode: "free-only"`.
- Providers without required keys are skipped.
- Provider failures fall back to the next configured provider.
- Qwen is available through Cloudflare Worker secret `QWEN_API_KEY` only when your account has a suitable free/free-tier quota.
- Cerebras is available through `CEREBRAS_API_KEY` only when your account has access to its free tier.
- Cloudflare Workers AI is disabled by default and should be enabled only when your account has a suitable free tier.

## Practical advice

- Configure more than one provider key to improve reliability.
- Keep batches small to reduce rate-limit failures.
- Check each provider dashboard before heavy use.
- Never paste private pages into any translation provider unless you accept that provider's data policy.
