"""Web Push subscription management (subscribe / unsubscribe / test-send).

The actual periodic sending happens in core.push_helpers.background_push_worker.
"""

import json
import sqlite3

from flask import Blueprint, jsonify, request, session

from core.config import DB_PATH, VAPID_PUBLIC_KEY
from core.push_helpers import send_web_push
from services.localization_service import localize_text, normalize_language

push_bp = Blueprint("push", __name__, url_prefix="/push")


@push_bp.route("/vapid-public-key")
def push_vapid_public_key():
    if not VAPID_PUBLIC_KEY:
        return jsonify({"enabled": False, "error": "VAPID public key is not configured."}), 503
    return jsonify({"enabled": True, "publicKey": VAPID_PUBLIC_KEY})


@push_bp.route("/subscribe", methods=["POST"])
def push_subscribe():
    data = request.get_json(silent=True) or {}
    subscription = data.get("subscription") or {}
    endpoint = subscription.get("endpoint")
    latitude = data.get("latitude")
    longitude = data.get("longitude")
    if not endpoint or latitude is None or longitude is None:
        return jsonify({"error": "Push subscription and location are required."}), 400
    try:
        latitude, longitude = float(latitude), float(longitude)
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid location coordinates."}), 400

    prefs = data.get("preferences") or {}
    user_id = session.get("user_id")
    location_name = str(data.get("location_name", "")).strip()
    language = normalize_language(data.get("language", "en"))

    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            INSERT INTO push_subscriptions
            (user_id, endpoint, subscription_json, latitude, longitude, location_name, language,
             notify_rain, notify_extreme, notify_wind, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(endpoint) DO UPDATE SET
                user_id=excluded.user_id,
                subscription_json=excluded.subscription_json,
                latitude=excluded.latitude,
                longitude=excluded.longitude,
                location_name=excluded.location_name,
                language=excluded.language,
                notify_rain=excluded.notify_rain,
                notify_extreme=excluded.notify_extreme,
                notify_wind=excluded.notify_wind,
                updated_at=CURRENT_TIMESTAMP
        """, (
            user_id, endpoint, json.dumps(subscription), latitude, longitude,
            location_name, language, 1 if prefs.get("rain", True) else 0,
            1 if prefs.get("extreme", True) else 0, 1 if prefs.get("wind", True) else 0
        ))
        conn.commit()
    return jsonify({"message": localize_text("Background push enabled.", language), "_localized_language": language})


@push_bp.route("/unsubscribe", methods=["POST"])
def push_unsubscribe():
    data = request.get_json(silent=True) or {}
    endpoint = data.get("endpoint")
    if not endpoint:
        return jsonify({"error": "Subscription endpoint is required."}), 400
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("DELETE FROM push_subscriptions WHERE endpoint = ?", (endpoint,))
        conn.commit()
    return jsonify({"message": "Background push disabled."})


@push_bp.route("/test", methods=["POST"])
def push_test():
    data = request.get_json(silent=True) or {}
    endpoint = data.get("endpoint")
    user_id = session.get("user_id")
    language = normalize_language(data.get("language", "en"))
    with sqlite3.connect(DB_PATH) as conn:
        if endpoint:
            row = conn.execute("SELECT subscription_json FROM push_subscriptions WHERE endpoint = ?", (endpoint,)).fetchone()
        elif user_id:
            row = conn.execute("SELECT subscription_json FROM push_subscriptions WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1", (user_id,)).fetchone()
        else:
            row = None
    if not row:
        return jsonify({"error": "No active background push subscription found."}), 404
    ok, message = send_web_push(
        row[0],
        localize_text("WeatherGPT", language),
        localize_text("Background push notifications are working.", language),
        "weathergpt-test"
    )
    if not ok:
        return jsonify({"error": localize_text(message, language)}), 503
    return jsonify({"message": localize_text("Test push sent.", language), "_localized_language": language})
