"""WeatherGPT model-fusion and decision-support helpers.

The service keeps provider-specific WRF/GFS payloads intact while producing a
small, predictable intelligence summary for the UI and AI layer.
"""
from datetime import datetime, timezone

def _num(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return None

def _extract_wrf_current(data):
    """Best-effort extraction from common WRF REST response shapes."""
    if not isinstance(data, dict):
        return {}
    candidates = [data.get("current"), data.get("current_weather"), data.get("forecast")]
    for candidate in candidates:
        if isinstance(candidate, dict):
            return candidate
        if isinstance(candidate, list) and candidate and isinstance(candidate[0], dict):
            return candidate[0]
    # Some providers return fields directly at the root.
    return data

def _pick(obj, *keys):
    for key in keys:
        if isinstance(obj, dict) and key in obj and obj[key] is not None:
            return obj[key]
    return None

def build_model_summary(weather_data=None, gfs_data=None, wrf_data=None):
    """Return a compact, JSON-safe model comparison summary."""
    current = {}
    if weather_data:
        current = {
            "temperature_c": _num(weather_data.get("temperature")),
            "rain_mm": _num(weather_data.get("rain")),
            "wind_kmh": _num(weather_data.get("wind_speed")),
            "humidity_pct": _num(weather_data.get("humidity")),
            "source": weather_data.get("source", "Weather API"),
        }

    models = []
    if isinstance(gfs_data, dict):
        g = gfs_data.get("data", gfs_data)
        gc = g.get("current", {}) if isinstance(g, dict) else {}
        models.append({
            "model": "GFS",
            "available": True,
            "temperature_c": _num(gc.get("temperature_2m")),
            "wind_kmh": _num(gc.get("wind_speed_10m")),
            "rain_mm": _num(gc.get("precipitation")),
            "provider": gfs_data.get("provider", "Open-Meteo GFS") if isinstance(gfs_data, dict) else "Open-Meteo GFS",
        })

    if isinstance(wrf_data, dict):
        raw = wrf_data.get("data", wrf_data)
        wc = _extract_wrf_current(raw)
        models.append({
            "model": "WRF",
            "available": True,
            "temperature_c": _num(_pick(wc, "temperature_2m", "temperature", "temp", "t2")),
            "wind_kmh": _num(_pick(wc, "wind_speed_10m", "wind_speed", "wind", "ws10")),
            "rain_mm": _num(_pick(wc, "precipitation", "rain", "rainfall", "precip")),
            "provider": wrf_data.get("provider", "Configured WRF deployment"),
        })

    comparisons = []
    for field, label, unit in (("temperature_c", "Temperature", "°C"), ("wind_kmh", "Wind", " km/h"), ("rain_mm", "Precipitation", " mm")):
        values = [m[field] for m in models if m.get(field) is not None]
        if len(values) >= 2:
            spread = round(max(values) - min(values), 2)
            comparisons.append({"parameter": label, "spread": spread, "unit": unit, "agreement": "high" if spread <= (1 if field == "temperature_c" else 5) else "moderate"})

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "current_weather": current,
        "models": models,
        "comparisons": comparisons,
        "model_count": len(models),
        "confidence": "high" if models and all(c["agreement"] == "high" for c in comparisons) else ("moderate" if models else "single-source"),
    }

def build_ai_context(summary):
    """Create a compact natural-language context block for the LLM."""
    if not summary:
        return "No additional model intelligence is available."
    lines = [f"Model intelligence confidence: {summary.get('confidence', 'unknown')}"]
    current = summary.get("current_weather", {})
    if current:
        lines.append("Current weather: " + ", ".join(
            f"{k}={v}" for k, v in current.items() if v is not None
        ))
    for model in summary.get("models", []):
        values = ", ".join(
            f"{k}={model.get(k)}" for k in ("temperature_c", "wind_kmh", "rain_mm") if model.get(k) is not None
        )
        lines.append(f"{model.get('model')}: {values or 'provider data available'}")
    for comparison in summary.get("comparisons", []):
        lines.append(f"{comparison['parameter']} model spread: {comparison['spread']}{comparison['unit']} ({comparison['agreement']} agreement)")
    return "\n".join(lines)
