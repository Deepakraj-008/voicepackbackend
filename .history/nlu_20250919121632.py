# nlu.py
import re

def classify_intent(text: str):
    t = text.lower().strip()
    if not t:
        return "empty", {}

    if any(x in t for x in ["what's the time", "what is the time", "current time", "time now"]):
        return "get_time", {}
    if "weather" in t or "forecast" in t:
        # naive city extraction
        m = re.search(r"in\s+([a-zA-Z\s]+)$", t)
        city = m.group(1).strip() if m else None
        return "get_weather", {"city": city}
    if "set alarm" in t or ("alarm" in t and "set" in t):
        m = re.search(r"(\d{1,2})\s*(:\s*\d{2})?\s*(am|pm)?", t)
        return "set_alarm", {"when": m.group(0) if m else None}
    if "play" in t and any(x in t for x in ["song", "music", "spotify"]):
        return "play_music", {}
    return "small_talk", {}
