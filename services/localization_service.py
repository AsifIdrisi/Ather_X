"""Central multilingual localization for WeatherGPT.

Static UI strings are translated by the frontend language-pack layer. This
module localizes dynamic backend output (alerts, advisories, risk summaries,
chat fallbacks, etc.) while preserving numbers, units, URLs, model/provider
names, dates, coordinates and other machine-readable values.
"""

from __future__ import annotations

import json
import logging
import os
import re
from functools import lru_cache
import time
from typing import Any

import google.generativeai as genai
from dotenv import load_dotenv
from pathlib import Path

from services.bhashini_translation import translate_texts_bhashini
from services.offline_dynamic_translations import offline_translate

# Reuse the same Gemini model/key configured by WeatherGPT's AI service.
# This prevents dynamic localization from silently failing when the project
# only configures the AI service credentials.
try:
    from services.ai_service import model as _shared_ai_model, MODEL_NAME as _shared_model_name
except Exception:
    _shared_ai_model = None
    _shared_model_name = None

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env", override=True)

LANGUAGE_NAMES = {
    "en": "English",
    "as": "Assamese",
    "bn": "Bengali",
    "brx": "Bodo",
    "doi": "Dogri",
    "gu": "Gujarati",
    "hi": "Hindi",
    "kn": "Kannada",
    "ks": "Kashmiri",
    "kok": "Konkani",
    "mai": "Maithili",
    "ml": "Malayalam",
    "mni": "Meitei (Manipuri)",
    "mr": "Marathi",
    "ne": "Nepali",
    "or": "Odia",
    "pa": "Punjabi",
    "sa": "Sanskrit",
    "sat": "Santali",
    "sd": "Sindhi",
    "ta": "Tamil",
    "te": "Telugu",
    "ur": "Urdu",
}

SCRIPT_HINTS = {
    "as": "Assamese script",
    "bn": "Bengali script",
    "brx": "Devanagari script",
    "doi": "Devanagari script",
    "gu": "Gujarati script",
    "hi": "Devanagari script",
    "kn": "Kannada script",
    "ks": "Perso-Arabic script normally used for Kashmiri",
    "kok": "Devanagari script",
    "mai": "Devanagari script",
    "ml": "Malayalam script",
    "mni": "Meitei Mayek when appropriate; otherwise the user's normal Manipuri script",
    "mr": "Devanagari script",
    "ne": "Devanagari script",
    "or": "Odia script",
    "pa": "Gurmukhi script",
    "sa": "Devanagari script",
    "sat": "Ol Chiki script when appropriate",
    "sd": "Sindhi Arabic script",
    "ta": "Tamil script",
    "te": "Telugu script",
    "ur": "Urdu Perso-Arabic script",
}

TEXT_KEYS = {
    "title", "message", "summary", "status", "reason", "reasons",
    "actions", "action", "recommended_actions", "recommendations",
    "risk_level", "overall_risk_level", "hazard", "source_label",
    "disclaimer", "notes", "explanation", "description", "advice",
    "recommendation", "category", "priority", "priority_actions",
    "operational_checks", "weather_risks", "field_actions", "evidence",
    "label", "crop_label", "stage", "soil_type", "attention_level", "method",
    "reply", "error", "errors", "message_text", "status_text", "reason_text",
    "overall_risk_level",
}
SKIP_KEYS = {
    "id", "code", "date", "time", "timestamp", "latitude", "longitude",
    "source", "provider", "model", "units", "unit", "url", "email",
    "username", "name", "location", "value", "timezone", "icon", "weather_code", "generated_at",
    "received_at", "location_details", "official_warning_count",
    # Enum/status fields the frontend matches on directly (CSS class names,
    # comparisons like `level === "yellow"`) and localizes itself for display
    # via translateRiskLevel()/translateSeverityLevel() in script.js. If these
    # get translated server-side the raw English value the client expects
    # disappears, breaking both the styling (CSS class becomes an untranslated
    # class name) and the client's own translation lookup.
    "level", "severity", "risk_level", "overall_risk_level", "attention_level",
}

_model = _shared_ai_model
_api_key = os.getenv("GEMINI_API_KEY")
_model_name = os.getenv("GEMINI_MODEL", _shared_model_name or "gemini-3.6-flash")
LOCALIZATION_PROVIDER = os.getenv("LOCALIZATION_PROVIDER", "google_web").strip().lower()
LOCALIZATION_GEMINI_FALLBACK = os.getenv("LOCALIZATION_GEMINI_FALLBACK", "1").strip().lower() in {"1", "true", "yes"}

# Fall back to a direct localization model only when the shared AI service
# model is unavailable and a Gemini key is explicitly configured.
if _model is None and _api_key:
    try:
        genai.configure(api_key=_api_key)
        _model = genai.GenerativeModel(_model_name)
    except Exception as exc:  # pragma: no cover
        logger.error("Localization Gemini setup failed: %s", exc)


_QUOTA_BLOCK_UNTIL = 0.0
_QUOTA_LOGGED = False

def _quota_blocked() -> bool:
    return time.time() < _QUOTA_BLOCK_UNTIL

def _mark_quota_exceeded(exc: Exception) -> None:
    global _QUOTA_BLOCK_UNTIL, _QUOTA_LOGGED
    _QUOTA_BLOCK_UNTIL = time.time() + 3600
    if not _QUOTA_LOGGED:
        logger.warning("Gemini localization quota exceeded; pausing localization requests for 60 minutes: %s", exc)
        _QUOTA_LOGGED = True

def _is_quota_error(exc: Exception) -> bool:
    text = str(exc).lower()
    return "429" in text or "quota" in text or "rate limit" in text or "resource exhausted" in text


def normalize_language(language: str | None) -> str:
    code = str(language or "en").strip().lower()
    return code if code in LANGUAGE_NAMES else "en"


def _clean_json_array(raw: str) -> list[str] | None:
    raw = (raw or "").strip()
    if not raw:
        return None
    raw = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.I)
    raw = re.sub(r"\s*```$", "", raw)
    try:
        data = json.loads(raw)
        return data if isinstance(data, list) else None
    except Exception:
        pass
    match = re.search(r"\[[\s\S]*\]", raw)
    if not match:
        return None
    try:
        data = json.loads(match.group(0))
        return data if isinstance(data, list) else None
    except Exception:
        return None


def _translation_prompt(texts: list[str], language: str) -> str:
    lang_name = LANGUAGE_NAMES[language]
    script = SCRIPT_HINTS.get(language, "the normal native script for the language")
    return f"""Translate each string in the JSON array into {lang_name}.

Target language code: {language}
Target script: {script}

Rules:
- The output must be genuinely written in {lang_name}, not English.
- Do not merely transliterate English.
- Use natural, simple wording suitable for a weather application in India.
- Preserve numbers, units, percentages, dates, times, URLs, emoji, placeholders and proper nouns.
- Keep the same number and order of items.
- Return ONLY one valid JSON array of strings.
- Do not add explanations or markdown.

Input JSON:
{json.dumps(texts, ensure_ascii=False)}
"""


@lru_cache(maxsize=4096)
def _translate_one_cached(text: str, language: str) -> str:
    if language == "en" or not text.strip() or not _model or _quota_blocked():
        return text
    try:
        response = _model.generate_content(
            _translation_prompt([text], language),
            generation_config=genai.types.GenerationConfig(
                temperature=0.1,
                max_output_tokens=500,
            ),
        )
        parsed = _clean_json_array(getattr(response, "text", "") or "")
        if parsed and len(parsed) == 1 and isinstance(parsed[0], str):
            value = parsed[0].strip()
            if value and value != text:
                return value
    except Exception as exc:
        if _is_quota_error(exc):
            _mark_quota_exceeded(exc)
        else:
            logger.warning("Single translation failed (%s): %s", language, exc)
    return text


def _translate_with_gemini_batch(texts: list[str], target: str, source: str) -> list[str]:
    """Best-effort batch fallback using the Gemini model already used by chat.

    This is only used for strings that an account-free public translator could
    not translate. It keeps uncommon Indian-language pairs working when the
    public endpoints do not support their language codes.
    """
    if not texts or not _model or _quota_blocked():
        return list(texts)

    lang_name = LANGUAGE_NAMES.get(target, target)
    source_name = LANGUAGE_NAMES.get(source, source)
    script = SCRIPT_HINTS.get(target, "the normal native script for the language")
    prompt = f"""Translate each string in this JSON array from {source_name} to {lang_name}.

Target script: {script}
Rules:
- Return natural {lang_name}, not English and not mere transliteration.
- Preserve numbers, units, percentages, dates, times, URLs, emoji and proper nouns.
- Keep the exact same number and order of strings.
- Return ONLY a valid JSON array of strings.

Input JSON:
{json.dumps(texts, ensure_ascii=False)}"""
    try:
        response = _model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.1,
                max_output_tokens=max(800, len(texts) * 70),
            ),
        )
        parsed = _clean_json_array(getattr(response, "text", "") or "")
        if parsed and len(parsed) == len(texts) and all(isinstance(x, str) for x in parsed):
            return [x.strip() or original for x, original in zip(parsed, texts)]
    except Exception as exc:
        if _is_quota_error(exc):
            _mark_quota_exceeded(exc)
        else:
            logger.warning("Gemini batch localization failed (%s -> %s): %s", source, target, exc)
    return list(texts)


def translate_texts_from(texts: list[str], language: str, source_language: str = "en") -> list[str]:
    """Translate arbitrary text between any two supported app languages.

    The account-free public translation cascade is tried first. If a string is
    returned unchanged because its pair is unsupported/unavailable, the same
    existing Gemini model used by WeatherGPT chat can translate the remaining
    strings in one batch. This avoids silently leaving the UI in English for
    less-common Indian languages when a Gemini key is already configured.
    """
    target = normalize_language(language)
    source = normalize_language(source_language)
    cleaned = [str(x or "") for x in texts]
    if target == source or not cleaned:
        return cleaned

    translated_all: list[str] = []
    for start in range(0, len(cleaned), 80):
        chunk = cleaned[start:start + 80]

        # First use the offline safety-net for phrases generated by
        # WeatherGPT's own rule-based advisory engines. This makes the core
        # demo independent of public translation-provider availability.
        translated = [offline_translate(text, target) or text for text in chunk]

        # Only send phrases still untranslated to Gemini.
        gemini_indexes = [i for i, (src, dst) in enumerate(zip(chunk, translated))
                          if src.strip() and dst.strip() == src.strip()]
        if gemini_indexes and LOCALIZATION_GEMINI_FALLBACK and _model and not _quota_blocked():
            gemini_inputs = [chunk[i] for i in gemini_indexes]
            gemini_outputs = _translate_with_gemini_batch(gemini_inputs, target, source)
            for i, value in zip(gemini_indexes, gemini_outputs):
                if value and value.strip() and value.strip() != chunk[i].strip():
                    translated[i] = value

        # Finally use the public account-free cascade for anything Gemini did
        # not translate.
        misses = [i for i, (src, dst) in enumerate(zip(chunk, translated))
                  if src.strip() and (not dst or dst.strip() == src.strip())]
        if misses:
            public_inputs = [chunk[i] for i in misses]
            public_outputs = translate_texts_bhashini(public_inputs, target, source_language=source) or public_inputs
            for i, value in zip(misses, public_outputs):
                if value and value.strip() and value.strip() != chunk[i].strip():
                    translated[i] = value

        translated_all.extend(translated)
    return translated_all


def translate_texts(texts: list[str], language: str) -> list[str]:
    """Backward-compatible English -> target translation helper."""
    return translate_texts_from(texts, language, source_language="en")

def _should_translate_string(value: str) -> bool:
    if not value or not value.strip():
        return False
    if len(value) > 1800:
        return False
    if re.fullmatch(r"[\d\s%°+\-./:,()]+", value.strip()):
        return False
    if re.match(r"^https?://", value.strip(), re.I):
        return False
    return bool(re.search(r"[A-Za-z\u0900-\u0D7F]", value))


def localize_payload(payload: Any, language: str) -> Any:
    """Localize all human-readable strings in a JSON payload.

    Historically only a small allow-list of keys was translated. That left
    newly added backend fields such as errors, labels and advisory details in
    English. The new rule is the opposite: translate every human-readable
    string unless its key is explicitly machine/proper-name data.
    """
    language = normalize_language(language)
    if language == "en" or payload is None:
        return payload

    strings: list[str] = []

    def collect(value: Any, key_name: str = "") -> None:
        if isinstance(value, str):
            if key_name not in SKIP_KEYS and _should_translate_string(value):
                strings.append(value)
            return
        if isinstance(value, list):
            for item in value:
                if isinstance(item, str) and key_name not in SKIP_KEYS and _should_translate_string(item):
                    strings.append(item)
                elif isinstance(item, (dict, list)):
                    collect(item, key_name)
            return
        if isinstance(value, dict):
            for key, child in value.items():
                if key in SKIP_KEYS:
                    continue
                collect(child, key)

    collect(payload)
    if not strings:
        return payload

    translated = translate_texts(strings, language)
    mapping = {}
    for src, dst in zip(strings, translated):
        if src not in mapping or (dst and dst != src):
            mapping[src] = dst

    def replace(value: Any, key_name: str = "") -> Any:
        if isinstance(value, str):
            return mapping.get(value, value) if key_name not in SKIP_KEYS else value
        if isinstance(value, list):
            return [mapping.get(x, x) if isinstance(x, str) and key_name not in SKIP_KEYS else replace(x, key_name) for x in value]
        if isinstance(value, dict):
            return {
                key: child if key in SKIP_KEYS else replace(child, key)
                for key, child in value.items()
            }
        return value

    return replace(payload)


def localize_text(text: str, language: str) -> str:
    language = normalize_language(language)
    if language == "en":
        return str(text)
    return translate_texts([str(text)], language)[0]
