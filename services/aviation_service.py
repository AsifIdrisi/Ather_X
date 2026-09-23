"""Weather-aware aviation decision support for WeatherGPT.

This module is deliberately advisory: it does not replace official TAF/METAR,
NOTAM, ATC, airport authority, or DGCA operational information.
"""

def _num(value):
    try:
        return float(value) if value is not None else None
    except (TypeError, ValueError):
        return None

def _risk_level(score):
    if score >= 75:
        return "High"
    if score >= 45:
        return "Moderate"
    return "Low"

def _weather_label(code):
    code = _num(code)
    if code is None:
        return "Unknown"
    code = int(code)
    if code in (95, 96, 99):
        return "Thunderstorm"
    if code in (65, 67, 80, 81, 82):
        return "Heavy rain / showers"
    if code in (51, 53, 55, 56, 57):
        return "Drizzle"
    if code in (71, 73, 75, 77, 85, 86):
        return "Snow / snow showers"
    if code in (45, 48):
        return "Fog"
    if code in (1, 2, 3):
        return "Cloudy"
    return "Generally clear"

def generate_aviation_advisory(weather_data, imd_result=None, location="Selected Location"):
    current = weather_data or {}
    forecast = current.get("forecast") or []
    hourly = current.get("hourly_forecast") or []

    score = 10
    risks = []
    recommendations = []
    evidence = []

    temp = _num(current.get("temperature"))
    wind = _num(current.get("wind_speed"))
    gust = _num(current.get("wind_gusts"))
    visibility_m = _num(current.get("visibility"))
    cloud = _num(current.get("cloud_cover"))
    pressure = _num(current.get("surface_pressure"))
    code = _num(current.get("weather_code"))

    # Current-condition signals.
    if gust is not None and gust >= 55:
        score += 28
        risks.append("Very strong wind gusts may create difficult operating conditions.")
    elif gust >= 40:
        score += 12
        risks.append("Moderate-to-strong wind gusts should be considered for operational planning.")
    elif gust >= 25:
        score += 5
        risks.append("Noticeable wind gusts should be monitored.")
    elif wind is not None and wind >= 35:
        score += 20
        risks.append("Strong surface winds may affect take-off, landing and ground handling.")
    elif wind is not None and wind >= 25:
        score += 10
        risks.append("Moderately strong winds should be considered for operational planning.")
    if visibility_m is not None:
        visibility_km = visibility_m / 1000
        evidence.append(f"Visibility about {visibility_km:.1f} km")
        if visibility_km < 1:
            score += 35
            risks.append("Very low visibility indicates a significant visibility risk.")
        elif visibility_km < 3:
            score += 22
            risks.append("Reduced visibility may affect visual operations.")
        elif visibility_km < 5:
            score += 10
            risks.append("Visibility is somewhat reduced.")

    if cloud is not None:
        evidence.append(f"Cloud cover {cloud:.0f}%")

        if cloud >= 90:
            score += 10
            risks.append("Extensive cloud cover may reduce visual flying conditions.")
        elif cloud >= 75:
            score += 5
            risks.append("High cloud cover should be monitored for visual flying conditions.")
            
    if code is not None and int(code) in (45, 48):
        score += 25
        risks.append("Fog signal is present in the current weather code.")
    if code is not None and int(code) in (95, 96, 99):
        score += 35
        risks.append("Thunderstorm signal is present; lightning and turbulence hazards may increase.")
    elif code is not None and int(code) in (65, 67, 80, 81, 82):
        score += 18
        risks.append("Rain or showers may reduce visibility and affect runway conditions.")

    if temp is not None and temp >= 40:
        score += 8
        risks.append("Extreme heat can affect aircraft performance and ground operations.")

    # Short-term forecast hazards.
    next_hours = hourly[:12]
    thunder_hours = sum(1 for h in next_hours if _num(h.get("weather_code")) in (95, 96, 99))
    heavy_rain_hours = sum(1 for h in next_hours if _num(h.get("weather_code")) in (65, 67, 80, 81, 82))
    strong_wind_hours = sum(1 for h in next_hours if (_num(h.get("wind_gusts")) or 0) >= 45)

    if thunder_hours:
        score += min(25, thunder_hours * 6)
        risks.append(f"Thunderstorm conditions appear in the next 12 hours ({thunder_hours} hour(s)).")
        recommendations.append("Check the latest official airport weather and thunderstorm advisories before operations.")
    if heavy_rain_hours:
        score += min(15, heavy_rain_hours * 3)
        recommendations.append("Allow extra planning for rain-related visibility and runway-condition changes.")
    if strong_wind_hours:
        score += min(15, strong_wind_hours * 3)
        recommendations.append("Review wind direction, gusts and aircraft crosswind limits using official operational data.")

    # Official IMD warning signal, if already integrated.
    official = []
    if isinstance(imd_result, dict):
        official = imd_result.get("warnings") or imd_result.get("alerts") or []
    if official:
        score += min(20, len(official) * 7)
        risks.append(f"{len(official)} active official IMD warning signal(s) are available for this location.")
        recommendations.append("Cross-check the active IMD warning with airport/aviation operational information.")

    if not risks:
        risks.append("No major weather-related aviation risk signal was detected from the available forecast data.")

    if not recommendations:
        recommendations.extend([
            "Use the latest METAR/TAF, NOTAM and airport operational information for flight decisions.",
            "Re-check conditions close to departure because weather can change rapidly.",
        ])

    score = max(0, min(100, int(round(score))))
    level = _risk_level(score)

    if level == "Low":
        summary = "Weather conditions show relatively low weather-related operational risk from the available data."
    elif level == "Moderate":
        summary = "Some weather factors may affect aviation operations; additional operational checks are recommended."
    else:
        summary = "Significant weather-related operational risk signals are present; official aviation information should be checked before flight decisions."

    return {
        "location": location,
        "risk_score": score,
        "risk_level": level,
        "summary": summary,
        "risks": risks,
        "recommendations": recommendations,
        "evidence": evidence,
        "current_weather": {
            "temperature": temp,
            "wind_speed": wind,
            "wind_gusts": gust,
            "visibility_km": round(visibility_m / 1000, 1) if visibility_m is not None else None,
            "cloud_cover": cloud,
            "surface_pressure": pressure,
            "weather": _weather_label(code),
        },
        "forecast_signals": {
            "next_12h_thunderstorm_hours": thunder_hours,
            "next_12h_heavy_rain_hours": heavy_rain_hours,
            "next_12h_strong_wind_hours": strong_wind_hours,
        },
        "official_imd_warning_count": len(official),
        "source": "Open-Meteo weather forecast + integrated IMD warning signals",
        "disclaimer": "Decision-support only. This is not a substitute for official METAR/TAF, NOTAM, ATC, airport authority or DGCA operational guidance.",
    }
