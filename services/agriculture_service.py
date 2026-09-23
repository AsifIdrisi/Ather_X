"""Explainable, weather-aware crop decision support.

This is advisory support, not a replacement for local agricultural
extension services, soil testing, or government advisories.
"""

from datetime import datetime

CROP_PROFILES = {
    "wheat": {
        "label": "Wheat",
        "rain_sensitive": True,
        "heat_limit": 32,
        "frost_sensitive": False,
        "spray_wind_limit": 20,
        "water_need": "moderate",
    },
    "rice": {
        "label": "Rice",
        "rain_sensitive": False,
        "heat_limit": 38,
        "frost_sensitive": False,
        "spray_wind_limit": 20,
        "water_need": "high",
    },
    "maize": {
        "label": "Maize",
        "rain_sensitive": True,
        "heat_limit": 35,
        "frost_sensitive": False,
        "spray_wind_limit": 18,
        "water_need": "moderate",
    },
    "sugarcane": {
        "label": "Sugarcane",
        "rain_sensitive": False,
        "heat_limit": 40,
        "frost_sensitive": False,
        "spray_wind_limit": 20,
        "water_need": "high",
    },
    "potato": {
        "label": "Potato",
        "rain_sensitive": True,
        "heat_limit": 30,
        "frost_sensitive": False,
        "spray_wind_limit": 18,
        "water_need": "moderate",
    },
    "mustard": {
        "label": "Mustard",
        "rain_sensitive": True,
        "heat_limit": 30,
        "frost_sensitive": True,
        "spray_wind_limit": 18,
        "water_need": "low",
    },
    "cotton": {
        "label": "Cotton",
        "rain_sensitive": True,
        "heat_limit": 38,
        "frost_sensitive": False,
        "spray_wind_limit": 20,
        "water_need": "moderate",
    },
    "tomato": {
        "label": "Tomato",
        "rain_sensitive": True,
        "heat_limit": 35,
        "frost_sensitive": False,
        "spray_wind_limit": 15,
        "water_need": "moderate",
    },
    "vegetables": {
        "label": "Vegetables",
        "rain_sensitive": True,
        "heat_limit": 35,
        "frost_sensitive": True,
        "spray_wind_limit": 15,
        "water_need": "moderate",
    },
}

STAGES = [
    "Not specified",
    "Sowing",
    "Vegetative",
    "Flowering",
    "Fruiting / Grain filling",
    "Harvest",
]

SOILS = [
    "Not specified",
    "Alluvial",
    "Black soil",
    "Red soil",
    "Sandy",
    "Clay",
    "Loamy",
]

def _num(value, default=0.0):
    try:
        return float(value)
    except (TypeError, ValueError):
        return default

def _current(weather):
    """Support both raw Open-Meteo shape and WeatherGPT's normalized shape."""
    weather = weather or {}
    current = weather.get("current")
    if isinstance(current, dict) and current:
        return current
    return {
        "temperature": weather.get("temperature"),
        "feels_like": weather.get("feels_like"),
        "humidity": weather.get("humidity"),
        "wind_speed": weather.get("wind_speed"),
        "rain": weather.get("rain", weather.get("precipitation")),
        "precipitation": weather.get("precipitation", weather.get("rain")),
        "uv_index": weather.get("uv_index"),
    }

def _daily(weather):
    weather = weather or {}
    daily = weather.get("daily")
    if isinstance(daily, dict) and daily:
        return daily

    # WeatherGPT weather_service already normalizes daily data into a list
    # under ``forecast``. Convert that list back into the arrays used below.
    forecast = weather.get("forecast") or []
    return {
        "precipitation_probability_max": [d.get("rain_probability") for d in forecast],
        "precipitation_sum": [d.get("precipitation_sum") for d in forecast],
        "temperature_2m_max": [d.get("max_temp") for d in forecast],
        "temperature_2m_min": [d.get("min_temp") for d in forecast],
    }

def _hourly(weather):
    weather = weather or {}
    hourly = weather.get("hourly")
    if isinstance(hourly, dict) and hourly:
        return hourly
    hourly_forecast = weather.get("hourly_forecast") or []
    return {"items": hourly_forecast} if isinstance(hourly_forecast, list) else hourly_forecast

def _max_list(values):
    nums = [_num(v, None) for v in (values or [])]
    nums = [v for v in nums if v is not None]
    return max(nums) if nums else None

def _sum_list(values):
    return sum(_num(v) for v in (values or []))

def generate_agriculture_advisory(weather_data, crop="wheat",
                                  stage="Not specified",
                                  soil_type="Not specified",
                                  location="Selected Location"):
    crop_key = str(crop or "wheat").strip().lower()
    if crop_key not in CROP_PROFILES:
        crop_key = "wheat"

    stage = stage if stage in STAGES else "Not specified"
    soil_type = soil_type if soil_type in SOILS else "Not specified"
    profile = CROP_PROFILES[crop_key]

    cur = _current(weather_data)
    daily = _daily(weather_data)
    hourly = _hourly(weather_data)

    temp = _num(cur.get("temperature"), _num(cur.get("temperature_2m")))
    feels = _num(cur.get("feels_like"), _num(cur.get("apparent_temperature"), temp))
    humidity = _num(cur.get("humidity"), _num(cur.get("relative_humidity_2m")))
    wind = _num(cur.get("wind_speed"), _num(cur.get("wind_speed_10m")))
    rain_now = _num(cur.get("rain"), _num(cur.get("precipitation")))

    daily_rain_prob = _max_list(daily.get("precipitation_probability_max"))
    daily_rain = _sum_list(daily.get("precipitation_sum"))
    max_temp = _max_list(daily.get("temperature_2m_max"))
    min_temp = min(
        [_num(v, None) for v in (daily.get("temperature_2m_min") or []) if _num(v, None) is not None],
        default=None,
    )

    score = 10
    recommendations = []
    risks = []
    actions = []
    evidence = []

    if daily_rain_prob is not None and daily_rain_prob >= 70:
        score += 18
        recommendations.append("Rain is likely; avoid unnecessary irrigation and plan field work around the rain window.")
        risks.append("High rainfall probability")
        evidence.append(f"Forecast rain probability up to {daily_rain_prob:.0f}%")
    elif daily_rain_prob is not None and daily_rain_prob >= 40:
        score += 8
        recommendations.append("Keep irrigation flexible because rainfall is possible.")
        evidence.append(f"Forecast rain probability up to {daily_rain_prob:.0f}%")
    else:
        recommendations.append("No strong rainfall signal; monitor soil moisture before irrigation.")
        evidence.append("No high rainfall probability signal in the forecast")

    if daily_rain >= 25:
        score += 15
        risks.append("Wet-field / waterlogging risk")
        actions.append("Check drainage and avoid entering saturated fields with machinery.")
        evidence.append(f"Forecast precipitation about {daily_rain:.1f} mm")

    heat_limit = profile["heat_limit"]
    if temp >= heat_limit or (max_temp is not None and max_temp >= heat_limit):
        score += 22
        risks.append("Heat stress")
        recommendations.append(
            f"Heat stress is possible for {profile['label']}; prioritize moisture monitoring and reduce non-essential midday field work."
        )
        actions.append("Inspect crop for heat/wilting stress and maintain suitable soil moisture.")
        evidence.append(f"Temperature reaches about {max_temp:.1f}°C" if max_temp is not None else f"Current temperature about {temp:.1f}°C")

    if profile["frost_sensitive"] and min_temp is not None and min_temp <= 5:
        score += 20
        risks.append("Cold/frost stress")
        recommendations.append("Cold conditions may stress this crop; monitor low-lying and exposed fields.")
        evidence.append(f"Forecast minimum near {min_temp:.1f}°C")

    if humidity >= 85 and (daily_rain_prob or 0) >= 50:
        score += 18
        risks.append("Fungal disease-favorable weather")
        actions.append("Scout leaves and fruit for disease symptoms; keep canopy and field drainage under observation.")
        evidence.append(f"Humidity about {humidity:.0f}% with rain probability {daily_rain_prob:.0f}%")

    if wind >= profile["spray_wind_limit"]:
        score += 12
        risks.append("Unsuitable high-wind field/spraying conditions")
        recommendations.append("Avoid spraying during strong winds; wait for a safer weather window and follow the product label.")
        evidence.append(f"Wind about {wind:.0f} km/h")
    else:
        actions.append("If spraying is otherwise required, choose a calm, dry window and follow the label and local advisory.")

    if stage == "Sowing":
        recommendations.append("For sowing, prefer a workable soil-moisture window and avoid sowing immediately before heavy rain.")
    elif stage == "Flowering":
        recommendations.append("During flowering, monitor heat and moisture stress closely because weather can affect crop development.")
    elif stage == "Fruiting / Grain filling":
        recommendations.append("During fruiting/grain filling, maintain close moisture and disease monitoring.")
    elif stage == "Harvest":
        recommendations.append("For harvest, prefer a dry weather window and protect harvested produce from rain/moisture.")
    elif stage == "Vegetative":
        recommendations.append("During vegetative growth, monitor soil moisture, weeds, and weather-driven disease pressure.")

    if soil_type == "Sandy":
        recommendations.append("Sandy soil can lose water faster; check soil moisture more frequently.")
    elif soil_type == "Clay":
        recommendations.append("Clay soil can drain slowly; be especially careful about over-irrigation after rain.")
    elif soil_type == "Loamy":
        recommendations.append("Loamy soil generally provides a balanced water-holding/drainage condition; continue field-based moisture checks.")
    elif soil_type in ("Alluvial", "Black soil", "Red soil"):
        recommendations.append(f"For {soil_type.lower()} soil, adjust irrigation using actual soil moisture and local crop guidance.")

    uv = _num(cur.get("uv_index"))
    if uv >= 8:
        actions.append("Plan outdoor farm work with heat/UV precautions and adequate breaks.")

    score = max(0, min(100, round(score)))
    if score >= 70:
        level = "High Attention"
    elif score >= 40:
        level = "Moderate Attention"
    else:
        level = "Low Attention"

    if not risks:
        risks.append("No major weather-driven agricultural risk signal detected")
    if not actions:
        actions.append("Continue routine field monitoring and follow local agricultural advisories.")

    return {
        "location": location or "Selected Location",
        "crop": crop_key,
        "crop_label": profile["label"],
        "stage": stage,
        "soil_type": soil_type,
        "advisory_score": score,
        "attention_level": level,
        "risks": risks,
        "recommendations": recommendations,
        "actions": actions,
        "evidence": evidence,
        "weather_snapshot": {
            "temperature": temp,
            "feels_like": feels,
            "humidity": humidity,
            "wind_speed": wind,
            "rain": rain_now,
            "rain_probability": daily_rain_prob,
            "forecast_rain": daily_rain,
            "forecast_max_temperature": max_temp,
            "forecast_min_temperature": min_temp,
        },
        "source": "WeatherGPT weather forecast + explainable agriculture rules",
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "disclaimer": (
            "Advisory support only. Confirm crop, soil, irrigation, pest/disease and "
            "spraying decisions with local agricultural advisories, soil conditions, "
            "product labels and government extension guidance."
        ),
    }
