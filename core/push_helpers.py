"""Web Push helpers and the background worker that sends alert notifications
to subscribed devices on a timer.
"""

import json
import logging
import sqlite3
import threading
import time

try:
    from pywebpush import webpush, WebPushException
except ImportError:
    webpush = None
    WebPushException = Exception

from core.alert_helpers import _combine_weather_alerts, _get_imd_context, _important_alert
from core.config import DB_PATH, PUSH_INTERVAL_SECONDS, VAPID_PRIVATE_KEY, VAPID_PUBLIC_KEY, VAPID_SUBJECT
from services.location_service import reverse_geocode
from services.weather_service import get_weather
from services.alert_service import generate_weather_alerts
from services.localization_service import localize_text, normalize_language

logger = logging.getLogger(__name__)


def _push_is_configured():
    return bool(VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY and webpush)


def send_web_push(subscription_json, title, body, tag="weathergpt-alert"):
    if not _push_is_configured():
        return False, "Web Push is not configured. Install pywebpush and set VAPID keys."
    try:
        subscription = json.loads(subscription_json)
        payload = json.dumps({
            "title": title,
            "body": body,
            "tag": tag,
            "url": "/",
            "icon": "/static/favicon.ico"
        })
        webpush(
            subscription_info=subscription,
            data=payload,
            vapid_private_key=VAPID_PRIVATE_KEY,
            vapid_claims={"sub": VAPID_SUBJECT}
        )
        return True, "sent"
    except WebPushException as exc:
        return False, str(exc)
    except Exception as exc:
        return False, str(exc)


def background_push_worker():
    if not _push_is_configured():
        logger.info("Background push disabled: missing VAPID config or pywebpush")
        return
    logger.info("Background push worker started (interval=%ss)", PUSH_INTERVAL_SECONDS)
    while True:
        try:
            with sqlite3.connect(DB_PATH) as conn:
                rows = conn.execute("""
                    SELECT id, subscription_json, latitude, longitude, location_name, language,
                           notify_rain, notify_extreme, notify_wind, last_signature
                    FROM push_subscriptions
                """).fetchall()

            for row in rows:
                sub_id, subscription_json, lat, lon, location_name, language, rain, extreme, wind, last_sig = row
                try:
                    weather = get_weather(lat, lon)
                    if not weather:
                        continue

                    details, imd_result = _get_imd_context(lat, lon)
                    loc = location_name or details.get("name") or reverse_geocode(lat, lon) or "your location"

                    weather_alerts = generate_weather_alerts(weather, loc)
                    alerts = _combine_weather_alerts(weather_alerts, imd_result)
                    important = _important_alert(alerts, (bool(rain), bool(extreme), bool(wind)))
                    if not important:
                        continue
                    top = important[0]
                    signature = "|".join([
                        loc, str(top.get("title", "")),
                        str(top.get("level", top.get("severity", ""))),
                        str(top.get("message", ""))
                    ])
                    if signature == (last_sig or ""):
                        continue

                    language = normalize_language(language or "en")
                    title = localize_text(f"WeatherGPT: {top.get('title', 'Weather Alert')}", language)
                    body = localize_text(top.get("message", "An important weather alert is active."), language)
                    ok, message = send_web_push(
                        subscription_json,
                        title,
                        body
                    )
                    if ok:
                        with sqlite3.connect(DB_PATH) as conn:
                            conn.execute(
                                "UPDATE push_subscriptions SET last_signature=?, updated_at=CURRENT_TIMESTAMP WHERE id=?",
                                (signature, sub_id)
                            )
                            conn.commit()
                    elif "410" in message or "404" in message:
                        with sqlite3.connect(DB_PATH) as conn:
                            conn.execute("DELETE FROM push_subscriptions WHERE id=?", (sub_id,))
                            conn.commit()
                except Exception as exc:
                    logger.warning("Background push subscription error: %s", exc)
        except Exception as exc:
            logger.error("Background push worker error: %s", exc)
        time.sleep(max(60, PUSH_INTERVAL_SECONDS))


def start_background_push_worker():
    if not _push_is_configured():
        return
    thread = threading.Thread(target=background_push_worker, daemon=True, name="weather-push-worker")
    thread.start()
