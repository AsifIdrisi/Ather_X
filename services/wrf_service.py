"""WRF model adapter for WeatherGPT.

Supports separate public/private WRF REST endpoints with optional API-key or
Bearer authentication. The actual endpoint payload/response schema can vary
between WRF deployments, so the adapter forwards a small common set of query
parameters and returns the provider response unchanged under ``data``.
"""
import os
import requests

def _mode():
    return os.getenv("WRF_API_MODE", "public").strip().lower() or "public"

def _config():
    mode = _mode()
    if mode == "private":
        return {
            "url": os.getenv("WRF_PRIVATE_API_URL", "").strip(),
            "key": os.getenv("WRF_PRIVATE_API_KEY", "").strip(),
        }
    return {
        "url": os.getenv("WRF_PUBLIC_API_URL", "").strip(),
        "key": os.getenv("WRF_PUBLIC_API_KEY", "").strip(),
    }

def _legacy_config():
    """Keep compatibility with the original single WRF_API_URL setting."""
    url = os.getenv("WRF_API_URL", "").strip()
    return {"url": url, "key": ""} if url else None

def _auth_headers(key):
    auth_type = os.getenv("WRF_AUTH_TYPE", "api_key").strip().lower()
    if not key or auth_type == "none":
        return {}
    if auth_type == "bearer":
        return {"Authorization": f"Bearer {key}"}
    # Default/common convention. If your provider uses another header name,
    # it can be changed after checking the API documentation.
    return {"X-API-Key": key}

def _request_params(latitude, longitude, days):
    return {
        "latitude": latitude,
        "longitude": longitude,
        "forecast_days": days,
    }

def is_configured():
    cfg = _config()
    return bool(cfg["url"] or (_legacy_config() or {}).get("url"))

def get_wrf_forecast(latitude, longitude, forecast_days=3):
    days = max(1, min(int(forecast_days), 10))
    cfg = _config()

    # Backward compatibility: if the new public/private URL is empty, use the
    # original WRF_API_URL from Phase 1.
    if not cfg["url"]:
        legacy = _legacy_config()
        if legacy:
            cfg = legacy

    if not cfg["url"]:
        raise RuntimeError(
            "WRF API is not configured. Set WRF_PUBLIC_API_URL or "
            "WRF_PRIVATE_API_URL in .env."
        )

    headers = _auth_headers(cfg["key"])
    response = requests.get(
        cfg["url"],
        params=_request_params(latitude, longitude, days),
        headers=headers,
        timeout=30,
    )
    response.raise_for_status()

    try:
        data = response.json()
    except ValueError as exc:
        raise RuntimeError("WRF API returned a non-JSON response.") from exc

    return {
        "model": "WRF",
        "provider": os.getenv("WRF_PROVIDER", "Configured WRF deployment"),
        "api_mode": _mode(),
        "latitude": latitude,
        "longitude": longitude,
        "forecast_days": days,
        "data": data,
    }
