"""Generates human-readable weather alerts from raw weather data."""

# Severity levels
SEVERITY_PRIORITY = {
    "green": 0,
    "yellow": 1,
    "orange": 2,
    "red": 3
}

def create_alert(
    level,
    title,
    message,
    location="Unknown Location"
):
    """
    Create a standardized WeatherGPT alert.
    """

    return {
        "level": level,
        "severity": level,
        "title": title,
        "message": message,
        "location": location,
        "source": "WeatherGPT Weather Rules"
    }

# Generate Weather Alerts
def generate_weather_alerts(
    weather_data,
    location="Unknown Location"
):

    alerts = []

    if not weather_data:
        return alerts

    temperature = weather_data.get("temperature")
    feels_like = weather_data.get("feels_like")
    humidity = weather_data.get("humidity")
    wind_speed = weather_data.get("wind_speed")
    rain = weather_data.get("rain")

    forecast = weather_data.get(
        "forecast",
        []
    )

    # EXTREME HEAT

    if temperature is not None:

        try:
            temperature = float(temperature)

            if temperature >= 45:

                alerts.append(
                    create_alert(
                        "red",
                        "Extreme Heat",
                        f"Extreme temperature of "
                        f"{temperature:.1f}°C detected in "
                        f"{location}.",
                        location
                    )
                )

            elif temperature >= 40:

                alerts.append(
                    create_alert(
                        "orange",
                        "Very High Temperature",
                        f"Very high temperature of "
                        f"{temperature:.1f}°C detected in "
                        f"{location}.",
                        location
                    )
                )

            elif temperature >= 35:

                alerts.append(
                    create_alert(
                        "yellow",
                        "High Temperature",
                        f"High temperature of "
                        f"{temperature:.1f}°C is being observed "
                        f"in {location}.",
                        location
                    )
                )

        except (TypeError, ValueError):
            pass

    # HIGH HUMIDITY

    if humidity is not None:

        try:
            humidity = float(humidity)

            if humidity >= 90:

                alerts.append(
                    create_alert(
                        "yellow",
                        "Very High Humidity",
                        f"Humidity is currently "
                        f"{humidity:.0f}% in {location}.",
                        location
                    )
                )

        except (TypeError, ValueError):
            pass

    # STRONG WIND

    if wind_speed is not None:

        try:
            wind_speed = float(wind_speed)

            if wind_speed >= 60:

                alerts.append(
                    create_alert(
                        "red",
                        "Very Strong Wind",
                        f"Very strong winds of "
                        f"{wind_speed:.1f} km/h detected "
                        f"in {location}.",
                        location
                    )
                )

            elif wind_speed >= 40:

                alerts.append(
                    create_alert(
                        "orange",
                        "Strong Wind",
                        f"Strong winds of "
                        f"{wind_speed:.1f} km/h are being "
                        f"observed in {location}.",
                        location
                    )
                )

        except (TypeError, ValueError):
            pass

    # CURRENT RAIN

    if rain is not None:

        try:
            rain = float(rain)

            if rain >= 20:

                alerts.append(
                    create_alert(
                        "orange",
                        "Heavy Rain",
                        f"Heavy rainfall is currently "
                        f"being recorded in {location}.",
                        location
                    )
                )

            elif rain > 0:

                alerts.append(
                    create_alert(
                        "green",
                        "Rain Detected",
                        f"Rain is currently being recorded "
                        f"in {location}.",
                        location
                    )
                )

        except (TypeError, ValueError):
            pass

    # FORECAST RAIN

    for day in forecast[:7]:

        rain_probability = day.get(
            "rain_probability"
        )

        if rain_probability is None:
            continue

        try:
            rain_probability = float(
                rain_probability
            )
        except (TypeError, ValueError):
            continue

        if rain_probability >= 90:

            alerts.append(
                create_alert(
                    "orange",
                    "Very High Rain Probability",
                    f"There is a "
                    f"{rain_probability:.0f}% chance "
                    f"of rain on "
                    f"{day.get('date', 'an upcoming day')}.",
                    location
                )
            )

        elif rain_probability >= 80:

            alerts.append(
                create_alert(
                    "yellow",
                    "High Rain Probability",
                    f"There is a "
                    f"{rain_probability:.0f}% chance "
                    f"of rain on "
                    f"{day.get('date', 'an upcoming day')}.",
                    location
                )
            )

    # FEELS-LIKE TEMPERATURE

    if (
        feels_like is not None
        and temperature is not None
    ):

        try:

            difference = (
                float(feels_like)
                - float(temperature)
            )

            if difference >= 5:

                alerts.append(
                    create_alert(
                        "yellow",
                        "Feels Much Warmer",
                        f"It feels about "
                        f"{difference:.1f}°C warmer "
                        f"than the actual temperature "
                        f"in {location}.",
                        location
                    )
                )

        except (
            TypeError,
            ValueError
        ):
            pass

    return alerts

# Alert Summary
def get_alert_summary(alerts):

    if not alerts:

        return {
            "has_alerts": False,
            "count": 0,
            "highest_level": "green"
        }

    highest_level = "green"

    for alert in alerts:

        level = alert.get(
            "level",
            "green"
        ).lower()

        if (
            SEVERITY_PRIORITY.get(
                level,
                0
            )
            >
            SEVERITY_PRIORITY.get(
                highest_level,
                0
            )
        ):

            highest_level = level

    return {
        "has_alerts": True,
        "count": len(alerts),
        "highest_level": highest_level
    }