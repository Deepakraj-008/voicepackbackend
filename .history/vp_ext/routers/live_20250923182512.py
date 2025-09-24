from fastapi import APIRouter, Query
import httpx, feedparser
from pytrends.request import TrendReq

router = APIRouter()

def _rss(u, n=20):
    f = feedparser.parse(u)
    out=[]
    for e in f.entries[:n]:
        out.append({"title":e.get("title"),"link":e.get("link"),"published":e.get("published")})
    return out

@router.get("/ai/news")
def ai_news(limit: int = 20):
    r=[]
    r+=_rss("http://export.arxiv.org/rss/cs.AI", limit)
    r+=_rss("https://www.theverge.com/ai-artificial-intelligence/rss/index.xml", limit)
    return {"results": r[:limit]}

@router.get("/ai/trending")
def ai_trending():
    pt = TrendReq(hl="en-US", tz=330)
    df = pt.trending_searches(pn="india").head(20)
    return {"top": df[0].tolist()}

@router.get("/news")
def news(limit: int = 20):
    return {"results": _rss("https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en", limit)}

@router.get("/weather")
def weather(lat: float = Query(...), lon: float = Query(...)):
    url=f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true"
    j = httpx.get(url, timeout=10).json()
    return {"data": j}

@router.get("/sports")
def sports(limit: int = 20):
    j = httpx.get("https://www.thesportsdb.com/api/v1/json/1/all_sports.php", timeout=10).json()
    return {"results": j.get("sports", [])[:limit]}
