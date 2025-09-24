from fastapi import APIRouter, HTTPException, Query, WebSocket, WebSocketDisconnect, Request
import os, time, asyncio, httpx
from pathlib import Path

# Try to load `.env` so module-level os.getenv reads the project .env during imports
try:
    # prefer python-dotenv if available
    from dotenv import load_dotenv
    _env_path = Path(__file__).resolve().parents[2] / ".env"
    if _env_path.exists():
        load_dotenv(_env_path.as_posix())
except Exception:
    # fallback: naive .env parser (KEY=VALUE lines)
    try:
        env_file = Path(__file__).resolve().parents[2] / ".env"
        if env_file.exists():
            for line in env_file.read_text(encoding="utf8").splitlines():
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                k = k.strip()
                v = v.strip().strip('"').strip("'")
                if k and (k not in os.environ or not os.environ.get(k)):
                    os.environ[k] = v
    except Exception:
        pass
import xml.etree.ElementTree as ET
from typing import AsyncIterator

router = APIRouter()

HF_API = "https://huggingface.co/api"
HN_API = "https://hn.algolia.com/api/v1"
GH_API = "https://api.github.com"
PERPLEXITY_KEY = os.getenv("PERPLEXITY_API_KEY", "").strip()
PERPLEXITY_URL = os.getenv("PERPLEXITY_API_URL", "").strip()
AI_PROVIDER = os.getenv("AI_PROVIDER", "").strip().lower()
AI_TIMEOUT = 60.0


# ----------------- AI provider implementations -----------------
class DemoAI:
    def __init__(self):
        pass

    async def chat(self, message: str, **kwargs) -> str:
        # simple echo + small transformation
        return f"Echo: {message}"

    async def stream_chat(self, message: str) -> AsyncIterator[str]:
        # yield a few chunks to simulate streaming
        text = f"Echo streaming: {message}"
        for i in range(0, len(text), 20):
            await asyncio.sleep(0.05)
            yield text[i : i + 20]


class PerplexityProvider:
    """Generic Perplexity-compatible provider.

    Assumptions:
    - User supplies `PERPLEXITY_API_URL` pointing to an HTTP endpoint that accepts
      JSON POSTs with {'query': <text>} and returns a JSON with {'answer': <text>}.
    - For streaming, the endpoint returns a text/event-stream or a chunked
      response; we forward raw text chunks to the client. Because Perplexity's
      official internal API shapes may vary, the URL is configurable.
    """

    def __init__(self, key: str, url: str):
        if not key or not url:
            raise RuntimeError("Perplexity key/url missing")
        self.key = key
        self.url = url
        self.headers = {"Authorization": f"Bearer {self.key}", "Accept": "application/json"}
        self.client = httpx.AsyncClient(timeout=AI_TIMEOUT)

    async def chat(self, message: str, **kwargs) -> str:
        payload = {"query": message}
        r = await self.client.post(self.url, headers=self.headers, json=payload)
        try:
            r.raise_for_status()
        except Exception as exc:
            raise RuntimeError(f"Perplexity API error: {exc} - {r.text}") from exc
        j = r.json()
        # try common response keys
        return j.get("answer") or j.get("text") or j.get("result") or str(j)

    async def stream_chat(self, message: str) -> AsyncIterator[str]:
        payload = {"query": message, "stream": True}
        # stream raw text chunks
        async with self.client.stream("POST", self.url, headers=self.headers, json=payload) as resp:
            try:
                resp.raise_for_status()
            except Exception as exc:
                # yield a single error chunk
                yield f"__error__:{exc}"
                return
            async for chunk in resp.aiter_text():
                if not chunk:
                    continue
                # naive SSE "data: ..." extraction
                for line in chunk.splitlines():
                    if line.startswith("data:"):
                        yield line[len("data:"):].strip()
                    else:
                        yield line


def _select_ai_provider():
    if AI_PROVIDER == "perplexity" and PERPLEXITY_KEY and PERPLEXITY_URL:
        try:
            return PerplexityProvider(PERPLEXITY_KEY, PERPLEXITY_URL)
        except Exception:
            return DemoAI()
    return DemoAI()

# single shared provider instance (safe: DemoAI is stateless)
_AI = _select_ai_provider()

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


@router.post("/chat")
async def ai_chat(request: Request):
    """Simple HTTP chat endpoint. Accepts JSON {"message": "..."} or form data."""
    try:
        data = await request.json()
    except Exception:
        data = await request.form()
    message = data.get("message") if isinstance(data, dict) else data.get("message")
    if not message:
        raise HTTPException(400, detail="message required")
    try:
        resp = await _AI.chat(message)
        return {"ok": True, "reply": resp}
    except Exception as exc:
        raise HTTPException(503, detail=str(exc)) from exc


@router.websocket("/ws/chat")
async def ws_chat(websocket: WebSocket):
    """Simple streaming WebSocket chat.

    Protocol: client sends JSON messages like {"message":"..."}
    Server streams back JSON-chunks: {"type":"chunk","data":"..."}
    When finished server sends {"type":"done","data":"<full_reply>"}
    """
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_json()
            msg = data.get("message")
            if not msg:
                await websocket.send_json({"type": "error", "error": "message missing"})
                continue

            # stream reply
            try:
                acc = []
                async for chunk in _AI.stream_chat(msg):
                    # Perplexity error sentinel handling
                    if isinstance(chunk, str) and chunk.startswith("__error__:"):
                        await websocket.send_json({"type": "error", "error": chunk[len("__error__:"):]} )
                        break
                    acc.append(chunk)
                    await websocket.send_json({"type": "chunk", "data": chunk})
                full = "".join(acc)
                await websocket.send_json({"type": "done", "data": full})
            except WebSocketDisconnect:
                raise
            except Exception as exc:
                await websocket.send_json({"type": "error", "error": str(exc)})
    except WebSocketDisconnect:
        return

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
