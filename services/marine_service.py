"""Weather-based marine advisory using Open-Meteo Marine data."""
import requests
from math import radians, sin, cos, sqrt, atan2

MARINE_URL = "https://marine-api.open-meteo.com/v1/marine"
def _num(v, default=0.0):
    try:
        return float(v)
    except (TypeError, ValueError):
        return default

def generate_marine_advisory(latitude, longitude, location_name="Selected Location", imd_result=None):
        # Marine advisory is meaningful only for coastal / marine locations.
    # Do not show a fake 0/100 marine risk for inland locations.
    location_text = (location_name or "").lower()

    inland_indicators = [
        "lucknow",
        "kanpur",
        "agra",
        "delhi",
        "jaipur",
        "indore",
        "bhopal",
        "varanasi",
        "prayagraj",
        "azamgarh",
        "gorakhpur",
        "ayodhya",
        "bareilly",
        "meerut",
        "patna",
        "ranchi",
        "chandigarh",
        "dehradun",
        "ludhiana",
        "amritsar",
    ]

    if any(place in location_text for place in inland_indicators):
        return {
            "location": location_name,
            "is_marine": False,
            "risk_score": None,
            "risk_level": None,
            "message": "This location is not a marine location.",
        }
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "hourly": "wave_height,wave_direction,wave_period,wind_wave_height,wind_wave_period,swell_wave_height,swell_wave_period",
        "forecast_days": 3,
        "timezone": "auto",
    }
    r = requests.get(MARINE_URL, params=params, timeout=12)
    r.raise_for_status()
    data = r.json()
    hourly = data.get("hourly", {})
    times = hourly.get("time", [])
    def at(key, i=0):
        vals = hourly.get(key, [])
        return vals[i] if i < len(vals) else None

    wave = _num(at("wave_height"))
    period = _num(at("wave_period"))
    wind_wave = _num(at("wind_wave_height"))
    swell = _num(at("swell_wave_height"))

    max_wave = max([_num(x) for x in hourly.get("wave_height", []) if x is not None] or [wave])
    max_wind_wave = max([_num(x) for x in hourly.get("wind_wave_height", []) if x is not None] or [wind_wave])
    max_swell = max([_num(x) for x in hourly.get("swell_wave_height", []) if x is not None] or [swell])

    score = 0
    reasons = []
    if wave >= 2.5 or max_wave >= 3.5:
        score += 45; reasons.append("High wave conditions are indicated.")
    elif wave >= 1.5 or max_wave >= 2.5:
        score += 25; reasons.append("Moderate-to-high waves may affect small craft.")
    elif wave >= 0.8 or max_wave >= 1.5:
        score += 10; reasons.append("Noticeable waves are expected.")
    if swell >= 2.0 or max_swell >= 3.0:
        score += 25; reasons.append("Swell may increase vessel motion and discomfort.")
    elif swell >= 1.0:
        score += 10; reasons.append("Moderate swell is present.")
    if period >= 10:
        score += 15; reasons.append("Long-period waves can carry significant energy.")
    if max_wind_wave >= 2.0:
        score += 15; reasons.append("Wind-generated waves may become hazardous.")

    official = []
    if imd_result:
        official = imd_result.get("warnings") or imd_result.get("alerts") or []
        if official:
            score += 15
            reasons.append("Official IMD warning information is available for the selected location.")

    score = min(100, int(score))
    level = "High" if score >= 60 else "Moderate" if score >= 30 else "Low"
    actions = {
        "Low": ["Normal planning is reasonable; continue monitoring updated marine forecasts."],
        "Moderate": ["Small-craft operators should review updated conditions before departure.", "Allow extra caution for exposed coastal waters and changing weather."],
        "High": ["Avoid unnecessary small-craft operations until conditions improve.", "Check official IMD marine/coastal warnings and local port authority guidance before sailing."]
    }[level]

    return {
        "location": location_name,
        "risk_score": score,
        "risk_level": level,
        "summary": f"Marine weather risk is {level.lower()} at {location_name} based on forecast wave and swell conditions.",
        "current": {"wave_height_m": round(wave, 2), "wave_period_s": round(period, 1), "wind_wave_height_m": round(wind_wave, 2), "swell_height_m": round(swell, 2), "wave_direction_deg": at("wave_direction")},
        "forecast": {"max_wave_height_m": round(max_wave, 2), "max_wind_wave_height_m": round(max_wind_wave, 2), "max_swell_height_m": round(max_swell, 2), "hours": len(times)},
        "reasons": reasons or ["No major marine hazard signal detected in the available wave forecast."],
        "recommendations": actions,
        "official_warning_count": len(official),
        "source": "Open-Meteo Marine forecast + official IMD warning context when available",
        "disclaimer": "Decision-support only. Marine operators must follow official IMD, port, coast guard and local maritime advisories.",
    }
