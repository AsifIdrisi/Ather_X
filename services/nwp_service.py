"""Numerical Weather Prediction (NWP) service using NOAA GFS data."""
import requests

GFS_URL = "https://api.open-meteo.com/v1/gfs"

def get_gfs_forecast(latitude, longitude, forecast_days=7):
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code",
        "hourly": "temperature_2m,precipitation_probability,precipitation,wind_speed_10m,weather_code",
        "daily": "temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max",
        "timezone": "auto",
        "forecast_days": max(1, min(int(forecast_days), 16)),
    }
    response = requests.get(GFS_URL, params=params, timeout=20)
    response.raise_for_status()
    return response.json()
