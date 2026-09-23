"""Environment-derived configuration shared across blueprints.

Kept separate from app.py so that any blueprint can import a single
setting (e.g. DB_PATH) without pulling in the whole Flask app.
"""

import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "users.db")

# Web push configuration
VAPID_PUBLIC_KEY = os.getenv("VAPID_PUBLIC_KEY", "")
VAPID_PRIVATE_KEY = os.getenv("VAPID_PRIVATE_KEY", "")
VAPID_SUBJECT = os.getenv("VAPID_SUBJECT", "mailto:weathergpt@example.com")
PUSH_INTERVAL_SECONDS = int(os.getenv("PUSH_INTERVAL_SECONDS", "900"))

MAX_CONTENT_LENGTH_BYTES = int(os.getenv("MAX_CONTENT_LENGTH_BYTES", "2097152"))
FLASK_SECRET_KEY = os.getenv("FLASK_SECRET_KEY", "weathergpt-demo-secret-change-me")
