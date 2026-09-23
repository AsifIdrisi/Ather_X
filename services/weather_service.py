"""Fetches current/hourly/daily weather and air quality from Open-Meteo."""

import logging

import requests

logger = logging.getLogger(__name__)

WEATHER_URL = "https://api.open-meteo.com/v1/forecast"
AIR_QUALITY_URL = "https://air-quality-api.open-meteo.com/v1/air-quality"

def get_weather(latitude, longitude):

    try:

        params = {
            "latitude": latitude,
            "longitude": longitude,
            "current": (
                "temperature_2m,relative_humidity_2m,apparent_temperature,"
                "precipitation,rain,weather_code,wind_speed_10m,wind_gusts_10m,visibility,cloud_cover,surface_pressure,uv_index"
            ),
            "hourly": (
                "temperature_2m,precipitation_probability,precipitation,rain,"
                "weather_code,wind_speed_10m,wind_gusts_10m,visibility,cloud_cover,surface_pressure,uv_index"
            ),
            "daily": (
                "weather_code,temperature_2m_max,temperature_2m_min,"
                "precipitation_probability_max,precipitation_sum,rain_sum,uv_index_max"
            ),
            "timezone": "auto",
            "forecast_days": 7
        }

        response = requests.get(
            WEATHER_URL,
            params=params,
            timeout=15
        )

        response.raise_for_status()

        data = response.json()

        current = data.get("current", {})
        daily = data.get("daily", {})
        hourly = data.get("hourly", {})

        # Air quality is fetched separately because Open-Meteo exposes it
        # through the dedicated air-quality endpoint.
        air_quality = {}
        try:
            aq_response = requests.get(
                AIR_QUALITY_URL,
                params={
                    "latitude": latitude,
                    "longitude": longitude,
                    "current": "us_aqi,pm2_5,pm10",
                    "hourly": "us_aqi,pm2_5,pm10",
                    "timezone": "auto",
                    "forecast_days": 2
                },
                timeout=15
            )
            aq_response.raise_for_status()
            air_quality = aq_response.json()
        except requests.RequestException as aq_error:
            logger.warning("air quality API error: %s", aq_error)
        
        weather = {
            "temperature": current.get("temperature_2m"),
            "feels_like": current.get("apparent_temperature"),
            "humidity": current.get("relative_humidity_2m"),
            "wind_speed": current.get("wind_speed_10m"),
            "wind_gusts": current.get("wind_gusts_10m"),
            "visibility": current.get("visibility"),
            "cloud_cover": current.get("cloud_cover"),
            "surface_pressure": current.get("surface_pressure"),
            "uv_index": current.get("uv_index"),
            "rain": current.get("rain", 0),
            "precipitation": current.get("precipitation", 0),
            "weather_code": current.get("weather_code"),

            # Source information
            "source": "Open-Meteo",
            "timezone": data.get("timezone"),
            "updated_at": current.get("time"),

            "forecast": [],
            "hourly_forecast": []
        }
        
        hourly_times = hourly.get("time", [])
        hourly_temperature = hourly.get("temperature_2m", [])
        hourly_rain_probability = hourly.get(
            "precipitation_probability", []
        )
        hourly_precipitation = hourly.get(
            "precipitation", []
        )
        hourly_rain = hourly.get("rain", [])
        hourly_weather_codes = hourly.get(
            "weather_code", []
        )
        hourly_wind = hourly.get(
            "wind_speed_10m", []
        )
        hourly_gusts = hourly.get("wind_gusts_10m", [])
        hourly_visibility = hourly.get("visibility", [])
        hourly_cloud = hourly.get("cloud_cover", [])
        hourly_pressure = hourly.get("surface_pressure", [])
        hourly_uv = hourly.get("uv_index", [])

        for i, time in enumerate(hourly_times):

            weather["hourly_forecast"].append({

                "time": time,

                "temperature":
                    hourly_temperature[i]
                    if i < len(hourly_temperature)
                    else None,

                "rain_probability":
                    hourly_rain_probability[i]
                    if i < len(hourly_rain_probability)
                    else None,

                "precipitation":
                    hourly_precipitation[i]
                    if i < len(hourly_precipitation)
                    else None,

                "rain":
                    hourly_rain[i]
                    if i < len(hourly_rain)
                    else None,

                "weather_code":
                    hourly_weather_codes[i]
                    if i < len(hourly_weather_codes)
                    else None,

                "wind_speed":
                    hourly_wind[i]
                    if i < len(hourly_wind)
                    else None,

                "wind_gusts": hourly_gusts[i] if i < len(hourly_gusts) else None,
                "visibility": hourly_visibility[i] if i < len(hourly_visibility) else None,
                "cloud_cover": hourly_cloud[i] if i < len(hourly_cloud) else None,
                "surface_pressure": hourly_pressure[i] if i < len(hourly_pressure) else None,

                "uv_index":
                    hourly_uv[i]
                    if i < len(hourly_uv)
                    else None
            })

        dates = daily.get("time", [])

        max_temp = daily.get(
            "temperature_2m_max", []
        )

        min_temp = daily.get(
            "temperature_2m_min", []
        )

        rain_probability = daily.get(
            "precipitation_probability_max", []
        )

        weather_codes = daily.get(
            "weather_code", []
        )

        precipitation_sum = daily.get(
            "precipitation_sum", []
        )

        rain_sum = daily.get(
            "rain_sum", []
        )

        uv_index_max = daily.get("uv_index_max", [])

        for i, date in enumerate(dates):

            weather["forecast"].append({

                "date": date,

                "max_temp":
                    max_temp[i]
                    if i < len(max_temp)
                    else None,

                "min_temp":
                    min_temp[i]
                    if i < len(min_temp)
                    else None,

                "rain_probability":
                    rain_probability[i]
                    if i < len(rain_probability)
                    else None,

                "weather_code":
                    weather_codes[i]
                    if i < len(weather_codes)
                    else None,

                "precipitation_sum":
                    precipitation_sum[i]
                    if i < len(precipitation_sum)
                    else None,

                "rain_sum":
                    rain_sum[i]
                    if i < len(rain_sum)
                    else None,

                "uv_index_max":
                    uv_index_max[i]
                    if i < len(uv_index_max)
                    else None

            })

        aq_current = air_quality.get("current", {})
        weather["air_quality"] = {
            "us_aqi": aq_current.get("us_aqi"),
            "pm2_5": aq_current.get("pm2_5"),
            "pm10": aq_current.get("pm10"),
            "source": "Open-Meteo Air Quality"
        }

        return weather

    except requests.RequestException as error:
        logger.error("weather API error: %s", error)
        return None