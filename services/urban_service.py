"""Weather-aware advisory generation for urban / smart-city operations."""

def _num(value, default=0.0):
    try:
        return float(value)
    except (TypeError, ValueError):
        return default

def _level(score):
    if score >= 75:
        return "Very High"
    if score >= 50:
        return "High"
    if score >= 25:
        return "Moderate"
    return "Low"

def _risk(name, score, reason, actions):
    score = max(0, min(100, int(round(score))))
    return {
        "category": name,
        "risk_score": score,
        "risk_level": _level(score),
        "reason": reason,
        "recommended_actions": actions,
    }

def generate_urban_advisory(weather_data=None, imd_result=None, location="Unknown Location"):
    """Generate explainable weather-aware decision support for city operations."""
    weather_data = weather_data or {}
    imd_result = imd_result or {}
    current = weather_data
    forecast = weather_data.get("forecast") or []
    hourly = weather_data.get("hourly_forecast") or []
    aq = weather_data.get("air_quality") or {}

    temp = _num(current.get("temperature"), 0)
    humidity = _num(current.get("humidity"), 0)
    rain = _num(current.get("rain"), 0)
    wind = _num(current.get("wind_speed"), 0)
    gusts = _num(current.get("wind_gusts"), 0)
    visibility_m = _num(current.get("visibility"), 0)
    aqi = _num(aq.get("us_aqi"), 0)

    rain_prob = max((_num(x.get("rain_probability"), 0) for x in forecast), default=0)
    daily_precip = max((_num(x.get("precipitation_sum"), 0) for x in forecast), default=0)
    storm_hours = sum(1 for x in hourly if int(_num(x.get("weather_code"), -1)) in {95, 96, 99})
    low_visibility_hours = sum(1 for x in hourly[:24] if 0 < _num(x.get("visibility"), 999999) < 2000)

    warnings = imd_result.get("warnings", []) or []
    warning_text = " ".join(str(w.get("title", "")) + " " + str(w.get("message", "")) for w in warnings).lower()
    official_boost = 20 if warnings else 0

    risks = []

    flood = min(100, rain_prob * 0.5 + daily_precip * 2.2 + (15 if rain >= 10 else 0) + (official_boost if any(k in warning_text for k in ("heavy rain", "flood", "waterlogging")) else 0))
    risks.append(_risk("Waterlogging / Urban Flooding", flood,
        f"Rain probability reaches {rain_prob:.0f}% and forecast precipitation peaks near {daily_precip:.1f} mm/day.",
        ["Prepare drainage and pumping teams in vulnerable zones.", "Issue waterlogging/low-lying-area travel guidance when thresholds are exceeded."]))

    heat = max(0, (temp - 32) * 8) + (12 if humidity >= 70 and temp >= 35 else 0)
    heat = min(100, heat + (official_boost if "heat wave" in warning_text or "heatwave" in warning_text else 0))
    risks.append(_risk("Heat Stress / Outdoor Operations", heat,
        f"Current temperature is {temp:.1f}°C with {humidity:.0f}% relative humidity.",
        ["Plan outdoor municipal work outside peak heat where possible.", "Activate drinking-water, shade and public heat-awareness measures when risk is high."]))

    traffic = min(100, (rain_prob * 0.35) + low_visibility_hours * 8 + max(0, (5000 - visibility_m) / 80 if visibility_m else 0) + (10 if rain >= 5 else 0))
    risks.append(_risk("Traffic / Visibility", traffic,
        f"Forecast rain probability is {rain_prob:.0f}% and {low_visibility_hours} of the next 24 hours show reduced-visibility conditions.",
        ["Use dynamic traffic messaging on rain/visibility-sensitive corridors.", "Increase caution around intersections, underpasses and waterlogged roads."]))

    air = min(100, max(0, (aqi - 50) * 0.9))
    risks.append(_risk("Air Quality", air,
        f"Current US AQI is approximately {aqi:.0f}.",
        ["Use the latest AQI to guide outdoor-event and public-space messaging.", "Coordinate with official air-quality advisories when active."]))

    infrastructure = min(
        100,
        wind * 0.8
        + max(0, gusts - 30) * 1.0
        + min(40, storm_hours * 2)
    ) 
    risks.append(_risk("Infrastructure / Outdoor Assets", infrastructure,
        f"Current wind is {wind:.1f} km/h with gusts up to {gusts:.1f} km/h; {storm_hours} thunderstorm-coded hour(s) are forecast.",
        ["Inspect temporary structures, signage and exposed assets when strong winds are expected.", "Pause vulnerable outdoor operations during severe thunderstorms."]))

    events = min(
        100,
        min(50, storm_hours * 2.5)
        + rain_prob * 0.25
        + max(0, (temp - 35) * 5)
    )    
    risks.append(_risk("Outdoor Events", events,
        f"Weather signals include {storm_hours} thunderstorm hour(s), {rain_prob:.0f}% peak rain probability and {temp:.1f}°C current temperature.",
        ["Reassess outdoor event timing when severe weather signals increase.", "Keep an indoor/sheltered contingency plan for high-risk periods."]))

    risks.sort(key=lambda x: x["risk_score"], reverse=True)
    risks.sort(key=lambda x: x["risk_score"], reverse=True)

    if risks:
        top_scores = [item["risk_score"] for item in risks[:3]]
        overall = int(round(
            top_scores[0] * 0.5 +
            top_scores[1] * 0.3 +
            top_scores[2] * 0.2
        ))
    else:
        overall = 0
    overall = risks[0]["risk_score"] if risks else 0
    priority = risks[:3]

    return {
        "location": location,
        "overall_risk_score": int(overall),
        "overall_risk_level": _level(overall),
        "top_priority": priority[0] if priority else None,
        "risks": risks,
        "priority_actions": [a for item in priority for a in item["recommended_actions"]][:6],
        "official_warning_count": len(warnings),
        "official_warning_level": max((str(w.get("level", "green")) for w in warnings), default="green"),
        "source": "WeatherGPT Urban Decision Engine + Open-Meteo + IMD WIS2 CAP",
        "method": "Explainable rule-based city risk assessment using current weather, forecast, visibility, AQI, storm signals and official IMD warning context.",
        "disclaimer": "Decision-support only. City authorities should use official forecasts, emergency protocols and local sensor/traffic data for operational decisions.",
    }
