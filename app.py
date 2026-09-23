"""WeatherGPT Flask application entry point.

Builds the Flask app and registers each feature area as its own
blueprint (see `blueprints/`). Shared config, DB setup, and
cross-cutting helpers live under `core/`. The actual weather,
location, alerting, and AI logic lives in `services/`.
"""
from flask import Flask, render_template, jsonify, request, session
import logging
import os
from flask import Flask, send_from_directory

from dotenv import load_dotenv
from flask import Flask, jsonify, request

load_dotenv()

from blueprints.auth import auth_bp
from blueprints.locations import locations_bp
from blueprints.push import push_bp
from blueprints.weather import weather_bp
from blueprints.alerts import alerts_bp
from blueprints.chat import chat_bp
from core.config import FLASK_SECRET_KEY, MAX_CONTENT_LENGTH_BYTES
from core.db import init_db
from core.push_helpers import start_background_push_worker
from services.stream_ingestion import start_mqtt_listener

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger(__name__)


def create_app():
    app = Flask(__name__)
    app.secret_key = FLASK_SECRET_KEY
    app.config["MAX_CONTENT_LENGTH"] = MAX_CONTENT_LENGTH_BYTES

    app.register_blueprint(auth_bp)
    app.register_blueprint(locations_bp)
    app.register_blueprint(push_bp)
    app.register_blueprint(weather_bp)
    app.register_blueprint(alerts_bp)
    app.register_blueprint(chat_bp)

    @app.after_request
    def add_security_headers(response):
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "SAMEORIGIN")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        response.headers.setdefault("Permissions-Policy", "geolocation=(self), microphone=(self), camera=()")
        if request.is_secure:
            response.headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
        return response

    @app.before_request
    def validate_request_size():
        # Flask enforces MAX_CONTENT_LENGTH; this hook also makes oversized requests
        # explicit for JSON clients instead of silently processing large bodies.
        if request.content_length and request.content_length > app.config["MAX_CONTENT_LENGTH"]:
            return jsonify({"error": "Request body too large"}), 413

    @app.after_request
    def add_service_worker_header(response):
        # Allow the worker stored under /static/ to control the app at root scope.
        if request.path == "/static/service-worker.js":
            response.headers["Service-Worker-Allowed"] = "/"
        return response

    @app.route("/favicon.ico")
    def favicon():
        return send_from_directory(
            app.static_folder,
            "favicon.ico",
            mimetype="image/vnd.microsoft.icon"
        )

    init_db()
    return app


app = create_app()

if __name__ == "__main__":
    gemini_status = "configured" if os.getenv("GEMINI_API_KEY") else "API key not found"
    logger.info("Starting WeatherGPT (Gemini: %s)", gemini_status)

    start_background_push_worker()
    try:
        start_mqtt_listener()
    except Exception as error:
        logger.warning("MQTT ingestion disabled: %s", error)

    app.run(
        debug=os.getenv("FLASK_DEBUG", "0") == "1",
        use_reloader=False,
        host=os.getenv("FLASK_HOST", "127.0.0.1"),
        port=int(os.getenv("FLASK_PORT", "5000"))
    )
