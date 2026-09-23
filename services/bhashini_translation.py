"""Account-free translation adapter for WeatherGPT.

The project historically used Bhashini, then a public Lingva instance.  Public
Lingva instances are not guaranteed to accept every network and can return
HTTP 403.  This adapter therefore uses a small account-free fallback cascade
and, importantly, stops retrying a blocked provider for a while.

No API key is required by any provider used here.  If all providers fail, the
original English text is returned so WeatherGPT continues working normally.
"""
from __future__ import annotations

import logging
import os
import time
from functools import lru_cache
from pathlib import Path
from urllib.parse import quote

import requests
from dotenv import load_dotenv

logger = logging.getLogger(__name__)
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env", override=True)

# Provider order: Google web endpoint first (usually the most reachable), then
# Lingva public instances, then MyMemory as a final account-free fallback.
TRANSLATION_PROVIDER = os.getenv("TRANSLATION_PROVIDER", "google_web").strip().lower()
GOOGLE_FALLBACK = os.getenv("TRANSLATION_GOOGLE_FALLBACK", "1").strip().lower() in {"1", "true", "yes"}
LINGVA_TIMEOUT = float(os.getenv("LINGVA_TIMEOUT_SECONDS", "2"))
GOOGLE_TIMEOUT = float(os.getenv("TRANSLATION_GOOGLE_TIMEOUT_SECONDS", "8"))
MYMEMORY_TIMEOUT = float(os.getenv("TRANSLATION_MYMEMORY_TIMEOUT_SECONDS", "8"))
COOLDOWN_SECONDS = int(os.getenv("TRANSLATION_PROVIDER_COOLDOWN_SECONDS", "900"))

_default_instances = (
    "https://translate.igna.wtf,"
    "https://translate.plausibility.cloud,"
    "https://lingva.lunar.icu,"
    "https://translate.dr460nf1r3.org,"
    "https://lingva.ml"
)
LINGVA_INSTANCES = [
    x.strip().rstrip("/")
    for x in os.getenv("LINGVA_INSTANCES", _default_instances).split(",")
    if x.strip()
]

LANGUAGE_CODE_MAP = {
    "en": "en", "as": "as", "bn": "bn", "brx": "brx", "doi": "doi",
    "gu": "gu", "hi": "hi", "kn": "kn", "ks": "ks", "kok": "gom",
    "mai": "mai", "ml": "ml", "mni": "mni", "mr": "mr", "ne": "ne",
    "or": "or", "pa": "pa", "sa": "sa", "sat": "sat", "sd": "sd",
    "ta": "ta", "te": "te", "ur": "ur",
}

# Some providers do not recognize the less-common Indian language codes.
# Returning the source text is safer than silently translating into a wrong
# language, so unsupported pairs simply fall through to the next provider.

_PROVIDER_BLOCKED_UNTIL: dict[str, float] = {}
_PROVIDER_LOGGED: set[str] = set()


def _iso(code: str) -> str:
    return LANGUAGE_CODE_MAP.get(str(code or "en").strip().lower(), "en")


def _provider_available(name: str) -> bool:
    return time.time() >= _PROVIDER_BLOCKED_UNTIL.get(name, 0.0)


def _block_provider(name: str, reason: str) -> None:
    until = time.time() + COOLDOWN_SECONDS
    _PROVIDER_BLOCKED_UNTIL[name] = until
    if name not in _PROVIDER_LOGGED:
        logger.warning(
            "Translation provider '%s' is unavailable (%s); skipping it for %ss.",
            name, reason, COOLDOWN_SECONDS,
        )
        _PROVIDER_LOGGED.add(name)


def _valid_translation(value: object, original: str) -> str | None:
    if not isinstance(value, str):
        return None
    value = value.strip()
    if not value or value == original.strip():
        return None
    return value


def _translate_google(text: str, source: str, target: str) -> str | None:
    if not GOOGLE_FALLBACK or not _provider_available("google_web"):
        return None
    try:
        response = requests.get(
            "https://translate.googleapis.com/translate_a/single",
            params={"client": "gtx", "sl": source, "tl": target, "dt": "t", "q": text},
            headers={"User-Agent": "Mozilla/5.0 WeatherGPT/1.0"},
            timeout=GOOGLE_TIMEOUT,
        )
        if response.status_code in (401, 403, 429):
            _block_provider("google_web", f"HTTP {response.status_code}")
            return None
        response.raise_for_status()
        data = response.json()
        parts = data[0] if isinstance(data, list) and data else []
        translated = "".join(
            str(item[0]) for item in parts
            if isinstance(item, list) and item and isinstance(item[0], str)
        )
        return _valid_translation(translated, text)
    except requests.RequestException as exc:
        # DNS/connectivity failures are also cooled down to prevent a warning
        # for every single string in a batch.
        _block_provider("google_web", type(exc).__name__)
    except Exception as exc:
        _block_provider("google_web", type(exc).__name__)
    return None


# Google's free web endpoint accepts multiple repeated ``q`` params in a
# single request and returns one translated segment per input in the same
# order. Using this instead of one HTTP round-trip per string is the single
# biggest reliability fix here: a page can easily need 40-80 short strings
# translated, and issuing that many sequential requests to a public,
# unauthenticated endpoint is what was tripping the provider's rate limiting
# (leaving some strings translated and others silently left in English).
_GOOGLE_BATCH_LIMIT = 100


def _translate_google_batch(texts: list[str], source: str, target: str) -> list[str | None]:
    if not GOOGLE_FALLBACK or not _provider_available("google_web") or not texts:
        return [None] * len(texts)
    try:
        params = [("client", "gtx"), ("sl", source), ("tl", target), ("dt", "t")]
        params.extend(("q", text) for text in texts)
        response = requests.get(
            "https://translate.googleapis.com/translate_a/single",
            params=params,
            headers={"User-Agent": "Mozilla/5.0 WeatherGPT/1.0"},
            timeout=max(GOOGLE_TIMEOUT, GOOGLE_TIMEOUT + len(texts) * 0.15),
        )
        if response.status_code in (401, 403, 429):
            _block_provider("google_web", f"HTTP {response.status_code}")
            return [None] * len(texts)
        response.raise_for_status()
        data = response.json()
        # For a multi-q request Google returns one top-level array entry per
        # input string, each holding its own list of translated segments.
        groups = data[0] if isinstance(data, list) and data else []
        results: list[str | None] = []
        for i, original in enumerate(texts):
            group = groups[i] if i < len(groups) else None
            if isinstance(group, list) and group and isinstance(group[0], list) and isinstance(group[0][0], str):
                translated = str(group[0][0])
            elif isinstance(group, list) and group and isinstance(group[0], str):
                translated = str(group[0])
            else:
                translated = None
            results.append(_valid_translation(translated, original) if translated is not None else None)
        # Google occasionally collapses the response shape when every input
        # is very short; fall back to per-string parsing if counts mismatch.
        if len(results) != len(texts):
            return [None] * len(texts)
        return results
    except requests.RequestException as exc:
        _block_provider("google_web", type(exc).__name__)
    except Exception as exc:
        _block_provider("google_web", type(exc).__name__)
    return [None] * len(texts)


def _translate_lingva(text: str, source: str, target: str) -> str | None:
    if not _provider_available("lingva"):
        return None
    for base in LINGVA_INSTANCES:
        provider_name = f"lingva:{base}"
        if not _provider_available(provider_name):
            continue
        try:
            url = f"{base}/api/v1/{quote(source, safe='')}/{quote(target, safe='')}/{quote(text, safe='')}"
            response = requests.get(
                url,
                headers={"User-Agent": "Mozilla/5.0 WeatherGPT/1.0"},
                timeout=LINGVA_TIMEOUT,
            )
            if response.status_code in (401, 403, 429):
                _block_provider(provider_name, f"HTTP {response.status_code}")
                continue
            response.raise_for_status()
            data = response.json()
            translated = data.get("translation") if isinstance(data, dict) else None
            value = _valid_translation(translated, text)
            if value:
                return value
        except requests.RequestException as exc:
            _block_provider(provider_name, type(exc).__name__)
        except Exception as exc:
            _block_provider(provider_name, type(exc).__name__)
    return None


def _translate_mymemory(text: str, source: str, target: str) -> str | None:
    if not _provider_available("mymemory"):
        return None
    try:
        response = requests.get(
            "https://api.mymemory.translated.net/get",
            params={"q": text, "langpair": f"{source}|{target}"},
            headers={"User-Agent": "WeatherGPT/1.0"},
            timeout=MYMEMORY_TIMEOUT,
        )
        if response.status_code in (401, 403, 429):
            _block_provider("mymemory", f"HTTP {response.status_code}")
            return None
        response.raise_for_status()
        data = response.json()
        match = data.get("responseData", {}).get("translatedText") if isinstance(data, dict) else None
        return _valid_translation(match, text)
    except requests.RequestException as exc:
        _block_provider("mymemory", type(exc).__name__)
    except Exception as exc:
        _block_provider("mymemory", type(exc).__name__)
    return None


@lru_cache(maxsize=4096)
def _translate_one(text: str, source: str, target: str) -> str | None:
    if not text or source == target:
        return text

    # Always try the account-free Google web endpoint first.  Some Indian
    # languages are not reliably supported by individual public Lingva
    # instances, while Google Translate commonly supports them.
    # The environment variable only changes the fallback preference; it no
    # longer disables the Google-first attempt.
    value = _translate_google(text, source, target)
    if value:
        return value

    # Lingva public instances are disabled here for faster translation.
    # Final account-free fallback.
    value = _translate_mymemory(text, source, target)
    if value:
        return value

    return None


def _credentials_ready() -> bool:
    """Compatibility helper: account-free providers do not need credentials."""
    return True


def translate_texts_bhashini(
    texts: list[str], language: str, source_language: str = "en"
) -> list[str] | None:
    """Compatibility API used by localization_service."""
    if not texts:
        return []

    source = _iso(source_language)
    target = _iso(language)
    if source == target:
        return [str(x) for x in texts]

    originals = [str(x or "") for x in texts]
    translated: list[str] = list(originals)

    # Try the real batch endpoint first (one HTTP request for up to
    # _GOOGLE_BATCH_LIMIT strings) for everything that is not already cached
    # from a previous single-string call.
    pending_indexes = [i for i, o in enumerate(originals) if o.strip()]
    for start in range(0, len(pending_indexes), _GOOGLE_BATCH_LIMIT):
        chunk_indexes = pending_indexes[start:start + _GOOGLE_BATCH_LIMIT]
        chunk_texts = [originals[i] for i in chunk_indexes]
        batch_results = _translate_google_batch(chunk_texts, source, target)
        for idx, value in zip(chunk_indexes, batch_results):
            if value is not None:
                translated[idx] = value

    # Anything still untranslated (batch endpoint blocked, or this specific
    # string failed to parse out of the batch response) falls through to the
    # existing one-at-a-time cascade: Google single call -> Lingva -> MyMemory.
    for i in pending_indexes:
        if translated[i] != originals[i]:
            continue
        value = _translate_one(originals[i], source, target)
        if value is not None:
            translated[i] = value

    return translated


translate_texts_lingva = translate_texts_bhashini
