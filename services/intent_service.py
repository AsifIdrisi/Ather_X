"""Detects user intent and extracts key details from a chat query."""

import re

def detect_intent(message):
    """
    Detect the main weather intent from user query.
    """

    text = message.lower().strip()

    # Rain
    if any(word in text for word in [
        "rain",
        "rainy",
        "baarish",
        "barish",
        "वर्षा",
        "बारिश"
    ]):
        return "rain_forecast"

    # Temperature
    if any(word in text for word in [
        "temperature",
        "temp",
        "garmi",
        "thand",
        "hot",
        "cold",
        "तापमान",
        "गर्मी",
        "ठंड"
    ]):
        return "temperature"

    # Humidity
    if any(word in text for word in [
        "humidity",
        "humid",
        "nami",
        "नमी"
    ]):
        return "humidity"

    # Wind
    if any(word in text for word in [
        "wind",
        "winds",
        "hawa",
        "हवा"
    ]):
        return "wind"

    # Forecast
    if any(word in text for word in [
        "forecast",
        "weather",
        "mausam",
        "मौसम"
    ]):
        return "forecast"

    return "general_weather"

def detect_date(message):
    """
    Detect relative date from query.
    """

    text = message.lower()

    if any(word in text for word in [
        "tomorrow",
        "kal",
        "कल"
    ]):
        return "tomorrow"

    if any(word in text for word in [
        "today",
        "aaj",
        "आज"
    ]):
        return "today"

    if any(word in text for word in [
        "day after tomorrow",
        "parson",
        "परसों"
    ]):
        return "day_after_tomorrow"

    return "today"

def detect_time_period(message):
    """
    Detect time period from query.
    """

    text = message.lower()

    if any(word in text for word in [
        "morning",
        "subah",
        "सुबह"
    ]):
        return "morning"

    if any(word in text for word in [
        "afternoon",
        "dopahar",
        "दोपहर"
    ]):
        return "afternoon"

    if any(word in text for word in [
        "evening",
        "shaam",
        "शाम"
    ]):
        return "evening"

    if any(word in text for word in [
        "night",
        "raat",
        "रात"
    ]):
        return "night"

    return "any"

def analyze_query(message):
    """
    Convert natural language into structured information.
    """

    return {
        "intent": detect_intent(message),
        "date": detect_date(message),
        "time_period": detect_time_period(message)
    }