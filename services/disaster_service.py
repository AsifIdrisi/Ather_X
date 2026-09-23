"""Multi-hazard risk assessment based on current weather conditions."""

SEVERITY_SCORE = {
    "green": 0,
    "yellow": 20,
    "orange": 50,
    "red": 80,
}

def _num(value, default=0.0):
    try:
        return float(value)
    except (TypeError, ValueError):
        return default

def _cap_level(value):
    value = str(value or "").lower()
    if value in {"red", "orange", "yellow", "green"}:
        return value
    return "green"

def _max_level(levels):
    order = {"green": 0, "yellow": 1, "orange": 2, "red": 3}
    return max(((_cap_level(x)) for x in levels), key=lambda x: order[x], default="green")

def _risk_label(score):
    if score >= 75:
        return "Very High"
    if score >= 50:
        return "High"
    if score >= 25:
        return "Moderate"
    return "Low"

def _official_signal(imd_warnings):
    warnings = imd_warnings or []
    levels = [_cap_level(w.get("level") or w.get("severity")) for w in warnings]
    return _max_level(levels), len(warnings)

def _hazard(name, score, level, reason, actions, source="WeatherGPT Multi-Hazard Engine"):
    score = max(0, min(100, int(round(score))))
    return {
        "hazard": name,
        "risk_score": score,
        "risk_level": _risk_label(score),
        "alert_level": _cap_level(level),
        "reason": reason,
        "actions": actions,
        "source": source,
    }

def analyze_disaster_risk(weather_data=None, imd_result=None, location="Unknown Location"):
    """Build an explainable multi-hazard risk profile from weather + official IMD alerts."""
    weather_data = weather_data or {}
    imd_result = imd_result or {}
    warnings = imd_result.get("warnings", []) or []
    official_level, warning_count = _official_signal(warnings)

    temperature = _num(weather_data.get("temperature"), None)
    humidity = _num(weather_data.get("humidity"), None)
    wind = _num(weather_data.get("wind_speed"), None)
    rain = _num(weather_data.get("rain"), 0)
    uv = _num(weather_data.get("uv_index"), 0)
    aq = weather_data.get("air_quality") or {}
    aqi = _num(aq.get("us_aqi"), 0)
    forecast = weather_data.get("forecast") or []
    hourly = weather_data.get("hourly_forecast") or []

    rain_probs = [_num(d.get("rain_probability"), 0) for d in forecast]
    precip_sums = [_num(d.get("precipitation_sum"), 0) for d in forecast]
    max_rain_prob = max(rain_probs, default=0)
    max_daily_precip = max(precip_sums, default=0)
    storm_codes = {95, 96, 99}
    storm_hours = sum(1 for h in hourly if int(_num(h.get("weather_code"), -1)) in storm_codes)

    hazards = []

    # Flood / heavy-rain risk
    flood_score = min(70, max_rain_prob * 0.45 + max_daily_precip * 1.8)
    if rain >= 20:
        flood_score += 15
    if official_level in {"orange", "red"}:
        flood_score += 15 if warning_count else 0
    flood_level = "red" if flood_score >= 75 else "orange" if flood_score >= 50 else "yellow" if flood_score >= 25 else "green"
    hazards.append(_hazard(
        "Flood / Heavy Rain",
        flood_score,
        flood_level,
        f"Rain probability peaks at {max_rain_prob:.0f}% and forecast precipitation peaks at {max_daily_precip:.1f} mm/day.",
        ["Monitor official warnings and local waterlogging updates.", "Avoid unnecessary travel through flooded or low-lying areas."]
    ))

    # Heat risk
    heat_score = 0
    if temperature is not None:
        heat_score += max(0, min(70, (temperature - 30) * 7))
    if temperature is not None and temperature >= 40:
        heat_score += 15
    if humidity is not None and humidity >= 70 and temperature is not None and temperature >= 35:
        heat_score += 10
    if any("heat" in str(w.get("title", "")).lower() for w in warnings):
        heat_score += SEVERITY_SCORE.get(official_level, 0) * 0.35
    heat_level = "red" if heat_score >= 75 else "orange" if heat_score >= 50 else "yellow" if heat_score >= 25 else "green"
    hazards.append(_hazard(
        "Extreme Heat",
        heat_score,
        heat_level,
        f"Current temperature is {temperature:.1f}°C." if temperature is not None else "Current temperature is unavailable.",
        ["Reduce exposure during the hottest part of the day.", "Stay hydrated and follow official heat advisories."]
    ))

    # Severe wind / storm risk
    wind_score = min(70, max(0, (wind or 0) * 1.15))
    wind_score += min(25, storm_hours * 8)
    if any(k in str(w.get("title", "")).lower() for w in warnings for k in ("wind", "thunder", "squall", "storm")):
        wind_score += 20
    wind_level = "red" if wind_score >= 75 else "orange" if wind_score >= 50 else "yellow" if wind_score >= 25 else "green"
    hazards.append(_hazard(
        "Thunderstorm / Strong Wind",
        wind_score,
        wind_level,
        f"Current wind is {wind:.1f} km/h with {storm_hours} forecast thunderstorm hour(s)." if wind is not None else f"Forecast indicates {storm_hours} thunderstorm hour(s).",
        ["Stay indoors during severe thunderstorms.", "Keep away from exposed areas and follow official warnings."]
    ))

    # Lightning risk
    lightning_score = min(100, storm_hours * 12)
    if any(k in str(w.get("title", "")).lower() for w in warnings for k in ("lightning", "thunderstorm", "squall")):
        lightning_score += 30
    lightning_level = "red" if lightning_score >= 75 else "orange" if lightning_score >= 50 else "yellow" if lightning_score >= 25 else "green"
    hazards.append(_hazard(
        "Lightning",
        lightning_score,
        lightning_level,
        f"{storm_hours} hourly forecast period(s) contain thunderstorm codes." if storm_hours else "No thunderstorm-coded hourly period is currently detected.",
        ["Seek a safe enclosed location when lightning is nearby.", "Avoid exposed outdoor locations during thunderstorms."]
    ))

    # Air quality is treated as an environmental hazard, not a disaster declaration.
    air_score = min(100, max(0, (aqi - 50) * 0.9))
    air_level = "red" if air_score >= 75 else "orange" if air_score >= 50 else "yellow" if air_score >= 25 else "green"
    hazards.append(_hazard(
        "Air Quality",
        air_score,
        air_level,
        f"US AQI is {aqi:.0f}." if aqi else "AQI is currently unavailable.",
        ["Check the latest AQI before prolonged outdoor activity.", "Follow local air-quality guidance if an official advisory is active."]
    ))

    # Promote hazards when an official IMD warning directly mentions them.
    warning_text = " ".join(
        str(w.get("title", "")) + " " + str(w.get("message", ""))
        for w in warnings
    ).lower()
    keyword_map = {
        "Flood / Heavy Rain": ("heavy rain", "very heavy rain", "extremely heavy rain", "flood"),
        "Extreme Heat": ("heat wave", "hot day", "warm night"),
        "Thunderstorm / Strong Wind": ("thunderstorm", "strong surface winds", "squall", "storm"),
        "Lightning": ("lightning", "thunderstorm"),
        "Air Quality": ("air quality", "pollution"),
    }
    for hazard in hazards:
        if any(k in warning_text for k in keyword_map.get(hazard["hazard"], ())):
            hazard["risk_score"] = min(100, hazard["risk_score"] + SEVERITY_SCORE.get(official_level, 0) * 0.25 + 10)
            hazard["risk_score"] = int(round(hazard["risk_score"]))
            hazard["risk_level"] = _risk_label(hazard["risk_score"])
            hazard["alert_level"] = _max_level([hazard["alert_level"], official_level])
            hazard["official_signal"] = True
        else:
            hazard["official_signal"] = False

    hazards.sort(key=lambda x: x["risk_score"], reverse=True)
    top = hazards[0] if hazards else None
    overall_score = max((h["risk_score"] for h in hazards), default=0)
    overall_level = _risk_label(overall_score)

    return {
        "location": location,
        "overall_risk_score": int(overall_score),
        "overall_risk_level": overall_level,
        "official_warning_level": official_level,
        "official_warning_count": warning_count,
        "official_warnings_available": bool(imd_result.get("available", False)),
        "top_hazard": top,
        "hazards": hazards,
        "method": "Explainable rule-based multi-hazard assessment using forecast conditions and official IMD CAP warning signals.",
        "source": "WeatherGPT Disaster Intelligence Engine + Open-Meteo + IMD WIS2 CAP",
    }
