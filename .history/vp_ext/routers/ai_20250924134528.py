from fastapi import APIRouter, HTTPException, Query
import os, time, asyncio, httpx
import xml.etree.ElementTree as ET
from fastapi import WebSocket, WebSocketDisconnect
from vp_ext.settings import ExtSettings
from typing import AsyncIterator
from fastapi import Depends
from vp_ext.db import get_session
from sqlmodel import Session
import vp_ext.models as models

# Load settings once
_settings = ExtSettings()
# This key is explicitly for the chat bot only (Perplexity chat integration).
PERPLEXITY_CHAT_KEY = _settings.PERPLEXITY_CHAT_API_KEY or os.getenv("PERPLEXITY_CHAT_API_KEY")
# API keys allowed to call the chat endpoints (comma-separated in env or .env)
AI_ALLOWED_KEYS = (os.getenv("AI_ALLOWED_KEYS") or _settings.SECRET_KEY or "").split(",")

# Simple in-memory rate limiter: token buckets per api_key or client
_rate_buckets: dict = {}
RATE_LIMIT_PER_MIN = int(os.getenv("AI_RATE_PER_MIN", "30"))

def _bucket_allow(key: str) -> bool:
    """Allow one request per (1/RATE_LIMIT_PER_MIN) minute averaged via token bucket."""
    import time
    now = int(time.time())
    bucket = _rate_buckets.get(key)
    rate = RATE_LIMIT_PER_MIN
    capacity = rate
    refill_per_sec = rate / 60.0
    if not bucket:
        _rate_buckets[key] = {"tokens": capacity - 1, "last": now}
        return True
    tokens = bucket.get("tokens", capacity)
    last = bucket.get("last", now)
    # refill
    delta = now - last
    tokens = min(capacity, tokens + delta * refill_per_sec)
    if tokens < 1:
        bucket["tokens"] = tokens
        bucket["last"] = now
        return False
    bucket["tokens"] = tokens - 1
    bucket["last"] = now
    _rate_buckets[key] = bucket
    return True


from fastapi import Header

async def ai_auth(x_api_key: str | None = Header(default=None)):
    """Simple API key auth for AI chat endpoints. Accepts the configured keys."""
    # If no keys configured, allow using SECRET_KEY as a dev default
    allowed = [k.strip() for k in AI_ALLOWED_KEYS if k and k.strip()]
    # If not set, allow everything (dev mode)
    if not allowed:
        return "dev"
    if not x_api_key:
        raise HTTPException(status_code=401, detail="Missing X-API-KEY header")
    if x_api_key not in allowed:
        raise HTTPException(status_code=403, detail="Invalid API key")
    # rate limit
    if not _bucket_allow(x_api_key):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    return x_api_key

router = APIRouter()

HF_API = "https://huggingface.co/api"
HN_API = "https://hn.algolia.com/api/v1"
GH_API = "https://api.github.com"

def _gh_headers():
    h = {"Accept": "application/vnd.github+json"}
    token = os.getenv("GITHUB_TOKEN")
    if token:
        h["Authorization"] = f"Bearer {token}"
    return h

@router.get("/models")
async def ai_models(limit: int = Query(20, ge=1, le=50)):
    url = f"{HF_API}/models"
    params = {"sort":"downloads","direction":"-1","limit":str(limit)}
    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.get(url, params=params)
        r.raise_for_status()
        items = r.json()
    data = [
        {
            "id": m.get("modelId") or m.get("id"),
            "name": m.get("modelId") or m.get("id"),
            "downloads": m.get("downloads"),
            "likes": m.get("likes"),
            "tags": m.get("tags") or [],
            "updatedAt": m.get("lastModified") or m.get("lastModifiedDate"),
        } for m in items
    ]
    return {"data": data}

@router.get("/datasets")
async def ai_datasets(limit: int = Query(20, ge=1, le=50)):
    url = f"{HF_API}/datasets"
    params = {"sort":"downloads","direction":"-1","limit":str(limit)}
    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.get(url, params=params)
        r.raise_for_status()
        items = r.json()
    data = [
        {
            "id": d.get("id"),
            "name": d.get("id"),
            "downloads": d.get("downloads"),
            "likes": d.get("likes"),
            "tags": d.get("tags") or [],
            "updatedAt": d.get("lastModified"),
        } for d in items
    ]
    return {"data": data}

@router.get("/papers")
async def ai_papers(limit: int = Query(20, ge=1, le=50)):
    url = "http://export.arxiv.org/api/query"
    params = {
        "search_query": "all:artificial intelligence OR all:machine learning",
        "sortBy": "submittedDate",
        "sortOrder": "descending",
        "max_results": str(limit),
    }
    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.get(url, params=params)
        r.raise_for_status()
        xml = r.text
    try:
        root = ET.fromstring(xml)
        ns = {"a":"http://www.w3.org/2005/Atom"}
        out = []
        for e in root.findall("a:entry", ns):
            title = (e.findtext("a:title", default="", namespaces=ns) or "").strip()
            summary = (e.findtext("a:summary", default="", namespaces=ns) or "").strip()
            link = ""
            link_el = e.find("a:link[@rel='alternate']", ns)
            if link_el is not None and "href" in link_el.attrib:
                link = link_el.attrib["href"]
            published = e.findtext("a:published", default="", namespaces=ns)
            out.append({"title": title, "summary": summary, "url": link, "published": published})
        return {"data": out}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"arXiv parse error: {exc}") from exc

@router.get("/news")
async def ai_news(limit: int = Query(20, ge=1, le=50)):
    url = f"{HN_API}/search"
    params = {"query":"AI", "tags":"story", "hitsPerPage": str(limit)}
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(url, params=params)
        r.raise_for_status()
        hits = r.json().get("hits", [])
    data = [
        {
            "title": h.get("title"),
            "url": h.get("url"),
            "points": h.get("points"),
            "author": h.get("author"),
            "created_at": h.get("created_at"),
        } for h in hits
    ]
    return {"data": data}

@router.get("/community")
async def ai_community(limit: int = Query(20, ge=1, le=50)):
    url = f"{HN_API}/search"
    params = {"query":"AI", "tags":"story", "hitsPerPage": str(limit)}
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(url, params=params)
        r.raise_for_status()
        hits = r.json().get("hits", [])
    data = [
        {
            "title": h.get("title"),
            "url": h.get("url"),
            "points": h.get("points"),
            "author": h.get("author"),
            "created_at": h.get("created_at"),
        } for h in hits
    ]
    return {"data": data}

@router.get("/repos")
async def ai_repos(limit: int = Query(20, ge=1, le=50)):
    q = "machine learning OR artificial intelligence"
    params = {"q": q, "sort": "stars", "order": "desc", "per_page": str(limit)}
    headers = _gh_headers()
    async with httpx.AsyncClient(timeout=20, headers=headers) as client:
        r = await client.get(f"{GH_API}/search/repositories", params=params)
        r.raise_for_status()
        items = r.json().get("items", [])
    data = [
        {
            "id": it.get("id"),
            "name": it.get("full_name"),
            "html_url": it.get("html_url"),
            "description": it.get("description"),
            "stargazers_count": it.get("stargazers_count"),
            "language": it.get("language"),
            "updated_at": it.get("updated_at"),
        } for it in items
    ]
    return {"data": data}

@router.get("/dashboard")
async def ai_dashboard():
    async with httpx.AsyncClient(timeout=20) as client:
        models_task = client.get(f"{HF_API}/models", params={"sort":"downloads","direction":"-1","limit":"10"})
        datasets_task = client.get(f"{HF_API}/datasets", params={"sort":"downloads","direction":"-1","limit":"10"})
        hn_task = client.get(f"{HN_API}/search", params={"query":"AI","tags":"story","hitsPerPage":"10"})
        gh_task = client.get(f"{GH_API}/search/repositories", params={"q":"machine learning OR artificial intelligence","sort":"stars","order":"desc","per_page":"10"}, headers=_gh_headers())
        r1, r2, r3, r4 = await asyncio.gather(models_task, datasets_task, hn_task, gh_task)
        for r in (r1,r2,r3,r4): r.raise_for_status()
        models = r1.json()
        datasets = r2.json()
        news = r3.json().get("hits", [])
        repos = r4.json().get("items", [])

    trending_topics = []
    for m in models[:5]:
        n = (m.get("modelId") or m.get("id") or "").split("/")
        if n:
            trending_topics.append(n[-1])

    summary = {
        "total_models": len(models),
        "total_datasets": len(datasets),
        "total_news": len(news),
        "total_repos": len(repos),
        "total_papers": 0,
    }
    return {"data": {
        "trending_topics": trending_topics,
        "summary": summary,
        "timestamp": int(time.time())
    }}


# ---------------- Perplexity integration ----------------
class PerplexityClient:
    """Tiny Perplexity HTTP client. Uses the (undocumented) API if available.

    This implementation performs a simple POST to Perplexity's answer endpoint
    and returns the top textual answer. It is intentionally defensive: if the
    PERPLEXITY_API_KEY is missing we raise RuntimeError so callers can fallback.
    """
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base = "https://api.perplexity.ai"  # best-effort; can be overridden
        self.headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "x-api-key": api_key,
        }

    async def chat(self, prompt: str, *, max_tokens: int = 512) -> str:
        url = f"{self.base}/v1/answers"
        payload = {"query": prompt, "top_k": 1}
        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.post(url, json=payload, headers=self.headers)
            if r.status_code >= 400:
                raise RuntimeError(f"Perplexity API error: {r.status_code} {r.text}")
            data = r.json()
        # Perplexity's response shapes vary; try common keys
        if isinstance(data, dict):
            # prefer 'answer' or 'text' or first item in 'answers'
            if data.get("answer"):
                return data["answer"]
            if data.get("text"):
                return data["text"]
            if data.get("answers") and isinstance(data["answers"], list):
                first = data["answers"][0]
                if isinstance(first, dict):
                    return first.get("text") or first.get("answer") or str(first)
                return str(first)
        return str(data)


def _perplex_client() -> PerplexityClient | None:
    if not PERPLEXITY_CHAT_KEY:
        return None
    try:
        return PerplexityClient(PERPLEXITY_CHAT_KEY)
    except Exception:
        return None


@router.post("/chat")
async def ai_chat(prompt: str = Query(..., min_length=1), db: Session = Depends(get_session)):
    """Simple chat endpoint. Uses Perplexity when configured, otherwise returns a canned reply."""
    pc = _perplex_client()
    if pc:
        try:
            resp = await pc.chat(prompt)
            # persist
            try:
                cm = models.ChatMessage(role="user", prompt=prompt, response=None, provider="perplexity")
                db.add(cm); db.commit(); db.refresh(cm)
                cm.response = resp
                db.add(cm); db.commit()
            except Exception:
                # non-fatal
                pass
            return {"ok": True, "provider": "perplexity", "response": resp}
        except Exception as e:
            # fallthrough to fallback reply
            return {"ok": False, "error": str(e)}
    # Fallback: echo + small augmentation
    return {"ok": True, "provider": "fallback", "response": f"Echo: {prompt[:1000]}"}


@router.websocket("/chat/stream")
async def ws_chat_stream(websocket: WebSocket):
    """WebSocket endpoint to accept a prompt and stream back a reply.

    Behavior:
    - Expect a JSON message: {"prompt": "..."}
    - If Perplexity is configured, make a single HTTP request and send the
      full text as one message. (Perplexity streaming is not public; this is a
      safe and compatible fallback.)
    - If Perplexity is not configured, echo back token-like chunks.
    """
    await websocket.accept()
    try:
        msg = await websocket.receive_json()
    except Exception:
        await websocket.close(code=4001)
        return
    prompt = msg.get("prompt") or msg.get("q") or ""
    if not prompt:
        await websocket.send_json({"error": "prompt required"})
        await websocket.close()
        return
    pc = _perplex_client()
    # create DB session manually for websocket (no dependency injection)
    db = None
    try:
        db = next(get_session())
    except Exception:
        db = None
    if pc:
        try:
            text = await pc.chat(prompt)
            # Send as a few chunks to simulate streaming
            for i in range(0, len(text), 400):
                await websocket.send_json({"type": "chunk", "data": text[i:i+400]})
                await asyncio.sleep(0.05)
            # persist
            try:
                if db is not None:
                    cm = models.ChatMessage(role="user", prompt=prompt, response=text, provider="perplexity")
                    db.add(cm); db.commit()
            except Exception:
                pass
            await websocket.send_json({"type": "done"})
            await websocket.close()
            return
        except Exception as e:
            await websocket.send_json({"error": str(e)})
            await websocket.close()
            return
    # fallback streaming (simulate incremental tokens)
    reply = f"Echo: {prompt}"
    for i in range(0, len(reply), 50):
        await websocket.send_json({"type": "chunk", "data": reply[i:i+50]})
        await asyncio.sleep(0.05)
    await websocket.send_json({"type": "done"})
    await websocket.close()

@router.get("/all")
async def ai_all():
    async with httpx.AsyncClient(timeout=20) as client:
        tasks = [
            client.get(f"{HF_API}/models", params={"sort":"downloads","direction":"-1","limit":"20"}),
            client.get(f"{HF_API}/datasets", params={"sort":"downloads","direction":"-1","limit":"20"}),
            client.get("http://export.arxiv.org/api/query", params={"search_query":"all:artificial intelligence OR all:machine learning","sortBy":"submittedDate","sortOrder":"descending","max_results":"20"}),
            client.get(f"{HN_API}/search", params={"query":"AI","tags":"story","hitsPerPage":"20"}),
            client.get(f"{GH_API}/search/repositories", params={"q":"machine learning OR artificial intelligence","sort":"stars","order":"desc","per_page":"20"}, headers=_gh_headers()),
        ]
        r_models, r_datasets, r_papers, r_news, r_repos = await asyncio.gather(*tasks)
        for r in (r_models, r_datasets, r_papers, r_news, r_repos): r.raise_for_status()

        models = r_models.json()
        datasets = r_datasets.json()
        news = r_news.json().get("hits", [])
        repos = r_repos.json().get("items", [])

        papers = []
        try:
            root = ET.fromstring(r_papers.text)
            ns = {"a":"http://www.w3.org/2005/Atom"}
            for e in root.findall("a:entry", ns):
                title = (e.findtext("a:title", default="", namespaces=ns) or "").strip()
                summary = (e.findtext("a:summary", default="", namespaces=ns) or "").strip()
                link = ""
                link_el = e.find("a:link[@rel='alternate']", ns)
                if link_el is not None and "href" in link_el.attrib:
                    link = link_el.attrib["href"]
                published = e.findtext("a:published", default="", namespaces=ns)
                papers.append({"title": title, "summary": summary, "url": link, "published": published})
        except Exception:
            papers = []

    return {
        "models": models,
        "datasets": datasets,
        "papers": papers,
        "news": news,
        "repos": repos,
        "summary": {
            "total_models": len(models),
            "total_datasets": len(datasets),
            "total_papers": len(papers),
            "total_news": len(news),
            "total_repos": len(repos),
        },
        "last_updated": int(time.time())
    }
