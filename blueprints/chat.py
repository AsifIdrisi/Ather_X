"""Conversational AI chat endpoint and the smart-recommendations route.

This is the WeatherGPT "brain": it resolves the user's location and
intent, pulls in live weather + official warnings + model-fusion
context, and asks the AI service to turn all of that into a reply.
"""

import logging
import time

from flask import Blueprint, jsonify, request

from core.alert_helpers import _combine_weather_alerts, _get_imd_context
from core.perf import _record_perf
from services.ai_service import ask_ai
from services.localization_service import localize_payload, localize_text, translate_texts, translate_texts_from, normalize_language
from services.alert_service import generate_weather_alerts
from services.intelligence_service import build_ai_context, build_model_summary
from services.confidence_service import build_confidence_ai_context, get_confidence_analysis
from services.intent_service import analyze_query
from services.location_service import reverse_geocode
from services.nwp_service import get_gfs_forecast
from services.weather_service import get_weather
from services.wrf_service import get_wrf_forecast, is_configured as wrf_is_configured

logger = logging.getLogger(__name__)

chat_bp = Blueprint("chat", __name__)



@chat_bp.route(
    "/api/translate",
    methods=["POST"]
)
def translate_endpoint():
    """Translate a single text for the selected app language."""
    try:
        data = request.get_json() or {}
        text = data.get("text", "")
        language = str(data.get("language", "en"))
        source_language = str(data.get("source_language", "en"))
        if not text:
            return jsonify({"text": ""})
        translated = translate_texts_from([text], normalize_language(language), normalize_language(source_language))[0]
        return jsonify({"text": translated})
    except Exception as error:
        logger.error("translate route error: %s", error)
        return jsonify({"text": request.get_json(silent=True).get("text", "") if request.is_json else ""}), 200


@chat_bp.route(
    "/api/translate-batch",
    methods=["POST"]
)
def translate_batch_endpoint():
    """Translate multiple strings while keeping order and count."""
    try:
        data = request.get_json() or {}
        texts = data.get("texts") or []
        language = str(data.get("language", "en"))
        source_language = str(data.get("source_language", "en"))
        if not isinstance(texts, list):
            return jsonify({"texts": []}), 400
        translated = translate_texts_from(texts, normalize_language(language), normalize_language(source_language))
        return jsonify({"texts": translated})
    except Exception as error:
        logger.error("translate-batch route error: %s", error)
        texts = (request.get_json(silent=True) or {}).get("texts") or []
        return jsonify({"texts": texts}), 200

@chat_bp.route(
    "/chat",
    methods=["POST"]
)
def chat():

    _perf_started = time.perf_counter()
    _perf_ok = False
    try:

        data = request.get_json()

        if not data:

            return jsonify({

                "reply":
                    localize_text("Invalid request.", data.get("language", "en") if isinstance(data, dict) else "en")

            }), 400

        message = data.get(
            "message",
            ""
        )

        
        language = data.get(
            "language",
            "en"
        )

        location = data.get(
           "location"
        )
        # Support direct latitude/longitude from /chat request
        if not location:
            if (
                data.get("latitude") is not None
                and data.get("longitude") is not None
            ):
                location = {
                    "latitude": data.get("latitude"),
                    "longitude": data.get("longitude")
                }

        # CHECK MESSAGE

        if not message:

            return jsonify({

                "reply":
                    localize_text("Please enter a message.", language)

            }), 400

        # QUERY UNDERSTANDING

        query_info = analyze_query(message)

        logger.debug("query analysis: %s", query_info)

        weather_data = None
        location_name = "Unknown Location"
        location_details = {}
        imd_result = {
            "available": True,
            "mode": "WIS2_CAP",
            "warnings": [],
            "error": None,
            "source": "India Meteorological Department WIS2 CAP"
        }

        # GET LOCATION WEATHER

        if location:

            latitude = location.get(
                "latitude"
            )

            longitude = location.get(
                "longitude"
            )

            if (
                latitude is not None
                and longitude is not None
            ):

                # WEATHER

                weather_data = get_weather(

                    latitude,
                    longitude

                )

                # LOCATION + OFFICIAL IMD WARNINGS

                location_details, imd_result = _get_imd_context(
                    latitude,
                    longitude
                )

                location_name = location_details.get(
                    "name",
                    reverse_geocode(latitude, longitude)
                )

        # GENERATE ALERTS FOR AI

        alerts_data = []

        if weather_data:

            alerts_data = generate_weather_alerts(
                weather_data,
                location_name
            )

            alerts_data = _combine_weather_alerts(
                alerts_data,
                imd_result
            )

        # OPTIONAL NWP MODEL CONTEXT

        model_summary = None
        confidence_analysis = None
        if weather_data and location:
            try:
                confidence_analysis = get_confidence_analysis(
                    float(location.get("latitude")),
                    float(location.get("longitude")),
                    3
                )
                weather_data = dict(weather_data)
                weather_data["forecast_confidence"] = build_confidence_ai_context(confidence_analysis)
            except Exception as confidence_error:
                logger.error("forecast confidence chat context error: %s", confidence_error)

            from services.ai_service import _needs_model_intelligence 
            wants_model_intel = (
                        data.get("include_model_intelligence", False)
                        or _needs_model_intelligence(message.lower())
                    )

        if weather_data and wants_model_intel:            
            try:
                gfs_data = None
                if confidence_analysis:
                    for resp in confidence_analysis.get("responses", []):
                        if resp.get("model") == "gfs_seamless":
                            gfs_data = resp.get("payload")
                            break
                if gfs_data is None:
                    gfs_data = get_gfs_forecast(
                        float(location.get("latitude")),
                        float(location.get("longitude")),
                        3
                    )
                wrf_data = None
                if wrf_is_configured():
                    try:
                        wrf_data = get_wrf_forecast(
                            float(location.get("latitude")),
                            float(location.get("longitude")),
                            3
                        )
                    except Exception as wrf_error:
                        logger.error("wrf chat context error: %s", wrf_error)
                model_summary = build_model_summary(weather_data, gfs_data, wrf_data)
                model_context = build_ai_context(model_summary)
                weather_data = dict(weather_data)
                weather_data["model_intelligence"] = model_context
            except Exception as model_error:
                logger.error("model intelligence error: %s", model_error)

        # AI RESPONSE

        reply = ask_ai(

            message=message,

            weather_data=weather_data,
            
            alerts=alerts_data,

            location=location_name,

            language=language

        )

        # RESPONSE

        _perf_ok = True
        return jsonify({

            "reply":
                reply,

            "_localized_language": normalize_language(language),

            "location":
                location_name,

            "alerts":
                alerts_data,

            "location_details":
                location_details,

            "imd":
                imd_result,
                
            "query_info": 
                query_info,

            "model_intelligence":
                model_summary,

            "forecast_confidence":
                confidence_analysis

        })

    except Exception as error:

        logger.error("chat route error: %s", error)
        language = (data or {}).get("language", "en") if isinstance(data, dict) else "en"
        return jsonify({"reply": localize_text("Sorry, something went wrong.", language)}), 500
    finally:
        _record_perf("/chat", _perf_started, _perf_ok)
@chat_bp.route(
    "/recommendations",
    methods=["POST"]
)
def recommendations():

    try:
        data = request.get_json() or {}
        weather_data = data.get("weather") or {}
        language = data.get("language", "en")
        location_name = data.get("location", "your location")

        if not weather_data:
            return jsonify({"error": "Weather data is required"}), 400

        current_temp = weather_data.get("temperature")
        humidity = weather_data.get("humidity")
        wind = weather_data.get("wind_speed")
        forecast = weather_data.get("forecast") or []
        hourly = weather_data.get("hourly_forecast") or []

        def num(value, default=0):
            try:
                return float(value)
            except (TypeError, ValueError):
                return default

        temp = num(current_temp, 25)
        hum = num(humidity, 0)
        wind_speed = num(wind, 0)
        next_hours = hourly[:24]
        rain_probs = [num(h.get("rain_probability"), 0) for h in next_hours]
        rain_values = [num(h.get("precipitation"), 0) for h in next_hours]
        max_rain_prob = max(rain_probs, default=0)
        total_rain = sum(max(0, value) for value in rain_values)

        if temp >= 40:
            outfit = ("Light, breathable cotton clothes", "Very hot conditions; avoid heavy layers and direct sun.")
        elif temp >= 30:
            outfit = ("Light clothes and comfortable footwear", "Warm conditions are expected.")
        elif temp <= 15:
            outfit = ("Warm layers or a light jacket", "Cool temperatures are expected.")
        else:
            outfit = ("Comfortable everyday clothes", "Temperatures look moderate.")

        if max_rain_prob >= 70 or total_rain >= 2:
            umbrella = ("Carry an umbrella", f"Rain probability reaches {max_rain_prob:.0f}% in the next 24 hours.")
            outdoor = ("Prefer flexible or indoor plans", "Rain may affect outdoor activities.")
        elif max_rain_prob >= 40:
            umbrella = ("Keep a compact umbrella nearby", "There is a moderate chance of rain.")
            outdoor = ("Outdoor plans are okay, but keep a backup plan", "Some rain risk is present.")
        else:
            umbrella = ("Umbrella not essential", "Low rain risk is expected in the next 24 hours.")
            outdoor = ("Good for outdoor activities", "Rain risk is currently low.")

        if wind_speed >= 40:
            travel = ("Use extra caution while travelling", f"Wind speed is around {wind_speed:.0f} km/h.")
        elif hum >= 85 and temp >= 30:
            travel = ("Plan breaks and stay hydrated", "Warm and humid conditions may feel uncomfortable.")
        else:
            travel = ("Normal travel plans look reasonable", "No major weather-related travel concern is indicated by the current data.")

        if language == "hi":
            cards = [
                {"type": "outfit", "title": "Outfit", "recommendation": outfit[0], "reason": outfit[1]},
                {"type": "outdoor", "title": "Outdoor Activity", "recommendation": outdoor[0], "reason": outdoor[1]},
                {"type": "travel", "title": "Travel", "recommendation": travel[0], "reason": travel[1]},
                {"type": "umbrella", "title": "Rain Gear", "recommendation": umbrella[0], "reason": umbrella[1]}
            ]
        else:
            cards = [
                {"type": "outfit", "title": "Outfit", "recommendation": outfit[0], "reason": outfit[1]},
                {"type": "outdoor", "title": "Outdoor Activity", "recommendation": outdoor[0], "reason": outdoor[1]},
                {"type": "travel", "title": "Travel", "recommendation": travel[0], "reason": travel[1]},
                {"type": "umbrella", "title": "Rain Gear", "recommendation": umbrella[0], "reason": umbrella[1]}
            ]

        return jsonify({
            "location": location_name,
            "recommendations": cards,
            "summary": f"Recommendations are based on current conditions and the next 24 hours forecast for {location_name}.",
            "metrics": {
                "temperature": current_temp,
                "humidity": humidity,
                "wind_speed": wind,
                "max_rain_probability": max_rain_prob,
                "next_24h_precipitation": total_rain
            }
        })

    except Exception as error:
        logger.error("recommendations route error: %s", error)
        return jsonify({"error": "Unable to generate recommendations"}), 500