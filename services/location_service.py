"""Reverse geocoding and location search helpers (Nominatim + Photon)."""

import logging
import re
import requests

logger = logging.getLogger(__name__)

GEOCODING_URL = "https://nominatim.openstreetmap.org/reverse"
SEARCH_URL = "https://nominatim.openstreetmap.org/search"
PHOTON_SEARCH_URL = "https://photon.komoot.io/api/"

HEADERS = {
    "User-Agent": "WeatherGPT/1.0 (SIH26068; location-search)"
}

# Some Indian villages have weak/alternate spelling coverage in public
# geocoders. Keep this small override table only for verified local aliases.
# The coordinates are approximate village-centre coordinates, not an exact house.
KNOWN_LOCALITY_ALIASES = {
    "tahar kishun devpur": {
        "name": "Tahar Kishun Devpur, Azamgarh, Uttar Pradesh, India",
        "place": "Tahar Kishun Devpur",
        "city": "Azamgarh",
        "district": "Azamgarh",
        "state": "Uttar Pradesh",
        "country": "India",
        "latitude": 26.200845,
        "longitude": 83.003677,
        "display_name": "Tahar Kishun Devpur, Koilsa, Azamgarh, Uttar Pradesh, India",
    },
    "tahar kishundevpur": None,
    "tehar kishundevpur": None,
}
KNOWN_LOCALITY_ALIASES["tahar kishundevpur"] = KNOWN_LOCALITY_ALIASES["tahar kishun devpur"]
KNOWN_LOCALITY_ALIASES["tehar kishundevpur"] = KNOWN_LOCALITY_ALIASES["tahar kishun devpur"]

def _local_place(address):
    """Return the most useful small-area/place name for a coordinate."""
    return (
        address.get("village")
        or address.get("hamlet")
        or address.get("suburb")
        or address.get("neighbourhood")
        or address.get("locality")
        or address.get("town")
        or address.get("city")
        or address.get("municipality")
        or ""
    )

def _city(address):
    return (
        address.get("city")
        or address.get("town")
        or address.get("village")
        or address.get("municipality")
        or address.get("suburb")
        or address.get("locality")
        or ""
    )

def _district(address):
    return (
        address.get("district")
        or address.get("city_district")
        or address.get("county")
        or ""
    )

def _location_name(address, fallback="Unknown Location"):
    """Build a human-friendly full location, keeping village/area when available."""
    place = _local_place(address)
    district = _district(address)
    state = address.get("state", "")
    country = address.get("country", "")

    parts = []
    for value in (place, district, state, country):
        if value and value not in parts:
            parts.append(value)

    return ", ".join(parts) or fallback

def _normalise_query(value):
    value = re.sub(r"\s+", " ", (value or "").strip().lower())
    return value.replace(",", " ").strip()

def _alias_result(query):
    """Return a verified local alias result when public geocoders miss it."""
    key = _normalise_query(query)
    compact = re.sub(r"\s+", " ", key)

    # Match the village even when the user types common locality suffixes.
    if compact in KNOWN_LOCALITY_ALIASES:
        result = KNOWN_LOCALITY_ALIASES[compact]
        return dict(result) if result else None

    if "tahar kishun devpur" in compact or "tahar kishundevpur" in compact or "tehar kishundevpur" in compact:
        return dict(KNOWN_LOCALITY_ALIASES["tahar kishun devpur"])

    return None

def _build_result_from_nominatim(item):
    address = item.get("address", {})
    place = _local_place(address)
    city = _city(address)
    district = _district(address)
    state = address.get("state", "")
    country = address.get("country", "")

    return {
        "name": _location_name(address, item.get("display_name", "Unknown Location")),
        "place": place,
        "city": city,
        "district": district,
        "state": state,
        "country": country,
        "latitude": float(item["lat"]),
        "longitude": float(item["lon"]),
        "display_name": item.get("display_name", ""),
    }

def _build_result_from_photon(item):
    props = item.get("properties", {}) or {}
    coords = (item.get("geometry") or {}).get("coordinates") or []
    if len(coords) < 2:
        raise ValueError("Photon result has no coordinates")

    place = (
        props.get("name")
        or props.get("locality")
        or props.get("district")
        or props.get("city")
        or ""
    )
    city = props.get("city") or props.get("town") or props.get("village") or place
    district = props.get("district") or props.get("county") or ""
    state = props.get("state") or ""
    country = props.get("country") or ""

    parts = []
    for value in (place, district, state, country):
        if value and value not in parts:
            parts.append(value)

    display_name = ", ".join(parts) or props.get("name", "Unknown Location")

    return {
        "name": display_name,
        "place": place,
        "city": city,
        "district": district,
        "state": state,
        "country": country,
        "latitude": float(coords[1]),
        "longitude": float(coords[0]),
        "display_name": display_name,
    }

def reverse_geocode_details(latitude, longitude):
    try:
        response = requests.get(
            GEOCODING_URL,
            params={
                "lat": latitude,
                "lon": longitude,
                "format": "jsonv2",
                "addressdetails": 1,
                "zoom": 18,
            },
            headers=HEADERS,
            timeout=15,
        )
        response.raise_for_status()
        data = response.json()
        address = data.get("address", {})

        place = _local_place(address)
        city = _city(address)
        district = _district(address)
        state = address.get("state", "")
        country = address.get("country", "")

        return {
            "name": _location_name(address),
            "place": place,
            "city": city,
            "district": district,
            "state": state,
            "country": country,
            "latitude": float(latitude),
            "longitude": float(longitude),
            "display_name": data.get("display_name", ""),
        }

    except (requests.RequestException, ValueError, TypeError) as error:
        logger.warning("reverse geocoding details error: %s", error)
        return {
            "name": "Your Location",
            "city": "",
            "district": "",
            "state": "",
            "country": "",
            "latitude": float(latitude),
            "longitude": float(longitude),
            "display_name": "",
        }

def reverse_geocode(latitude, longitude):
    details = reverse_geocode_details(latitude, longitude)
    return details.get("name", "Your Location")

def _nominatim_search(query):
    """Search Indian places, with prefix-friendly results for autocomplete."""
    query = query.strip()
    lowered = query.lower()
    compact_query = re.sub(r"\s+", " ", lowered).strip()

    # For autocomplete, ask Nominatim for a larger settlement result set.
    # This covers villages, hamlets, towns and cities instead of only large cities.
    search_params = {
        "q": query,
        "format": "jsonv2",
        "addressdetails": 1,
        "namedetails": 1,
        "limit": 50,
        "countrycodes": "in",
        "featureType": "settlement",
        "accept-language": "en,hi",
    }

    response = requests.get(
        SEARCH_URL,
        params=search_params,
        headers=HEADERS,
        timeout=15,
    )
    response.raise_for_status()
    results = response.json()

    locations = []
    for item in results:
        try:
            location = _build_result_from_nominatim(item)
        except (ValueError, KeyError, TypeError):
            continue

        # Prefer places whose actual name starts with what the user typed.
        # This makes "Tahar" show "Tahar Kishun Devpur", "Tahar Vajidpur", etc.
        names = [
            location.get("place", ""),
            location.get("name", "").split(",")[0],
        ]
        namedetails = item.get("namedetails", {}) or {}
        names.extend([
            namedetails.get("name", ""),
            namedetails.get("name:en", ""),
            namedetails.get("name:hi", ""),
        ])

        normalised_names = [
            re.sub(r"\s+", " ", str(name).lower()).strip()
            for name in names if name
        ]
        location["_prefix_match"] = any(
            name.startswith(compact_query) for name in normalised_names
        )
        locations.append(location)

    # Prefix matches first; then useful related matches. Deduplicate by coordinates/name.
    locations.sort(key=lambda item: (not item.get("_prefix_match", False), item.get("name", "").lower()))

    seen = set()
    unique = []
    for location in locations:
        key = (
            round(float(location["latitude"]), 5),
            round(float(location["longitude"]), 5),
            location.get("name", "").lower(),
        )
        if key in seen:
            continue
        seen.add(key)
        location.pop("_prefix_match", None)
        unique.append(location)

    # Keep a verified local alias available if Nominatim misses a tiny village.
    alias = _alias_result(query)
    if alias and not any(
        abs(float(x["latitude"]) - float(alias["latitude"])) < 0.001
        and abs(float(x["longitude"]) - float(alias["longitude"])) < 0.001
        for x in unique
    ):
        unique.insert(0, alias)

    return unique[:20]

def _photon_search(query):
    """Fallback geocoder; Photon often indexes smaller OSM localities differently."""
    queries = [query]
    if "," not in query and "india" not in query.lower():
        queries.append(f"{query}, Azamgarh, Uttar Pradesh, India")

    for search_query in queries:
        response = requests.get(
            PHOTON_SEARCH_URL,
            params={
                "q": search_query,
                "limit": 8,
                "lang": "en",
            },
            headers=HEADERS,
            timeout=15,
        )
        response.raise_for_status()
        features = response.json().get("features", [])
        locations = []
        for item in features:
            try:
                locations.append(_build_result_from_photon(item))
            except (ValueError, KeyError, TypeError):
                continue
        if locations:
            return locations

    return []

def search_location(query):
    """Search cities, towns, villages, hamlets and local areas."""
    if not query:
        return None

    query = query.strip()
    if not query:
        return None

    # First try the live geocoders. This keeps the search dynamic for any area.
    try:
        locations = _nominatim_search(query)
        if locations:
            return locations
    except (requests.RequestException, ValueError, KeyError, TypeError) as error:
        logger.warning("Nominatim location search error: %s", error)

    try:
        locations = _photon_search(query)
        if locations:
            return locations
    except (requests.RequestException, ValueError, KeyError, TypeError) as error:
        logger.warning("Photon location search error: %s", error)

    # Finally use a verified local alias for places missing from both indexes.
    alias = _alias_result(query)
    if alias:
        return [alias]

    return []
