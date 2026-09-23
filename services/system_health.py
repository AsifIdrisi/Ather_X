import os
from datetime import datetime, timezone

def build_system_health(wrf_configured=False, mqtt_configured=False):
    openrouter = bool(os.getenv('OPENROUTER_API_KEY'))
    imd = bool(os.getenv('IMD_CAP_MESSAGES_URL'))
    weather = bool(os.getenv('WEATHER_API_URL', 'https://api.open-meteo.com/v1/forecast'))
    return {
        'status': 'ok',
        'timestamp_utc': datetime.now(timezone.utc).isoformat(),
        'services': {
            'weather_api': weather,
            'openrouter_ai': openrouter,
            'imd_warnings': imd,
            'wrf': bool(wrf_configured),
            'mqtt_ingestion': bool(mqtt_configured),
        },
        'environment': os.getenv('FLASK_ENV', 'development'),
    }
