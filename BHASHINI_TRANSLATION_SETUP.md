# WeatherGPT multilingual translation setup

WeatherGPT now uses a dedicated Bhashini/ULCA translation layer for dynamic multilingual text instead of consuming Gemini quota for translation.

Add these variables to your local `.env`:

```env
BHASHINI_USER_ID=your_bhashini_user_id
BHASHINI_ULCA_API_KEY=your_bhashini_ulca_api_key
BHASHINI_INFERENCE_KEY=your_bhashini_inference_key
BHASHINI_PIPELINE_ID=64392f96daac500b55c543cd
BHASHINI_PIPELINE_CONFIG_URL=https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline
LOCALIZATION_PROVIDER=bhashini
LOCALIZATION_GEMINI_FALLBACK=0
```

The credentials are not included in the ZIP. They are required for dynamic translation of long advisory, alert, hazard and weather card content.

The app keeps its existing English/Hindi translations and language packs. Missing strings are fetched in batches from the translation service and cached in the browser.
