"""Optional MQTT weather-data ingestion layer.

MQTT is intentionally optional: WeatherGPT continues to work with REST APIs
when a broker is not configured. Incoming JSON messages are cached in memory
and can be consumed by dashboards, alert engines, or future persistence.
"""
import json
import logging
import os
import threading
from collections import deque
from datetime import datetime, timezone

try:
    import paho.mqtt.client as mqtt
except ImportError:
    mqtt = None

logger = logging.getLogger(__name__)

_MESSAGES = deque(maxlen=500)
_LOCK = threading.Lock()
_CLIENT = None

def is_configured():
    return bool(os.getenv("MQTT_BROKER", "").strip()) and mqtt is not None

def recent_messages(limit=50):
    with _LOCK:
        return list(_MESSAGES)[-max(1, min(int(limit), 500)):][::-1]

def _on_message(client, userdata, message):
    raw = message.payload.decode("utf-8", errors="replace")
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError:
        payload = {"raw": raw}
    item = {
        "topic": message.topic,
        "received_at": datetime.now(timezone.utc).isoformat(),
        "payload": payload,
    }
    with _LOCK:
        _MESSAGES.append(item)

def start_mqtt_listener():
    global _CLIENT
    if not is_configured() or _CLIENT is not None:
        return False

    broker = os.getenv("MQTT_BROKER", "").strip()
    port = int(os.getenv("MQTT_PORT", "1883"))
    topic = os.getenv("MQTT_TOPIC", "weathergpt/meteorology/#").strip()
    username = os.getenv("MQTT_USERNAME", "").strip()
    password = os.getenv("MQTT_PASSWORD", "")

    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION1)
    if username:
        client.username_pw_set(username, password)
    client.on_message = _on_message
    client.connect(broker, port, 60)
    client.subscribe(topic, qos=1)
    client.loop_start()
    _CLIENT = client
    logger.info("MQTT ingestion started: %s:%s / %s", broker, port, topic)
    return True
