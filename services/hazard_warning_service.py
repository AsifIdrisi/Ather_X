"""Flood and cyclone/severe-storm risk assessment for WeatherGPT.

This module intentionally distinguishes forecast/rule-based risk from an
official disaster warning. It never declares a cyclone solely from generic
weather conditions. Official signals, when available, are promoted.
"""

LEVEL_ORDER = {"green": 0, "yellow": 1, "orange": 2, "red": 3}


def _num(value, default=0.0):
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _level(score):
    if score >= 75:
        return "red"
    if score >= 50:
        return "orange"
    if score >= 25:
        return "yellow"
    return "green"


def _label(level):
    return {"green": "Low", "yellow": "Moderate", "orange": "High", "red": "Very High"}.get(level, "Low")


def _official_text(imd_result):
    warnings = (imd_result or {}).get("warnings") or []
    return " ".join(
        f"{w.get('title', '')} {w.get('message', '')}" for w in warnings
    ).lower()


def _official_level_for_keywords(imd_result, keywords):
    matches = []
    for warning in (imd_result or {}).get("warnings", []) or []:
        text = f"{warning.get('title', '')} {warning.get('message', '')}".lower()
        if any(k in text for k in keywords):
            level = str(warning.get("level") or warning.get("severity") or "green").lower()
            if level in LEVEL_ORDER:
                matches.append(level)
    return max(matches, key=lambda x: LEVEL_ORDER[x], default="green")


def _daily_window(weather_data, days=2):
    forecast = (weather_data or {}).get("forecast") or []
    rows = []
    for day in forecast[:days]:
        rows.append({
            "date": day.get("date"),
            "rain_probability": _num(day.get("rain_probability")),
            "precipitation": _num(day.get("precipitation_sum")),
            "rain": _num(day.get("rain_sum")),
        })
    return rows


def _hourly_window(weather_data, hours=48):
    return ((weather_data or {}).get("hourly_forecast") or [])[:hours]


def generate_hazard_warnings(weather_data=None, imd_result=None, location="Unknown Location"):
    weather_data = weather_data or {}
    imd_result = imd_result or {}
    daily = _daily_window(weather_data, 2)
    hourly = _hourly_window(weather_data, 48)
    official_text = _official_text(imd_result)

    # ---------------- FLOOD ----------------
    max_daily_rain = max((d["precipitation"] for d in daily), default=0)
    two_day_rain = sum(d["precipitation"] for d in daily)
    max_rain_prob = max((d["rain_probability"] for d in daily), default=0)
    hourly_rain_24 = sum(_num(h.get("precipitation")) for h in hourly[:24])
    heavy_hours = sum(1 for h in hourly if _num(h.get("precipitation")) >= 10)

    flood_score = min(100, max_rain_prob * 0.35 + max_daily_rain * 1.7 + two_day_rain * 0.65)
    if hourly_rain_24 >= 30:
        flood_score += 12
    if hourly_rain_24 >= 50:
        flood_score += 12
    if heavy_hours >= 3:
        flood_score += 10

    official_flood = _official_level_for_keywords(
        imd_result, ("flood", "very heavy rain", "extremely heavy rain", "heavy rainfall")
    )
    if official_flood != "green":
        flood_score = max(flood_score, {"yellow": 45, "orange": 70, "red": 90}[official_flood])

    flood_level = max(_level(flood_score), official_flood, key=lambda x: LEVEL_ORDER[x])
    flood_official = official_flood != "green" or "flood" in official_text
    flood_reason = (
        f"Next 48h rainfall: {two_day_rain:.1f} mm; highest daily rain probability: {max_rain_prob:.0f}%."
    )
    if hourly_rain_24:
        flood_reason += f" Estimated next-24h precipitation: {hourly_rain_24:.1f} mm."
    if flood_official:
        flood_reason += " An official warning signal matching heavy rain/flood conditions is available."

    flood_actions = [
        "Monitor official local flood and rainfall warnings.",
        "Avoid unnecessary travel through flooded, low-lying or waterlogged areas.",
        "Keep essential items and emergency contacts ready if rainfall intensifies.",
    ]

    # ---------------- CYCLONE / SEVERE STORM ----------------
    max_wind = max([_num(weather_data.get("wind_speed"))] + [_num(h.get("wind_speed")) for h in hourly], default=0)
    max_gust = max([_num(weather_data.get("wind_gusts"))] + [_num(h.get("wind_gusts")) for h in hourly], default=0)
    storm_hours = sum(1 for h in hourly if int(_num(h.get("weather_code"), -1)) in {95, 96, 99})
    storm_rain = sum(_num(h.get("precipitation")) for h in hourly if int(_num(h.get("weather_code"), -1)) in {95, 96, 99})

    # Generic weather can indicate severe-storm risk, but NOT a cyclone declaration.
    cyclone_score = min(70, max_wind * 0.65 + max_gust * 0.35)
    cyclone_score += min(20, storm_hours * 5)
    if storm_rain >= 20:
        cyclone_score += 10

    official_cyclone = _official_level_for_keywords(
        imd_result, ("cyclone", "cyclonic storm", "deep depression", "depression", "cyclonic circulation")
    )
    if official_cyclone != "green":
        cyclone_score = max(cyclone_score, {"yellow": 45, "orange": 70, "red": 90}[official_cyclone])

    cyclone_level = max(_level(cyclone_score), official_cyclone, key=lambda x: LEVEL_ORDER[x])
    cyclone_official = official_cyclone != "green"
    if cyclone_official:
        cyclone_name = "Cyclone Warning"
        cyclone_status = "Official cyclone-related warning signal detected."
    elif cyclone_score >= 50:
        cyclone_name = "Severe Storm / Cyclone Risk"
        cyclone_status = "Forecast conditions indicate elevated severe-storm risk; this is not an official cyclone declaration."
    else:
        cyclone_name = "Cyclone / Severe Storm Risk"
        cyclone_status = "No official cyclone signal detected; current forecast conditions do not indicate a high cyclone risk."

    cyclone_reason = (
        f"Maximum forecast wind: {max_wind:.1f} km/h; maximum gust: {max_gust:.1f} km/h; "
        f"thunderstorm-coded hours: {storm_hours}."
    )
    cyclone_actions = [
        "Follow official IMD/local disaster-management instructions for any cyclone warning.",
        "Secure loose outdoor objects and avoid exposed areas during severe winds.",
        "Do not treat a model/rule-based risk score as a confirmed cyclone track or landfall prediction.",
    ]

    return {
        "location": location,
        "flood": {
            "hazard": "Flood Warning",
            "score": int(round(min(100, flood_score))),
            "level": flood_level,
            "risk_level": _label(flood_level),
            "official": flood_official,
            "status": "Official warning signal detected." if flood_official else "Forecast-based flood/heavy-rain risk assessment.",
            "reason": flood_reason,
            "actions": flood_actions,
            "metrics": {
                "next_24h_precipitation_mm": round(hourly_rain_24, 1),
                "next_48h_precipitation_mm": round(two_day_rain, 1),
                "max_daily_rain_probability": round(max_rain_prob, 1),
                "heavy_rain_hours": heavy_hours,
            },
        },
        "cyclone": {
            "hazard": cyclone_name,
            "score": int(round(min(100, cyclone_score))),
            "level": cyclone_level,
            "risk_level": _label(cyclone_level),
            "official": cyclone_official,
            "status": cyclone_status,
            "reason": cyclone_reason,
            "actions": cyclone_actions,
            "metrics": {
                "max_wind_kmh": round(max_wind, 1),
                "max_gust_kmh": round(max_gust, 1),
                "storm_hours": storm_hours,
            },
        },
        "source": "WeatherGPT Hazard Warning Engine + Open-Meteo forecast + official IMD signals when available",
        "disclaimer": "Risk scores are decision-support estimates. For safety-critical action, follow official IMD and local disaster-management warnings.",
    }
