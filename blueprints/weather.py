"""Core weather data, historical climate stats, model-fusion intelligence,
and the domain-specific advisory routes (marine, disaster, agriculture,
aviation, urban).
"""

import time
from datetime import timezone

import requests
from flask import Blueprint, jsonify, render_template, request

from core.alert_helpers import _combine_weather_alerts, _get_imd_context
from core.perf import PERF_METRICS, PERF_STARTED_AT, _record_perf
from services.agriculture_service import CROP_PROFILES, SOILS, STAGES, generate_agriculture_advisory
from services.alert_service import generate_weather_alerts, get_alert_summary
from services.aviation_service import generate_aviation_advisory
from services.disaster_service import analyze_disaster_risk
from services.intelligence_service import build_model_summary
from services.confidence_service import get_confidence_analysis
from services.hazard_warning_service import generate_hazard_warnings
from services.location_service import reverse_geocode, reverse_geocode_details
from services.marine_service import generate_marine_advisory
from services.nwp_service import get_gfs_forecast
from services.stream_ingestion import is_configured as mqtt_is_configured
from services.system_health import build_system_health
from services.urban_service import generate_urban_advisory
from services.weather_service import get_weather
from services.wrf_service import get_wrf_forecast, is_configured as wrf_is_configured
from services.localization_service import localize_payload, localize_text, normalize_language
import logging

logger = logging.getLogger(__name__)

weather_bp = Blueprint("weather", __name__)

@weather_bp.route("/")
def home():

    return render_template(
        "index.html"
    )
@weather_bp.route("/api/system/health", methods=["GET"])
def system_health():
    return jsonify(build_system_health(
        wrf_configured=wrf_is_configured(),
        mqtt_configured=mqtt_is_configured(),
    ))
@weather_bp.route("/api/performance", methods=["GET"])
def performance_metrics():
    uptime_seconds = round(time.perf_counter() - PERF_STARTED_AT, 1)
    routes = {}
    for route, samples in PERF_METRICS["route_latency_ms"].items():
        routes[route] = {
            "count": PERF_METRICS["route_counts"].get(route, 0),
            "last_ms": samples[-1] if samples else None,
            "avg_ms": round(sum(samples) / len(samples), 1) if samples else None,
            "min_ms": min(samples) if samples else None,
            "max_ms": max(samples) if samples else None,
        }
    total = PERF_METRICS["requests"]
    success_rate = round((PERF_METRICS["success"] / total) * 100, 1) if total else None
    return jsonify({
        "mode": "live_session",
        "uptime_seconds": uptime_seconds,
        "requests": total,
        "success": PERF_METRICS["success"],
        "errors": PERF_METRICS["errors"],
        "success_rate": success_rate,
        "routes": routes,
        "accuracy": {
            "available": False,
            "message": "Accuracy requires reference/observed observations; no accuracy percentage is fabricated."
        }
    })
@weather_bp.route("/api/climate-history", methods=["GET"])
def climate_history():
    """Return yearly historical weather statistics for a location."""
    try:
        latitude = float(request.args.get("latitude", ""))
        longitude = float(request.args.get("longitude", ""))
        current_year = time.gmtime().tm_year
        default_end = current_year - 1
        start_year = int(request.args.get("start_year", default_end - 9))
        end_year = int(request.args.get("end_year", default_end))

        if not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
            return jsonify({"error": "Invalid coordinates."}), 400
        if start_year < 1940 or end_year > default_end or start_year > end_year:
            return jsonify({"error": f"Choose years from 1940 to {default_end}."}), 400
        if end_year - start_year > 30:
            return jsonify({"error": "Historical range cannot exceed 30 years."}), 400

        import requests
        response = requests.get(
            "https://archive-api.open-meteo.com/v1/archive",
            params={
                "latitude": latitude,
                "longitude": longitude,
                "start_date": f"{start_year}-01-01",
                "end_date": f"{end_year}-12-31",
                "daily": "temperature_2m_mean,temperature_2m_max,temperature_2m_min,precipitation_sum",
                "timezone": "auto"
            },
            timeout=25
        )
        response.raise_for_status()
        data = response.json()
        daily = data.get("daily", {})
        dates = daily.get("time", [])
        mean_t = daily.get("temperature_2m_mean", [])
        max_t = daily.get("temperature_2m_max", [])
        min_t = daily.get("temperature_2m_min", [])
        precip = daily.get("precipitation_sum", [])

        yearly = {}
        for i, date in enumerate(dates):
            year = int(date[:4])
            bucket = yearly.setdefault(year, {"temps": [], "max": [], "min": [], "precip": []})
            if i < len(mean_t) and mean_t[i] is not None:
                bucket["temps"].append(float(mean_t[i]))
            if i < len(max_t) and max_t[i] is not None:
                bucket["max"].append(float(max_t[i]))
            if i < len(min_t) and min_t[i] is not None:
                bucket["min"].append(float(min_t[i]))
            if i < len(precip) and precip[i] is not None:
                bucket["precip"].append(float(precip[i]))

        records = []
        for year in range(start_year, end_year + 1):
            b = yearly.get(year, {})
            temps = b.get("temps", [])
            records.append({
                "year": year,
                "avg_temperature": round(sum(temps) / len(temps), 2) if temps else None,
                "max_temperature": round(max(b.get("max", [])), 2) if b.get("max") else None,
                "min_temperature": round(min(b.get("min", [])), 2) if b.get("min") else None,
                "total_precipitation": round(sum(b.get("precip", [])), 2) if b.get("precip") else None
            })

        valid_temp = [r for r in records if r["avg_temperature"] is not None]
        valid_rain = [r for r in records if r["total_precipitation"] is not None]

        def trend(values):
            if len(values) < 2:
                return {"direction": "insufficient data", "change_per_year": None}
            xs = list(range(len(values)))
            xbar = sum(xs) / len(xs)
            ybar = sum(values) / len(values)
            denom = sum((x - xbar) ** 2 for x in xs)
            slope = sum((x - xbar) * (y - ybar) for x, y in zip(xs, values)) / denom if denom else 0
            if slope > 0.05:
                direction = "increasing"
            elif slope < -0.05:
                direction = "decreasing"
            else:
                direction = "stable"
            return {"direction": direction, "change_per_year": round(slope, 3)}

        temp_values = [r["avg_temperature"] for r in valid_temp]
        rain_values = [r["total_precipitation"] for r in valid_rain]
        return jsonify({
            "source": "Open-Meteo Historical Archive",
            "timezone": data.get("timezone"),
            "latitude": latitude,
            "longitude": longitude,
            "start_year": start_year,
            "end_year": end_year,
            "records": records,
            "summary": {
                "average_temperature": round(sum(temp_values) / len(temp_values), 2) if temp_values else None,
                "average_annual_precipitation": round(sum(rain_values) / len(rain_values), 2) if rain_values else None,
                "temperature_trend": trend(temp_values),
                "precipitation_trend": trend(rain_values)
            }
        })
    except ValueError:
        return jsonify({"error": "Latitude, longitude, and years must be valid numbers."}), 400
    except requests.RequestException as error:
        logger.error("climate history api error: %s", error)
        return jsonify({"error": "Historical weather data is temporarily unavailable."}), 502
    except Exception as error:
        logger.error("climate history error: %s", error)
        return jsonify({"error": "Unable to load historical climate data."}), 500
@weather_bp.route(
    "/weather",
    methods=["POST"]
)
def weather():

    _perf_started = time.perf_counter()
    _perf_ok = False
    try:

        data = request.get_json()

        language = normalize_language((data or {}).get("language", "en"))

        if not data:

            return jsonify({
                "error": "Request data is missing"
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
                "error": "Location is required"
            }), 400

        # GET WEATHER

        weather_data = get_weather(
            latitude,
            longitude
        )

        if not weather_data:

            return jsonify({
                "error": "Unable to fetch weather"
            }), 500

        # GET LOCATION NAME

        location_name = reverse_geocode(
            latitude,
            longitude
        )

        # GENERATE WEATHER ALERTS + OFFICIAL IMD WARNINGS

        location_details, imd_result = _get_imd_context(
            latitude,
            longitude
        )

        alerts = generate_weather_alerts(
            weather_data,
            location_name
        )

        alerts = _combine_weather_alerts(
            alerts,
            imd_result
        )

        # ALERT SUMMARY + DISASTER INTELLIGENCE

        alert_summary = get_alert_summary(
            alerts
        )

        disaster_intelligence = analyze_disaster_risk(
            weather_data,
            imd_result,
            location_name
        )

        hazard_warnings = generate_hazard_warnings(
            weather_data,
            imd_result,
            location_name
        )

        aviation_advisory = generate_aviation_advisory(
            weather_data,
            imd_result,
            location_name
        )
        try:
            marine_advisory = generate_marine_advisory(
                latitude, longitude, location_name, imd_result
            )
        except Exception as marine_error:
            logger.error("marine advisory warning: %s", marine_error)
            marine_advisory = None

        agriculture_advisory = generate_agriculture_advisory(
            weather_data,
            crop="wheat",
            stage="Not specified",
            soil_type="Not specified",
            location=location_name
        )

        urban_advisory = generate_urban_advisory(
            weather_data,
            imd_result,
            location_name
        )

        # RESPONSE

        _perf_ok = True
        payload = {
            "location": location_name,
            "location_details": location_details,
            "weather": weather_data,
            "alerts": alerts,
            "alert_summary": alert_summary,
            "imd": imd_result,
            "disaster_intelligence": disaster_intelligence,
            "hazard_warnings": hazard_warnings,
            "agriculture_advisory": agriculture_advisory,
            "aviation_advisory": aviation_advisory,
            "marine_advisory": marine_advisory,
            "urban_advisory": urban_advisory,
        }
        payload = localize_payload(payload, language)
        payload["_localized_language"] = language
        return jsonify(payload)

    except Exception as error:

        logger.error("weather route error: %s", error)
        return jsonify({"error": "Something went wrong"}), 500
    finally:
        _record_perf("/weather", _perf_started, _perf_ok)
@weather_bp.route("/api/marine-advisory", methods=["GET", "POST"])
def marine_advisory_route():
    try:
        data = request.get_json(silent=True) or {}
        if request.method == "GET":
            data = request.args.to_dict()
        language = normalize_language(data.get("language", "en"))
        latitude = float(data.get("latitude"))
        longitude = float(data.get("longitude"))
        if not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
            return jsonify({"error": "Invalid coordinates."}), 400
        weather_data = get_weather(latitude, longitude)
        location_details, imd_result = _get_imd_context(latitude, longitude)
        location_name = (location_details or {}).get("name") or reverse_geocode(latitude, longitude) or "Selected Location"
        advisory = generate_marine_advisory(latitude, longitude, location_name, imd_result)
        payload = {"location": location_name, "location_details": location_details, "marine_advisory": advisory, "imd": imd_result}
        payload = localize_payload(payload, language); payload["_localized_language"] = language
        return jsonify(payload)
    except (TypeError, ValueError):
        return jsonify({"error": "Latitude and longitude must be valid numbers."}), 400
    except Exception as error:
        logger.error("marine advisory error: %s", error)
        return jsonify({"error": "Unable to generate marine advisory."}), 500
@weather_bp.route("/api/hazard-warnings", methods=["GET", "POST"])
def hazard_warnings_route():
    try:
        data = request.get_json(silent=True) or {}
        if request.method == "GET":
            data = request.args.to_dict()
        language = normalize_language(data.get("language", "en"))

        latitude = data.get("latitude")
        longitude = data.get("longitude")
        if latitude is None or longitude is None:
            return jsonify({"error": "Latitude and longitude are required."}), 400

        latitude = float(latitude)
        longitude = float(longitude)
        if not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
            return jsonify({"error": "Invalid coordinates."}), 400

        weather_data = get_weather(latitude, longitude)
        if not weather_data:
            return jsonify({"error": "Unable to fetch weather data."}), 502

        location_details, imd_result = _get_imd_context(latitude, longitude)
        location_name = (location_details or {}).get("name") or reverse_geocode(latitude, longitude) or "Selected Location"
        result = generate_hazard_warnings(weather_data, imd_result, location_name)
        payload = {"location": location_name, "location_details": location_details, "hazard_warnings": result, "imd": imd_result}
        payload = localize_payload(payload, language); payload["_localized_language"] = language
        return jsonify(payload)
    except ValueError:
        return jsonify({"error": "Latitude and longitude must be valid numbers."}), 400
    except Exception as error:
        logger.error("hazard warnings error: %s", error)
        return jsonify({"error": "Unable to calculate flood and cyclone warnings."}), 500

@weather_bp.route("/api/disaster-intelligence", methods=["GET", "POST"])
def disaster_intelligence_route():
    try:
        data = request.get_json(silent=True) or {}
        if request.method == "GET":
            data = request.args.to_dict()
        language = normalize_language(data.get("language", "en"))

        latitude = data.get("latitude")
        longitude = data.get("longitude")
        if latitude is None or longitude is None:
            return jsonify({"error": "Latitude and longitude are required."}), 400

        latitude = float(latitude)
        longitude = float(longitude)
        if not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
            return jsonify({"error": "Invalid coordinates."}), 400

        weather_data = get_weather(latitude, longitude)
        if not weather_data:
            return jsonify({"error": "Unable to fetch weather data."}), 502

        location_details, imd_result = _get_imd_context(latitude, longitude)
        location_name = (location_details or {}).get("name") or reverse_geocode(latitude, longitude) or "Selected Location"
        result = analyze_disaster_risk(weather_data, imd_result, location_name)
        payload = {"location": location_name, "location_details": location_details, "disaster_intelligence": result, "imd": imd_result}
        payload = localize_payload(payload, language); payload["_localized_language"] = language
        return jsonify(payload)
    except ValueError:
        return jsonify({"error": "Latitude and longitude must be valid numbers."}), 400
    except Exception as error:
        logger.error("disaster intelligence error: %s", error)
        return jsonify({"error": "Unable to calculate disaster intelligence."}), 500
@weather_bp.route("/api/agriculture-advisory", methods=["GET", "POST"])
def agriculture_advisory_route():
    try:
        data = request.get_json(silent=True) or {}
        if request.method == "GET":
            data = request.args.to_dict()
        language = normalize_language(data.get("language", "en"))

        latitude = data.get("latitude")
        longitude = data.get("longitude")
        if latitude is None or longitude is None:
            return jsonify({"error": "Latitude and longitude are required."}), 400

        latitude = float(latitude)
        longitude = float(longitude)
        if not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
            return jsonify({"error": "Invalid coordinates."}), 400

        crop = data.get("crop", "wheat")
        stage = data.get("stage", "Not specified")
        soil_type = data.get("soil_type", "Not specified")

        weather_data = get_weather(latitude, longitude)
        if not weather_data:
            return jsonify({"error": "Unable to fetch weather data."}), 502

        location_details = reverse_geocode_details(latitude, longitude)
        location_name = (
            (location_details or {}).get("name")
            or reverse_geocode(latitude, longitude)
            or "Selected Location"
        )

        advisory = generate_agriculture_advisory(
            weather_data,
            crop=crop,
            stage=stage,
            soil_type=soil_type,
            location=location_name,
        )

        payload = {
            "location": location_name,
            "location_details": location_details,
            "agriculture_advisory": advisory,
            "crops": [
                {"value": key, "label": value["label"]}
                for key, value in CROP_PROFILES.items()
            ],
            "stages": STAGES,
            "soils": SOILS,
        }
        payload = localize_payload(payload, language); payload["_localized_language"] = language
        return jsonify(payload)
    except ValueError:
        return jsonify({"error": "Latitude, longitude and options must be valid."}), 400
    except Exception as error:
        logger.error("agriculture advisory error: %s", error)
        return jsonify({"error": "Unable to generate agriculture advisory."}), 500
@weather_bp.route("/api/aviation-advisory", methods=["GET", "POST"])
def aviation_advisory_route():
    try:
        data = request.get_json(silent=True) or {}
        if request.method == "GET":
            data = request.args.to_dict()
        language = normalize_language(data.get("language", "en"))

        latitude = data.get("latitude")
        longitude = data.get("longitude")
        if latitude is None or longitude is None:
            return jsonify({"error": "Latitude and longitude are required."}), 400

        latitude = float(latitude)
        longitude = float(longitude)
        if not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
            return jsonify({"error": "Invalid coordinates."}), 400

        weather_data = get_weather(latitude, longitude)
        if not weather_data:
            return jsonify({"error": "Unable to fetch weather data."}), 502

        location_details, imd_result = _get_imd_context(latitude, longitude)
        location_name = (location_details or {}).get("name") or reverse_geocode(latitude, longitude) or "Selected Location"
        advisory = generate_aviation_advisory(weather_data, imd_result, location_name)

        payload = {"location": location_name, "location_details": location_details, "aviation_advisory": advisory, "imd": imd_result}
        payload = localize_payload(payload, language); payload["_localized_language"] = language
        return jsonify(payload)
    except ValueError:
        return jsonify({"error": "Latitude and longitude must be valid numbers."}), 400
    except Exception as error:
        logger.error("aviation advisory error: %s", error)
        return jsonify({"error": "Unable to generate aviation advisory."}), 500
@weather_bp.route("/api/urban-advisory", methods=["GET", "POST"])
def urban_advisory_route():
    try:
        data = request.get_json(silent=True) or {}
        if request.method == "GET":
            data = request.args.to_dict()
        language = normalize_language(data.get("language", "en"))

        latitude = data.get("latitude")
        longitude = data.get("longitude")
        if latitude is None or longitude is None:
            return jsonify({"error": "Latitude and longitude are required."}), 400

        latitude = float(latitude)
        longitude = float(longitude)
        if not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
            return jsonify({"error": "Invalid coordinates."}), 400

        weather_data = get_weather(latitude, longitude)
        if not weather_data:
            return jsonify({"error": "Unable to fetch weather data."}), 502

        location_details, imd_result = _get_imd_context(latitude, longitude)
        location_name = ((location_details or {}).get("name")
                         or reverse_geocode(latitude, longitude)
                         or "Selected Location")
        advisory = generate_urban_advisory(weather_data, imd_result, location_name)

        payload = {"location": location_name, "location_details": location_details, "urban_advisory": advisory, "imd": imd_result}
        payload = localize_payload(payload, language); payload["_localized_language"] = language
        return jsonify(payload)
    except ValueError:
        return jsonify({"error": "Latitude and longitude must be valid numbers."}), 400
    except Exception as error:
        logger.error("urban advisory error: %s", error)
        return jsonify({"error": "Unable to generate urban advisory."}), 500
@weather_bp.route("/api/nwp/gfs", methods=["GET"])
def nwp_gfs():
    try:
        latitude = float(request.args.get("latitude", ""))
        longitude = float(request.args.get("longitude", ""))
        forecast_days = int(request.args.get("forecast_days", "7"))
        if not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
            return jsonify({"error": "Invalid coordinates."}), 400
        data = get_gfs_forecast(latitude, longitude, forecast_days)
        return jsonify({
            "model": "NOAA GFS",
            "provider": "Open-Meteo GFS API",
            "latitude": latitude,
            "longitude": longitude,
            "data": data
        })
    except ValueError:
        return jsonify({"error": "Latitude, longitude and forecast_days must be valid numbers."}), 400
    except requests.RequestException as error:
        logger.error("gfs api error: %s", error)
        return jsonify({"error": "GFS model data is temporarily unavailable."}), 502
    except Exception as error:
        logger.error("gfs route error: %s", error)
        return jsonify({"error": "Unable to load GFS model data."}), 500
@weather_bp.route("/api/nwp/wrf", methods=["GET"])
def nwp_wrf():
    try:
        latitude = float(request.args.get("latitude", ""))
        longitude = float(request.args.get("longitude", ""))
        forecast_days = int(request.args.get("forecast_days", "3"))
        if not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
            return jsonify({"error": "Invalid coordinates."}), 400
        if not wrf_is_configured():
            return jsonify({
                "model": "WRF",
                "status": "not_configured",
                "message": "Configure WRF_API_URL to connect WeatherGPT to a WRF deployment.",
            }), 503
        return jsonify(get_wrf_forecast(latitude, longitude, forecast_days))
    except ValueError:
        return jsonify({"error": "Latitude, longitude and forecast_days must be valid numbers."}), 400
    except requests.RequestException as error:
        logger.error("wrf api error: %s", error)
        return jsonify({"error": "WRF model data is temporarily unavailable."}), 502
    except Exception as error:
        logger.error("wrf route error: %s", error)
        return jsonify({"error": str(error)}), 500

@weather_bp.route("/api/forecast-confidence", methods=["GET"])
def forecast_confidence_route():
    """Compare GFS/ECMWF/ICON forecasts and return confidence metrics."""
    try:
        latitude = float(request.args.get("latitude", ""))
        longitude = float(request.args.get("longitude", ""))
        forecast_days = int(request.args.get("forecast_days", "3"))
        model_param = request.args.get("models", "gfs_seamless,ecmwf_ifs04,icon_seamless")
        models = [m.strip() for m in model_param.split(",") if m.strip()][:3]
        if not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
            return jsonify({"error": "Invalid coordinates."}), 400
        if len(models) < 2:
            return jsonify({"error": "At least two forecast models are required."}), 400
        analysis = get_confidence_analysis(latitude, longitude, forecast_days, models)
        return jsonify({"status": "ok", "analysis": analysis})
    except ValueError:
        return jsonify({"error": "Latitude, longitude and forecast_days must be valid numbers."}), 400
    except requests.RequestException as error:
        logger.error("forecast confidence api error: %s", error)
        return jsonify({"error": "Multi-model forecast data is temporarily unavailable."}), 502
    except Exception as error:
        logger.error("forecast confidence error: %s", error)
        return jsonify({"error": "Unable to calculate forecast confidence."}), 500

@weather_bp.route("/api/intelligence/summary", methods=["GET"])
def intelligence_summary():
    try:
        latitude = float(request.args.get("latitude", ""))
        longitude = float(request.args.get("longitude", ""))
        forecast_days = int(request.args.get("forecast_days", "3"))
        include_models = request.args.get("include_models", "true").lower() != "false"
        if not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
            return jsonify({"error": "Invalid coordinates."}), 400

        weather = get_weather(latitude, longitude)
        gfs = get_gfs_forecast(latitude, longitude, forecast_days) if include_models else None
        wrf = None
        wrf_error = None
        if include_models and wrf_is_configured():
            try:
                wrf = get_wrf_forecast(latitude, longitude, forecast_days)
            except Exception as error:
                wrf_error = str(error)

        summary = build_model_summary(weather, gfs, wrf)
        return jsonify({"status": "ok", "summary": summary, "wrf_error": wrf_error})
    except ValueError:
        return jsonify({"error": "Latitude, longitude and forecast_days must be valid numbers."}), 400
    except requests.RequestException as error:
        logger.error("intelligence api error: %s", error)
        return jsonify({"error": "Weather/model data is temporarily unavailable."}), 502
    except Exception as error:
        logger.error("intelligence route error: %s", error)
        return jsonify({"error": "Unable to build weather intelligence."}), 500