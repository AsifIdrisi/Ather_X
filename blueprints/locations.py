"""Per-account saved locations, and the city-name search used by the
location picker in the UI.
"""

import logging
import sqlite3

from flask import Blueprint, jsonify, request

from blueprints.auth import _current_user_id
from core.config import DB_PATH
from services.location_service import search_location

logger = logging.getLogger(__name__)

locations_bp = Blueprint("locations", __name__)


@locations_bp.route("/api/saved-locations", methods=["GET"])
def get_saved_locations():
    user_id = _current_user_id()
    if not user_id:
        return jsonify({"authenticated": False, "locations": []})
    with sqlite3.connect(DB_PATH) as conn:
        rows = conn.execute(
            "SELECT id, name, latitude, longitude FROM saved_locations WHERE user_id = ? ORDER BY updated_at DESC, id DESC",
            (user_id,)
        ).fetchall()
    return jsonify({
        "authenticated": True,
        "locations": [
            {"id": r[0], "name": r[1], "latitude": r[2], "longitude": r[3]}
            for r in rows
        ]
    })


@locations_bp.route("/api/saved-locations", methods=["POST"])
def save_location():
    user_id = _current_user_id()
    if not user_id:
        return jsonify({"error": "Sign in to save locations to your account."}), 401
    data = request.get_json(silent=True) or {}
    name = str(data.get("name", "")).strip()
    try:
        latitude = float(data.get("latitude"))
        longitude = float(data.get("longitude"))
    except (TypeError, ValueError):
        return jsonify({"error": "Valid location coordinates are required."}), 400
    if not name or not (-90 <= latitude <= 90) or not (-180 <= longitude <= 180):
        return jsonify({"error": "Valid location name and coordinates are required."}), 400
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            INSERT INTO saved_locations (user_id, name, latitude, longitude, updated_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id, latitude, longitude) DO UPDATE SET
                name=excluded.name,
                updated_at=CURRENT_TIMESTAMP
        """, (user_id, name, latitude, longitude))
        conn.execute("""
            DELETE FROM saved_locations
            WHERE user_id = ? AND id NOT IN (
                SELECT id FROM saved_locations WHERE user_id = ? ORDER BY updated_at DESC, id DESC LIMIT 8
            )
        """, (user_id, user_id))
        row = conn.execute(
            "SELECT id, name, latitude, longitude FROM saved_locations WHERE user_id = ? AND latitude = ? AND longitude = ?",
            (user_id, latitude, longitude)
        ).fetchone()
    return jsonify({"message": "Location saved", "location": {"id": row[0], "name": row[1], "latitude": row[2], "longitude": row[3]}})


@locations_bp.route("/api/saved-locations/<int:location_id>", methods=["DELETE"])
def delete_saved_location(location_id):
    user_id = _current_user_id()
    if not user_id:
        return jsonify({"error": "Authentication required."}), 401
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("DELETE FROM saved_locations WHERE id = ? AND user_id = ?", (location_id, user_id))
    return jsonify({"message": "Location removed"})


@locations_bp.route("/api/saved-locations", methods=["DELETE"])
def clear_saved_locations_api():
    user_id = _current_user_id()
    if not user_id:
        return jsonify({"error": "Authentication required."}), 401
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("DELETE FROM saved_locations WHERE user_id = ?", (user_id,))
    return jsonify({"message": "Saved locations cleared"})


@locations_bp.route("/search-location", methods=["POST"])
def search_location_route():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request data is missing"}), 400

        query = data.get("query", "").strip()
        if not query:
            return jsonify({"error": "Please enter a city name"}), 400

        locations = search_location(query)
        if locations is None:
            return jsonify({"error": "Unable to search location"}), 500

        return jsonify({"locations": locations})

    except Exception as error:
        logger.error("location search route error: %s", error)
        return jsonify({"error": "Location search failed"}), 500
