"""Real-time MQTT ingestion status, model-fusion smart alerts, official IMD
warnings, and the combined `/alerts` endpoint used by the dashboard.
"""

import logging
import os
import time
from datetime import timezone

from flask import Blueprint, jsonify, request

from core.alert_helpers import _combine_weather_alerts, _get_imd_context
from core.perf import _record_perf
from services.alert_service import generate_weather_alerts, get_alert_summary
from services.imd_service import fetch_imd_warnings
from services.intelligence_service import build_model_summary
from services.location_service import reverse_geocode
from services.localization_service import localize_payload, normalize_language
from services.nwp_service import get_gfs_forecast
from services.smart_alert_service import build_smart_alert_package
from services.stream_ingestion import is_configured as mqtt_is_configured, recent_messages
from services.stream_intelligence import normalize_weather_message
from services.weather_service import get_weather
from services.localization_service import localize_payload, normalize_language
from services.wrf_service import get_wrf_forecast, is_configured as wrf_is_configured

logger = logging.getLogger(__name__)

alerts_bp = Blueprint("alerts", __name__)

@alerts_bp.route("/api/ingestion/status", methods=["GET"])
def ingestion_status():
    return jsonify({
        "mqtt": {
            "available": mqtt_is_configured(),
            "broker_configured": bool(os.getenv("MQTT_BROKER", "").strip()),
        },
        "wrf": {
            "configured": wrf_is_configured(),
        },
        "recent_messages": recent_messages(20),
    })
@alerts_bp.route("/api/ingestion/messages", methods=["GET"])
def ingestion_messages():
    try:
        limit = int(request.args.get("limit", "50"))
    except ValueError:
        limit = 50
    return jsonify({"messages": recent_messages(limit)})
@alerts_bp.route("/api/alerts/smart", methods=["GET", "POST"])
def smart_alerts():
    """Return a unified early-warning package for a supplied location."""
    _perf_started = time.perf_counter()
    _perf_ok = False
    try:
        data = request.get_json(silent=True) or {}
        latitude = data.get("latitude", request.args.get("latitude"))
        longitude = data.get("longitude", request.args.get("longitude"))
        language = normalize_language(data.get("language", request.args.get("language", "en")))
        if latitude is None or longitude is None:
            return jsonify({"error": "Latitude and longitude are required."}), 400
        latitude, longitude = float(latitude), float(longitude)
        location_details, imd_result = _get_imd_context(latitude, longitude)
        location_name = location_details.get("name") or reverse_geocode(latitude, longitude) or "Unknown Location"
        weather = get_weather(latitude, longitude)
        if not weather:
            return jsonify({"error": "Unable to fetch weather."}), 502
        base_alerts = generate_weather_alerts(weather, location_name)
        official_alerts = _combine_weather_alerts([], imd_result)
        model_summary = None
        if data.get("include_model_intelligence", True):
            try:
                gfs_data = get_gfs_forecast(latitude, longitude, 3)
                wrf_data = None
                if wrf_is_configured():
                    try:
                        wrf_data = get_wrf_forecast(latitude, longitude, 3)
                    except Exception as wrf_error:
                        logger.error("smart alert wrf warning: %s", wrf_error)
                model_summary = build_model_summary(weather, gfs_data, wrf_data)
            except Exception as model_error:
                logger.error("smart alert model warning: %s", model_error)
        package = build_smart_alert_package(base_alerts, official_alerts, model_summary, weather, location_name)
        package.update({"location_details": location_details, "imd": imd_result, "model_intelligence": model_summary})
        package = localize_payload(package, language)
        package["_localized_language"] = language
        _perf_ok = True
        return jsonify(package)
    except (TypeError, ValueError):
        return jsonify({"error": "Latitude and longitude must be valid numbers."}), 400
    except Exception as error:
        logger.error("smart alert route error: %s", error)
        return jsonify({"error": "Unable to build smart alerts."}), 500
    finally:
        _record_perf("/api/alerts/smart", _perf_started, _perf_ok)
@alerts_bp.route("/api/ingestion/intelligence", methods=["GET"])
def ingestion_intelligence():
    """Process recent MQTT observations into a lightweight alert feed."""
    _perf_started = time.perf_counter()
    _perf_ok = False
    try:
        limit = max(1, min(int(request.args.get("limit", "20")), 100))
        processed = []
        for item in recent_messages(limit):
            normalized = normalize_weather_message(item)
            if not normalized:
                continue
            alerts = generate_weather_alerts(normalized["weather"], normalized["location"])
            processed.append({
                "topic": normalized["topic"],
                "received_at": normalized["received_at"],
                "location": normalized["location"],
                "latitude": normalized["latitude"],
                "longitude": normalized["longitude"],
                "alerts": alerts,
                "alert_count": len(alerts),
            })
        processed.sort(key=lambda x: x["alert_count"], reverse=True)
        _perf_ok = True
        return jsonify({"source": "MQTT", "configured": mqtt_is_configured(), "processed_messages": len(processed), "items": processed, "generated_at": datetime.now(timezone.utc).isoformat()})
    except Exception as error:
        logger.error("ingestion intelligence error: %s", error)
        return jsonify({"error": "Unable to process ingestion intelligence."}), 500
    finally:
        _record_perf("/api/ingestion/intelligence", _perf_started, _perf_ok)
@alerts_bp.route("/api/imd/warnings", methods=["GET", "POST"])
def imd_warnings_route():
    try:
        data = request.get_json(silent=True) or {}
        if request.method == "GET":
            data = request.args.to_dict()

        district = data.get("district")
        city = data.get("city")
        state = data.get("state")
        district_id = data.get("district_id")
        force = str(data.get("force", "false")).lower() == "true"

        result = fetch_imd_warnings(
            district_id=district_id,
            district=district,
            city=city,
            state=state,
            force=force
        )

        return jsonify(result)

    except Exception as error:
        logger.error("imd route error: %s", error)
        return jsonify({
            "available": False,
            "warnings": [],
            "error": "Unable to load IMD warnings."
        }), 502
@alerts_bp.route(
    "/alerts",
    methods=["POST"]
)
def alerts():

    try:

        data = request.get_json()

        if not data:

            return jsonify({

                "error":
                    "Request data is missing"

            }), 400

        latitude = data.get(
            "latitude"
        )

        longitude = data.get(
            "longitude"
        )

        # CHECK LOCATION

        if (
            latitude is None
            or longitude is None
        ):

            return jsonify({

                "error":
                    "Location is required"

            }), 400

        # GET WEATHER

        weather_data = get_weather(

            latitude,
            longitude

        )

        if not weather_data:

            return jsonify({

                "error":
                    "Unable to fetch weather"

            }), 500

        # LOCATION

        location_name = reverse_geocode(

            latitude,
            longitude

        )

        # GENERATE ALERTS + OFFICIAL IMD WARNINGS

        location_details, imd_result = _get_imd_context(
            latitude,
            longitude
        )

        alert_list = generate_weather_alerts(
            weather_data,
            location_name
        )

        alert_list = _combine_weather_alerts(
            alert_list,
            imd_result
        )

        # SUMMARY

        summary = get_alert_summary(
            alert_list
        )

        payload = {

            "location":
                location_name,

            "location_details":
                location_details,

            "alerts":
                alert_list,

            "alert_summary":
                summary,

            "imd":
                imd_result

        }

        language = normalize_language(data.get("language") or request.args.get("language"))
        payload = localize_payload(payload, language)

        # RESPONSE

        return jsonify(payload)

    except Exception as error:

        logger.error("alert route error: %s", error)
        return jsonify({"error": "Unable to load weather alerts"}), 500