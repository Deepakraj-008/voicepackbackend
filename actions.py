# actions.py
from datetime import datetime
import requests

def run_action(intent: str, entities: dict) -> str:
    if intent == "get_time":
        return f"It's {datetime.now().strftime('%I:%M %p')}."

    if intent == "get_weather":
        city = (entities.get("city") or "London").title()
        # Open-Meteo (no key). We’ll fetch by a geocoding step + current weather.
        try:
            geo = requests.get(
                "https://geocoding-api.open-meteo.com/v1/search",
                params={"name": city, "count": 1}
            ).json()
            if not geo.get("results"):
                return f"I couldn't find weather for {city}."
            lat = geo["results"][0]["latitude"]
            lon = geo["results"][0]["longitude"]
            meteo = requests.get(
                "https://api.open-meteo.com/v1/forecast",
                params={"latitude": lat, "longitude": lon, "current": "temperature_2m,weather_code"}
            ).json()
            c = meteo["current"]["temperature_2m"]
            return f"The current temperature in {city} is {int(round(c))}°C."
        except Exception:
            return "I couldn't fetch the weather right now."

    if intent == "set_alarm":
        when = entities.get("when") or "soon"
        return f"Okay, I will set an alarm for {when} (demo)."

    if intent == "play_music":
        return "Playing music isn’t wired up yet. In a real app, I’d call your player."

    if intent == "empty":
        return "I didn’t catch that. Please try again."

    # small talk
    return "I'm your assistant. Ask me the time, weather, or set an alarm."
