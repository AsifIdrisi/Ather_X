# WeatherGPT account-free translation

WeatherGPT uses an account-free translation cascade for dynamic text. No Bhashini, Gemini, or translation API key is required for this layer.

Default order:
1. Google Translate web endpoint (best effort, no API key)
2. Public Lingva instances
3. MyMemory public endpoint
4. If every provider fails, the original English text is kept so the app continues working.

The adapter has a provider cooldown, so a blocked provider such as `lingva.ml` is not called repeatedly and does not spam the Flask terminal with the same 403 warning.

Recommended `.env` values:

```env
TRANSLATION_PROVIDER=google_web
TRANSLATION_GOOGLE_FALLBACK=1
TRANSLATION_PROVIDER_COOLDOWN_SECONDS=900
LOCALIZATION_PROVIDER=lingva
LOCALIZATION_GEMINI_FALLBACK=0
```

You can also set `LINGVA_INSTANCES` to your preferred public instances. Public instances are third-party services and can become unavailable; WeatherGPT therefore always has a safe original-text fallback.
