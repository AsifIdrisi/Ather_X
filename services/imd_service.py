"""Fetches official IMD (India Meteorological Department) weather warnings.

Primary source is the IMD WIS2/CAP alert feed, which is preferred because
each warning already includes its affected area/district, avoiding the
need for a separate India-wide district-ID lookup table. If that feed is
unavailable, we fall back to IMD's documented district-warning API.
"""

import base64
import logging
import os
import re
import time
import xml.etree.ElementTree as ET

import requests
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

load_dotenv()

# Current IMD WIS2 CAP feed

IMD_CAP_MESSAGES_URL = os.getenv(
    "IMD_CAP_MESSAGES_URL",
    "https://wis2box.imd.gov.in/oapi/collections/messages/items"
)

IMD_CAP_METADATA_ID = os.getenv(
    "IMD_CAP_METADATA_ID",
    "urn:wmo:md:in-imd:cap_alerts"
)

IMD_CAP_LIMIT = int(
    os.getenv("IMD_CAP_LIMIT", "100")
)

IMD_CAP_CACHE_SECONDS = int(
    os.getenv("IMD_CAP_CACHE_SECONDS", "300")
)

# IMD CAP/WIS2 is optional. Keep it disabled by default when no reliable
# official feed is configured, so a local SSL problem cannot spam the app
# logs or slow every weather/advisory request. Enable explicitly with
# IMD_CAP_ENABLED=true when the machine has a valid CA chain and feed access.
IMD_CAP_ENABLED = os.getenv("IMD_CAP_ENABLED", "false").strip().lower() in {"1", "true", "yes", "on"}

# Documented district warning API (fallback)

IMD_WARNING_URL = os.getenv(
    "IMD_WARNING_URL",
    "https://mausam.imd.gov.in/api/warnings_district_api.php"
)

# HTTP headers
HEADERS = {
    "User-Agent": "WeatherGPT/1.0 (SIH26068)",
    "Accept": "application/json"
}

# Old IMD Warning Codes
IMD_WARNING_TYPES = {
    1: "No Warning",
    2: "Heavy Rain",
    3: "Heavy Snow",
    4: "Thunderstorm & Lightning / Squall",
    5: "Hailstorm",
    6: "Dust Storm",
    7: "Dust Raising Winds",
    8: "Strong Surface Winds",
    9: "Heat Wave",
    10: "Hot Day",
    11: "Warm Night",
    12: "Cold Wave",
    13: "Cold Day",
    14: "Ground Frost",
    15: "Fog",
    16: "Very Heavy Rain",
    17: "Extremely Heavy Rain"
}

IMD_COLOR_MAP = {
    1: {"name": "Red", "severity": "red"},
    2: {"name": "Orange", "severity": "orange"},
    3: {"name": "Yellow", "severity": "yellow"},
    4: {"name": "Green", "severity": "green"}
}

CAP_SEVERITY_MAP = {
    "extreme": "red",
    "severe": "red",
    "moderate": "orange",
    "minor": "yellow",
    "unknown": "yellow"
}

# Small Cache
_CAP_CACHE = {
    "timestamp": 0.0,
    "alerts": []
}

# Text Helpers
def normalize_text(value):
    if not value:
        return ""

    value = str(value).strip().lower()
    value = re.sub(r"[^a-z0-9\u0900-\u097f]+", " ", value)
    return re.sub(r"\s+", " ", value).strip()

def compact_text(value):
    return normalize_text(value).replace(" ", "")

def get_local_name(tag):
    if not tag:
        return ""
    return tag.split("}")[-1].lower()

def xml_value(root, name):
    for element in root.iter():
        if get_local_name(element.tag) == name.lower():
            return (element.text or "").strip()
    return ""

def xml_values(root, name):
    values = []
    for element in root.iter():
        if get_local_name(element.tag) == name.lower():
            value = (element.text or "").strip()
            if value:
                values.append(value)
    return values

# CAP Time Helpers
def parse_iso_time(value):
    if not value:
        return None

    try:
        from datetime import datetime
        return datetime.fromisoformat(
            value.replace("Z", "+00:00")
        )
    except (TypeError, ValueError):
        return None

def is_cap_active(alert):
    expires = parse_iso_time(alert.get("expires"))
    if expires is not None:
        from datetime import datetime, timezone
        return expires > datetime.now(timezone.utc)

    return True

# CAP Content Decoding
def decode_cap_content(content):
    if not content:
        return None

    if isinstance(content, dict):
        encoding = str(
            content.get("encoding", "")
        ).lower()
        value = content.get("value", "")
    else:
        encoding = ""
        value = content

    if not value:
        return None

    if encoding == "base64":
        try:
            return base64.b64decode(value).decode(
                "utf-8",
                errors="replace"
            )
        except Exception:
            return None

    # Some deployments can expose plain XML.
    if isinstance(value, str) and value.lstrip().startswith("<"):
        return value

    return None

# CAP XML to normalized alert

def parse_cap_xml(xml_text, notification=None):
    try:
        root = ET.fromstring(xml_text)
    except ET.ParseError:
        return None

    info_nodes = [
        element
        for element in root.iter()
        if get_local_name(element.tag) == "info"
    ]

    if not info_nodes:
        return None

    info = info_nodes[0]

    def info_value(name):
        for element in info.iter():
            if get_local_name(element.tag) == name.lower():
                return (element.text or "").strip()
        return ""

    area_descs = []
    polygons = []

    for area in info.iter():
        if get_local_name(area.tag) != "area":
            continue

        for element in area.iter():
            name = get_local_name(element.tag)
            value = (element.text or "").strip()
            if name == "areadesc" and value:
                area_descs.append(value)
            elif name == "polygon" and value:
                polygons.append(value)

    alert_id = xml_value(root, "identifier")
    sender = xml_value(root, "sender")
    status = xml_value(root, "status")
    msg_type = xml_value(root, "msgType")

    severity_raw = info_value("severity").lower()
    level = CAP_SEVERITY_MAP.get(
        severity_raw,
        "yellow"
    )

    return {
        "id": alert_id,
        "sender": sender,
        "status": status,
        "msg_type": msg_type,
        "event": info_value("event") or "IMD Weather Alert",
        "headline": info_value("headline") or info_value("event") or "IMD Weather Alert",
        "description": info_value("description"),
        "instruction": info_value("instruction"),
        "severity_raw": severity_raw,
        "level": level,
        "areas": area_descs,
        "polygon": polygons[0] if polygons else "",
        "effective": info_value("effective"),
        "onset": info_value("onset"),
        "expires": info_value("expires"),
        "sent": xml_value(root, "sent"),
        "source": "India Meteorological Department (WIS2 CAP)",
        "official": True,
        "notification_id": (
            notification.get("id")
            if isinstance(notification, dict)
            else None
        )
    }

# CAP Feed Fetch
def fetch_cap_alerts(force=False):
    if not IMD_CAP_ENABLED:
        return []

    now = time.time()

    if (
        not force
        and _CAP_CACHE["alerts"]
        and now - _CAP_CACHE["timestamp"] < IMD_CAP_CACHE_SECONDS
    ):
        return _CAP_CACHE["alerts"]

    params = {
        "limit": max(10, min(IMD_CAP_LIMIT, 500)),
        "f": "json"
    }

    try:
        response = requests.get(
            IMD_CAP_MESSAGES_URL,
            params=params,
            headers=HEADERS,
            timeout=20
        )
        response.raise_for_status()
        payload = response.json()
    except (requests.RequestException, ValueError) as error:
        logger.warning("IMD CAP feed error: %s", error)
        return []

    items = payload.get("features") or payload.get("items") or []
    alerts = []

    for item in items:
        properties = item.get("properties", item)

        metadata_id = properties.get(
            "metadata_id",
            item.get("metadata_id", "")
        )

        # Keep only IMD CAP alerts.
        if metadata_id and metadata_id != IMD_CAP_METADATA_ID:
            continue

        content = properties.get(
            "content",
            item.get("content")
        )

        xml_text = decode_cap_content(content)
        if not xml_text:
            continue

        alert = parse_cap_xml(
            xml_text,
            properties
        )

        if not alert:
            continue

        if not is_cap_active(alert):
            continue

        # CAP actual alerts and updates are useful. Drop test/cancel.
        status = normalize_text(alert.get("status"))
        msg_type = normalize_text(alert.get("msg_type"))

        if status and status not in {"actual", "test"}:
            continue

        if msg_type in {"cancel", "ack"}:
            continue

        alerts.append(alert)

    # newest first
    alerts.sort(
        key=lambda item: item.get("sent", ""),
        reverse=True
    )

    _CAP_CACHE["timestamp"] = now
    _CAP_CACHE["alerts"] = alerts

    return alerts

# Location Matching
def location_matches_alert(
    alert,
    district=None,
    city=None,
    state=None
):
    targets = []

    for value in [district, city, state]:
        normalized = compact_text(value)
        if normalized and len(normalized) >= 4:
            targets.append(normalized)

    if not targets:
        return False

    area_text = " ".join(
        alert.get("areas", [])
    )

    searchable = compact_text(
        area_text + " "
        + str(alert.get("headline", "")) + " "
        + str(alert.get("description", ""))
    )

    for target in targets:
        if target in searchable:
            return True

    return False

# CAP Alerts For Location
def get_imd_cap_alerts(
    district=None,
    city=None,
    state=None,
    force=False
):
    alerts = fetch_cap_alerts(force=force)

    matched = []

    for alert in alerts:
        if not location_matches_alert(
            alert,
            district=district,
            city=city,
            state=state
        ):
            continue

        matched.append({
            "title": alert.get(
                "headline",
                alert.get("event", "IMD Alert")
            ),
            "message": alert.get(
                "description"
            ) or alert.get(
                "headline",
                "IMD warning is active."
            ),
            "instruction": alert.get(
                "instruction",
                ""
            ),
            "level": alert.get(
                "level",
                "yellow"
            ),
            "severity": alert.get(
                "level",
                "yellow"
            ),
            "severity_raw": alert.get(
                "severity_raw",
                ""
            ),
            "event": alert.get(
                "event",
                ""
            ),
            "district": district or "",
            "city": city or "",
            "state": state or "",
            "areas": alert.get(
                "areas",
                []
            ),
            "effective": alert.get(
                "effective",
                ""
            ),
            "onset": alert.get(
                "onset",
                ""
            ),
            "expires": alert.get(
                "expires",
                ""
            ),
            "alert_id": alert.get(
                "id"
            ),
            "source": alert.get(
                "source",
                "India Meteorological Department"
            ),
            "official": True
        })

    return matched

# Old District Warning API Fallback
def get_warning_name(code):
    try:
        code = int(code)
    except (TypeError, ValueError):
        return "Unknown Warning"
    return IMD_WARNING_TYPES.get(code, "Unknown Warning")

def get_warning_color(color_code):
    try:
        color_code = int(color_code)
    except (TypeError, ValueError):
        color_code = 4
    return IMD_COLOR_MAP.get(
        color_code,
        IMD_COLOR_MAP[4]
    )

def parse_warning_codes(value):
    if value is None:
        return []
    if isinstance(value, list):
        values = value
    else:
        values = str(value).split(",")

    result = []
    for item in values:
        try:
            result.append(int(str(item).strip()))
        except (TypeError, ValueError):
            pass
    return result

def get_imd_warnings(district_id):
    if not district_id:
        return None

    try:
        response = requests.get(
            IMD_WARNING_URL,
            params={"id": int(district_id)},
            headers={"User-Agent": "WeatherGPT/1.0 (SIH26068)"},
            timeout=15
        )
        response.raise_for_status()
        return response.json()
    except (requests.RequestException, ValueError) as error:
        logger.warning("IMD district warning API error: %s", error)
        return None

def normalize_imd_warnings(data):
    if not data:
        return []

    if isinstance(data, list):
        record = data[0] if data else None
    elif isinstance(data, dict):
        wrapped = data.get("data")
        if isinstance(wrapped, list):
            record = wrapped[0] if wrapped else None
        else:
            record = data
    else:
        record = None

    if not isinstance(record, dict):
        return []

    district = record.get("District", "Unknown District")
    issue_date = record.get("Date", "")
    issue_time = record.get("UTC", "")
    obj_id = record.get("Obj_id")

    warnings = []

    for day in range(1, 6):
        codes = parse_warning_codes(
            record.get(f"Day_{day}", "")
        )
        color = get_warning_color(
            record.get(f"Day{day}_Color", 4)
        )

        for code in codes:
            if code == 1:
                continue
            warnings.append({
                "day": day,
                "district": district,
                "obj_id": obj_id,
                "code": code,
                "title": get_warning_name(code),
                "message": f"{get_warning_name(code)} warning for {district}.",
                "level": color["severity"],
                "severity": color["severity"],
                "color": color["name"],
                "issue_date": issue_date,
                "issue_time_utc": issue_time,
                "source": "India Meteorological Department",
                "official": True
            })

    return warnings

# Public Function Used By Weathergpt
def fetch_imd_warnings(
    district_id=None,
    district=None,
    state=None,
    city=None,
    force=False
):
    """
    Automatic mode:
        district/city/state -> current IMD CAP alerts

    Fallback mode:
        district_id -> documented district warning API

    No fake district ID is generated.
    """

    # 1) Automatic current CAP warning path (optional).
    cap_alerts = get_imd_cap_alerts(
        district=district,
        city=city,
        state=state,
        force=force
    )

    if cap_alerts:
        return {
            "available": True,
            "mode": "WIS2_CAP",
            "district_id": district_id,
            "district": district or "",
            "warnings": cap_alerts,
            "error": None,
            "source": "India Meteorological Department WIS2 CAP"
        }

    # 2) Optional documented district endpoint.
    if district_id:
        raw = get_imd_warnings(district_id)
        warnings = normalize_imd_warnings(raw)

        if raw is not None:
            return {
                "available": True,
                "mode": "DISTRICT_API",
                "district_id": district_id,
                "district": district or "",
                "warnings": warnings,
                "error": None,
                "source": "India Meteorological Department"
            }

    return {
        "available": True,
        "mode": "WIS2_CAP",
        "district_id": district_id,
        "district": district or "",
        "warnings": [],
        "error": None,
        "source": "India Meteorological Department WIS2 CAP"
    }

def get_active_imd_warnings(
    district_id=None,
    district=None,
    state=None,
    city=None,
    force=False
):
    return fetch_imd_warnings(
        district_id=district_id,
        district=district,
        state=state,
        city=city,
        force=force
    )
