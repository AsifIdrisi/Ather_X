"""Helpers for combining live weather alerts with official IMD warnings.

Used by the weather, alerts, push, and chat blueprints, all of which need
to resolve a location's official warnings and merge them with the
generated weather alerts in a consistent way.
"""

from services.imd_service import fetch_imd_warnings, IMD_CAP_ENABLED
from services.location_service import reverse_geocode_details


def _get_imd_context(latitude, longitude, force=False):
    """Resolve GPS to district/state and fetch official IMD CAP warnings."""
    details = reverse_geocode_details(latitude, longitude)
    if not IMD_CAP_ENABLED:
        return details, {
            "available": False,
            "mode": "DISABLED",
            "district_id": None,
            "district": details.get("district") or "",
            "warnings": [],
            "error": None,
            "source": "India Meteorological Department WIS2 CAP (disabled)"
        }
    result = fetch_imd_warnings(
        district=details.get("district"),
        city=details.get("city"),
        state=details.get("state"),
        force=force
    )
    return details, result


def _combine_weather_alerts(weather_alerts, imd_result):
    combined = list(weather_alerts or [])

    for warning in (imd_result or {}).get("warnings", []):
        combined.append({
            "level": warning.get("level", "yellow"),
            "severity": warning.get("severity", warning.get("level", "yellow")),
            "title": warning.get("title", "IMD Weather Alert"),
            "message": warning.get("message", "An official IMD warning is active."),
            "instruction": warning.get("instruction", ""),
            "location": warning.get("district", ""),
            "source": warning.get("source", "India Meteorological Department"),
            "official": True,
            "event": warning.get("event", ""),
            "expires": warning.get("expires", "")
        })

    return combined


def _important_alert(alerts, prefs):
    notify_rain, notify_extreme, notify_wind = prefs
    priority = {"red": 4, "orange": 3, "yellow": 2, "danger": 4, "warning": 3}
    candidates = []
    for alert in alerts or []:
        title = str(alert.get("title", "")).lower()
        level = str(alert.get("level", alert.get("severity", ""))).lower()
        if level not in priority:
            continue
        if alert.get("official"):
            candidates.append(alert)
            continue
        if "rain" in title and not notify_rain:
            continue
        if ("temperature" in title or "heat" in title) and not notify_extreme:
            continue
        if "wind" in title and not notify_wind:
            continue
        candidates.append(alert)
    return sorted(candidates, key=lambda a: priority.get(
        str(a.get("level", a.get("severity", ""))).lower(), 0
    ), reverse=True)
