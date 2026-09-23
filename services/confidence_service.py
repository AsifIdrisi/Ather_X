"""
WeatherGPT - Multi Model Forecast Confidence

Fetches GFS, ECMWF and ICON separately from Open-Meteo
and compares their forecasts to calculate confidence.
"""

from datetime import datetime, timezone
import os
import requests


OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"

DEFAULT_MODELS = (
    "gfs_seamless",
    "icon_seamless",
)


def _num(value):
    try:
        if value is None:
            return None
        return float(value)
    except (TypeError, ValueError):
        return None


def _clean_models(models=None):
    if models is None:
        env_models = os.getenv(
            "FORECAST_CONFIDENCE_MODELS",
            ""
        )

        if env_models.strip():
            models = env_models.split(",")
        else:
            models = DEFAULT_MODELS

    cleaned = []

    for model in models:
        model = str(model).strip()

        if model and model not in cleaned:
            cleaned.append(model)

    if len(cleaned) < 2:
        cleaned = list(DEFAULT_MODELS)

    return cleaned[:3]


def _fetch_single_model(
    latitude,
    longitude,
    model,
    forecast_days
):
    """
    Fetch one model separately.
    """

    params = {
        "latitude": latitude,
        "longitude": longitude,
        "daily": (
            "precipitation_probability_max,"
            "temperature_2m_max,"
            "wind_speed_10m_max"
        ),
        "timezone": "auto",
        "forecast_days": max(
            1,
            min(int(forecast_days), 7)
        ),
        "models": model,
    }

    try:

        response = requests.get(
            OPEN_METEO_URL,
            params=params,
            timeout=20,
        )

        response.raise_for_status()

        payload = response.json()

        if not isinstance(payload, dict):
            return None

        daily = payload.get("daily") or {}

        if not daily.get("time"):
            return None

        return payload

    except requests.RequestException:
        return None


def fetch_multi_model_forecasts(
    latitude,
    longitude,
    forecast_days=3,
    models=None,
):
    """
    Fetch GFS, ECMWF and ICON separately.

    This avoids depending on Open-Meteo's multi-model
    response format.
    """

    selected = _clean_models(models)

    responses = []

    for model in selected:

        payload = _fetch_single_model(
            latitude,
            longitude,
            model,
            forecast_days
        )

        if payload is not None:

            responses.append({
                "model": model,
                "payload": payload
            })

    return {
        "latitude": latitude,
        "longitude": longitude,
        "models": selected,
        "responses": responses,
    }


def _extract_daily_days(payload):
    daily = payload.get("daily") or {}

    times = daily.get("time") or []

    rain = (
        daily.get(
            "precipitation_probability_max"
        ) or []
    )

    temp = (
        daily.get(
            "temperature_2m_max"
        ) or []
    )

    wind = (
        daily.get(
            "wind_speed_10m_max"
        ) or []
    )

    count = len(times)

    days = []

    for index in range(count):

        days.append({

            "date": times[index],

            "rain_probability": (
                _num(rain[index])
                if index < len(rain)
                else None
            ),

            "temperature_c": (
                _num(temp[index])
                if index < len(temp)
                else None
            ),

            "wind_kmh": (
                _num(wind[index])
                if index < len(wind)
                else None
            ),
        })

    return days


def _extract_model_rows(result):

    rows = []

    for item in result.get("responses") or []:

        if not isinstance(item, dict):
            continue

        model_name = item.get("model")

        payload = item.get("payload")

        if not model_name or not payload:
            continue

        days = _extract_daily_days(payload)

        if not days:
            continue

        rows.append({

            "model": str(model_name),

            "days": days,

        })

    return rows


def _spread(values):

    cleaned = []

    for value in values:

        number = _num(value)

        if number is not None:
            cleaned.append(number)

    if len(cleaned) < 2:
        return None

    return round(
        max(cleaned) - min(cleaned),
        2
    )


def _score(spread, threshold):

    if spread is None:
        return None

    if threshold <= 0:
        return None

    score = (
        100 -
        (spread / threshold) * 100
    )

    return round(
        max(
            0,
            min(100, score)
        ),
        1
    )


def compare_forecasts(result):

    models = _extract_model_rows(result)

    model_count = len(models)

    if model_count < 2:

        return {

            "generated_at": datetime.now(
                timezone.utc
            ).isoformat(),

            "models": models,

            "model_count": model_count,

            "days": [],

            "rain_probability_spread": None,

            "temperature_spread": None,

            "wind_spread": None,

            "rain_score": None,

            "temperature_score": None,

            "wind_score": None,

            "confidence_score": 0,

            "confidence": "low",

            "high_disagreement": True,

            "flags": [
                "insufficient_model_data"
            ],

            "thresholds": {

                "rain_probability_percent": 20,

                "temperature_c": 3,

            },

            "disclaimer": (
                "Insufficient multi-model data. "
                "Follow official warnings for "
                "safety-critical decisions."
            ),
        }

    # ---------------------------------------------
    # Compare same forecast day across models
    # ---------------------------------------------

    max_days = max(
        len(model["days"])
        for model in models
    )

    days = []

    for day_index in range(max_days):

        day_values = []

        for model in models:

            model_days = model["days"]

            if day_index >= len(model_days):
                continue

            day_values.append(
                (
                    model["model"],
                    model_days[day_index]
                )
            )

        if len(day_values) < 2:
            continue

        rain_spread = _spread([
            item.get("rain_probability")
            for _, item in day_values
        ])

        temperature_spread = _spread([
            item.get("temperature_c")
            for _, item in day_values
        ])

        wind_spread = _spread([
            item.get("wind_kmh")
            for _, item in day_values
        ])

        date = next(
            (
                item.get("date")
                for _, item in day_values
                if item.get("date")
            ),
            None
        )

        days.append({

            "date": date,

            "rain_spread": rain_spread,

            "temperature_spread":
                temperature_spread,

            "wind_spread":
                wind_spread,

            "rain_high_disagreement": (
                rain_spread is not None
                and rain_spread > 20
            ),

            "temperature_high_disagreement": (
                temperature_spread is not None
                and temperature_spread > 3
            ),

        })

    # ---------------------------------------------
    # Maximum spreads
    # ---------------------------------------------

    max_rain = max(
        (
            day["rain_spread"]
            for day in days
            if day["rain_spread"] is not None
        ),
        default=None
    )

    max_temperature = max(
        (
            day["temperature_spread"]
            for day in days
            if day["temperature_spread"]
            is not None
        ),
        default=None
    )

    max_wind = max(
        (
            day["wind_spread"]
            for day in days
            if day["wind_spread"] is not None
        ),
        default=None
    )

    # ---------------------------------------------
    # Scores
    # ---------------------------------------------

    rain_score = _score(
        max_rain,
        20
    )

    temperature_score = _score(
        max_temperature,
        3
    )

    wind_score = _score(
        max_wind,
        10
    )

    weighted = []

    if rain_score is not None:
        weighted.append(
            (rain_score, 0.50)
        )

    if temperature_score is not None:
        weighted.append(
            (temperature_score, 0.35)
        )

    if wind_score is not None:
        weighted.append(
            (wind_score, 0.15)
        )

    if weighted:

        total_weight = sum(
            weight
            for _, weight in weighted
        )

        confidence_score = round(
            sum(
                score * weight
                for score, weight in weighted
            ) / total_weight
        )

    else:

        confidence_score = 0

    # ---------------------------------------------
    # Disagreement flags
    # ---------------------------------------------

    flags = []

    if (
        max_rain is not None
        and max_rain > 20
    ):
        flags.append(
            "high_rain_disagreement"
        )

    if (
        max_temperature is not None
        and max_temperature > 3
    ):
        flags.append(
            "high_temperature_disagreement"
        )

    # ---------------------------------------------
    # Confidence label
    # ---------------------------------------------

    if confidence_score >= 70 and not flags:

        confidence = "high"

    elif confidence_score >= 40:

        confidence = "medium"

    else:

        confidence = "low"

    return {

        "generated_at": datetime.now(
            timezone.utc
        ).isoformat(),

        "models": models,

        "model_count": model_count,

        "days": days,

        "rain_probability_spread":
            max_rain,

        "temperature_spread":
            max_temperature,

        "wind_spread":
            max_wind,

        "rain_score":
            rain_score,

        "temperature_score":
            temperature_score,

        "wind_score":
            wind_score,

        "confidence_score":
            int(confidence_score),

        "confidence":
            confidence,

        "high_disagreement":
            bool(flags),

        "flags":
            flags,

        "thresholds": {

            "rain_probability_percent":
                20,

            "temperature_c":
                3,

        },

        "disclaimer": (
            "Model agreement is a confidence signal, "
            "not a guarantee of forecast accuracy. "
            "Follow official warnings for safety-critical "
            "decisions."
        ),
    }


def get_confidence_analysis(
    latitude,
    longitude,
    forecast_days=3,
    models=None,
):

    result = fetch_multi_model_forecasts(
        latitude,
        longitude,
        forecast_days,
        models
    )

    return compare_forecasts(result)


def build_confidence_ai_context(analysis):

    if not analysis:

        return (
            "No multi-model confidence "
            "analysis is available."
        )

    lines = [

        (
            "FORECAST CONFIDENCE: "
            f"{str(analysis.get('confidence', 'unknown')).upper()} "
            f"({analysis.get('confidence_score', 0)}%)"
        ),

        (
            "Models compared: "
            f"{analysis.get('model_count', 0)}"
        ),

        (
            "Maximum rain-probability spread: "
            f"{analysis.get('rain_probability_spread', 'N/A')} "
            "percentage points"
        ),

        (
            "Maximum temperature spread: "
            f"{analysis.get('temperature_spread', 'N/A')} °C"
        ),

        (
            "Maximum wind-speed spread: "
            f"{analysis.get('wind_spread', 'N/A')} km/h"
        ),

        (
            "High-disagreement flags: "
            f"{', '.join(analysis.get('flags') or []) or 'none'}"
        ),

    ]

    for day in (
        analysis.get("days") or []
    )[:3]:

        lines.append(

            f"{day.get('date')}: "
            f"rain spread={day.get('rain_spread')}pp, "
            f"temperature spread="
            f"{day.get('temperature_spread')}°C, "
            f"wind spread="
            f"{day.get('wind_spread')}km/h"

        )

    return "\n".join(lines)