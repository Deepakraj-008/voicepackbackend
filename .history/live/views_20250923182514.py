# live/views.py
from django.conf import settings
from django.core.cache import cache
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
import requests, feedparser, time
from datetime import datetime, timedelta
from pytrends.request import TrendReq

CACHE_TTL = 300  # 5 minutes

def _limit(items, n): return items[:max(0, min(int(n or 20), 50))]  # clamp 1..50

@api_view(["GET"])
@permission_classes([AllowAny])
def weather(req):
    # Prefer lat/lon; fallback to city via Open-Meteo geocoding
    lat, lon, city, limit = req.GET.get("lat"), req.GET.get("lon"), req.GET.get("city"), req.GET.get("limit", 7)
    key = f"wx:{lat}:{lon}:{city}:{limit}"
    data = cache.get(key)
    if not data:
        if not (lat and lon) and city:
            g = requests.get("https://geocoding-api.open-meteo.com/v1/search", params={"name": city, "count": 1, "language":"en"}).json()
            if g.get("results"):
                lat = g["results"][0]["latitude"]; lon = g["results"][0]["longitude"]
        resp = requests.get("https://api.open-meteo.com/v1/forecast",
                            params={"latitude": lat, "longitude": lon, "hourly":"temperature_2m,precipitation",
                                    "current_weather":True, "forecast_days":7}, timeout=12).json()
        data = {"current": resp.get("current_weather"), "hourly": _limit(resp.get("hourly",{}).get("temperature_2m",[]), limit)}
        cache.set(key, data, CACHE_TTL)
    return Response(data)

@api_view(["GET"])
@permission_classes([AllowAny])
def news(req):
    topic = req.GET.get("topic","technology"); limit = int(req.GET.get("limit", 20))
    key = f"news:{topic}:{limit}"
    data = cache.get(key)
    if not data:
        # No paid key? Use RSS (The Verge, BBC Tech, etc.)
        feeds = [
            "https://www.theverge.com/rss/index.xml",
            "https://feeds.bbci.co.uk/news/technology/rss.xml",
            "https://www.nature.com/subjects/artificial-intelligence/rss",
        ]
        items = []
        for url in feeds:
            try:
                feed = feedparser.parse(url)
                for e in feed.entries:
                    items.append({"title": e.title, "link": e.link, "published": getattr(e, "published", "")})
            except Exception:
                pass
        items.sort(key=lambda x: x.get("published",""), reverse=True)
        data = _limit(items, limit)
        cache.set(key, data, CACHE_TTL)
    return Response({"items": data})

@api_view(["GET"])
@permission_classes([AllowAny])
def sports(req):
    # Sports "news" via public RSS; swap in proper APIs later
    sport = req.GET.get("sport","football"); limit = int(req.GET.get("limit", 20))
    feeds = {
        "football": ["https://www.espn.com/espn/rss/soccer/news","https://www.skysports.com/rss/12040"],
        "cricket":  ["https://www.espncricinfo.com/rss/content/story/feeds/0.xml"],
        "tennis":   ["https://www.skysports.com/rss/12098"],
    }.get(sport, [])
    items = []
    for url in feeds:
        try:
            f = feedparser.parse(url)
            for e in f.entries:
                items.append({"title": e.title, "link": e.link, "published": getattr(e,"published","")})
        except Exception: pass
    items.sort(key=lambda x: x.get("published",""), reverse=True)
    return Response({"sport": sport, "items": _limit(items, limit)})

@api_view(["GET"])
@permission_classes([AllowAny])
def trending(req):
    kw = req.GET.get("q","AI")
    pytrends = TrendReq(hl="en-US", tz=330)  # IST
    pytrends.build_payload([kw], timeframe="now 7-d", geo="")
    iot = pytrends.interest_over_time().reset_index().tail(30)
    pts = [{"t": str(r["date"]), "v": int(r[kw])} for _, r in iot.iterrows()]
    return Response({"keyword": kw, "points": pts})

# --- AI specific ---
AI_SOURCES = [
    "https://openai.com/blog/rss.xml",
    "https://huggingface.co/blog/feed.xml",
    "https://feeds.feedburner.com/Paperswithcode",
    "https://export.arxiv.org/rss/cs.AI",
]

@api_view(["GET"])
@permission_classes([AllowAny])
def ai_news(req):
    limit = int(req.GET.get("limit", 20))
    items = []
    for url in AI_SOURCES:
        try:
            f = feedparser.parse(url)
            for e in f.entries:
                items.append({"title": e.title, "link": e.link, "source": e.get("source",{}).get("title",""), "published": getattr(e,"published","")})
        except Exception: pass
    items.sort(key=lambda x: x.get("published",""), reverse=True)
    return Response({"items": _limit(items, limit)})

@api_view(["GET"])
@permission_classes([AllowAny])
def ai_trending(req):
    # Simple merge: trending keywords + freshest AI posts
    kw = ["LLM","GPT","RAG","Multimodal","Transformers"]
    pytrends = TrendReq(hl="en-US", tz=330); pytrends.build_payload(kw, timeframe="now 7-d", geo="")
    df = pytrends.trending_searches(pn="india").head(20)
    return Response({"top_searches_in_india": df[0].tolist()})

@api_view(["GET"])
@permission_classes([AllowAny])
def ai_community(req):
    # community via popular ML/AI blogs/RSS; plug in your forum later
    feeds = [
        "https://www.lesswrong.com/feed.xml",
        "https://www.reddit.com/r/MachineLearning/.rss",
        "https://www.reddit.com/r/LocalLLaMA/.rss",
    ]
    items = []
    for url in feeds:
        try:
            f = feedparser.parse(url)
            for e in f.entries:
                items.append({"title": e.title, "link": e.link, "published": getattr(e,"published","")})
        except Exception: pass
    items.sort(key=lambda x: x.get("published",""), reverse=True)
    return Response({"items": _limit(items, req.GET.get("limit", 20))})
