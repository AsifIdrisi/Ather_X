"""WeatherGPT Phase 4 smart-alert and early-warning engine.

Combines current weather, model-fusion output, official warnings and optional
stream-ingested observations into one deduplicated, prioritised alert list.
"""
from datetime import datetime, timezone

from services.alert_service import create_alert, SEVERITY_PRIORITY

def _num(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return None

def _level_for_spread(parameter, spread):
    if parameter == "temperature":
        if spread >= 5:
            return "orange"
        if spread >= 3:
            return "yellow"
    elif parameter == "rain":
        if spread >= 15:
            return "orange"
        if spread >= 8:
            return "yellow"
    elif parameter == "wind":
        if spread >= 20:
            return "orange"
        if spread >= 10:
            return "yellow"
    return None

def generate_model_alerts(summary, location="Unknown Location"):
    """Create alerts when available NWP models materially disagree."""
    alerts = []
    if not isinstance(summary, dict):
        return alerts

    for comparison in summary.get("comparisons", []):
        label = comparison.get("parameter", "Parameter")
        spread = _num(comparison.get("spread"))
        if spread is None:
            continue
        key = {"Temperature": "temperature", "Precipitation": "rain", "Wind": "wind"}.get(label)
        if not key:
            continue
        level = _level_for_spread(key, spread)
        if not level:
            continue
        unit = comparison.get("unit", "")
        alerts.append(create_alert(
            level,
            f"NWP Model Disagreement: {label}",
            f"Available forecast models differ by about {spread:g}{unit} for {label.lower()} in {location}. Treat the forecast with additional caution.",
            location,
        ))
    return alerts

def generate_early_warning_alerts(weather_data=None, model_summary=None, location="Unknown Location"):
    """Generate forecast-aware early warnings in addition to basic rules."""
    alerts = []
    weather_data = weather_data or {}

    # A high rain probability becomes an early-warning message when the
    # forecast also contains measurable precipitation.
    forecast = weather_data.get("forecast") or []
    max_probability = 0.0
    max_rain = 0.0
    rain_day = None
    for day in forecast[:7]:
        probability = _num(day.get("rain_probability"))
        rain = _num(day.get("precipitation"))
        if probability is not None and probability > max_probability:
            max_probability = probability
            rain_day = day.get("date")
        if rain is not None:
            max_rain = max(max_rain, rain)

    if max_probability >= 90 and max_rain >= 20:
        alerts.append(create_alert(
            "orange",
            "Heavy Rain Early Warning",
            f"A high-impact rainfall period is possible around {rain_day or 'an upcoming period'} in {location}: {max_probability:.0f}% rain probability with up to {max_rain:.1f} mm forecast precipitation.",
            location,
        ))
    elif max_probability >= 80 and max_rain >= 10:
        alerts.append(create_alert(
            "yellow",
            "Rain Early Warning",
            f"Rainfall is likely around {rain_day or 'an upcoming period'} in {location}: {max_probability:.0f}% probability with up to {max_rain:.1f} mm forecast precipitation.",
            location,
        ))

    alerts.extend(generate_model_alerts(model_summary, location))
    return alerts

def deduplicate_alerts(alerts):
    """Remove duplicate alerts while preserving the highest-severity version."""
    best = {}
    for alert in alerts or []:
        if not isinstance(alert, dict):
            continue
        key = (alert.get("title", ""), alert.get("location", ""), alert.get("message", ""))
        level = str(alert.get("level", "green")).lower()
        old = best.get(key)
        if old is None or SEVERITY_PRIORITY.get(level, 0) > SEVERITY_PRIORITY.get(str(old.get("level", "green")).lower(), 0):
            best[key] = alert
    result = list(best.values())
    result.sort(key=lambda x: SEVERITY_PRIORITY.get(str(x.get("level", "green")).lower(), 0), reverse=True)
    return result

def build_smart_alert_package(weather_alerts=None, official_alerts=None, model_summary=None, weather_data=None, location="Unknown Location"):
    """Build the single alert payload consumed by API/UI/AI/push layers."""
    combined = list(weather_alerts or []) + list(official_alerts or [])
    combined.extend(generate_early_warning_alerts(weather_data, model_summary, location))
    combined = deduplicate_alerts(combined)
    highest = "green"
    for alert in combined:
        level = str(alert.get("level", "green")).lower()
        if SEVERITY_PRIORITY.get(level, 0) > SEVERITY_PRIORITY.get(highest, 0):
            highest = level
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "location": location,
        "alerts": combined,
        "count": len(combined),
        "highest_level": highest,
        "has_critical": highest == "red",
        "has_high_priority": highest in {"red", "orange"},
    }
