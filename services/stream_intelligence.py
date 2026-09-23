"""Convert MQTT meteorological messages into WeatherGPT alert inputs."""

def _num(payload, *keys):
    for key in keys:
        value = payload.get(key)
        if value is not None:
            try:
                return float(value)
            except (TypeError, ValueError):
                pass
    return None

def normalize_weather_message(item):
    """Best-effort normalisation of common MQTT weather message formats."""
    if not isinstance(item, dict):
        return None
    payload = item.get("payload", item)
    if not isinstance(payload, dict):
        return None
    current = payload.get("current") if isinstance(payload.get("current"), dict) else payload
    location = payload.get("location") if isinstance(payload.get("location"), dict) else {}
    return {
        "topic": item.get("topic"),
        "received_at": item.get("received_at"),
        "location": payload.get("location_name") or location.get("name") or "Stream Location",
        "latitude": _num(payload, "latitude", "lat") if payload.get("latitude", payload.get("lat")) is not None else _num(location, "latitude", "lat"),
        "longitude": _num(payload, "longitude", "lon", "lng") if any(payload.get(k) is not None for k in ("longitude", "lon", "lng")) else _num(location, "longitude", "lon", "lng"),
        "weather": {
            "temperature": _num(current, "temperature", "temperature_2m", "temp", "t2"),
            "humidity": _num(current, "humidity", "relative_humidity_2m", "rh"),
            "wind_speed": _num(current, "wind_speed", "wind_speed_10m", "wind", "ws10"),
            "rain": _num(current, "rain", "precipitation", "rainfall", "precip"),
            "feels_like": _num(current, "feels_like", "apparent_temperature"),
            "forecast": payload.get("forecast") if isinstance(payload.get("forecast"), list) else [],
            "source": "MQTT stream",
        },
    }
