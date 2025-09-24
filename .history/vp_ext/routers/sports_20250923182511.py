from __future__ import annotations
from fastapi import APIRouter, HTTPException, Query
import time, os, httpx

router = APIRouter()
_CACHE: dict[str, tuple[float, object]] = {}

def _ttl_get(key: str, ttl_sec: int, fetch):
    now = time.time()
    item = _CACHE.get(key)
    if item and now - item[0] < ttl_sec:
        return item[1]
    val = fetch()
    _CACHE[key] = (now, val)
    return val

def _fetch_cricbuzz_live() -> dict:
    url = "https://mapps.cricbuzz.com/cbzios/match/livematches"
    with httpx.Client(timeout=10) as c:
        r = c.get(url)
        r.raise_for_status()
        return r.json()

def _fetch_cricapi_current() -> dict:
    key = os.getenv("CRICAPI_KEY")
    if not key:
        # optional provider; skip if no key
        return {"data": []}
    url = f"https://api.cricapi.com/v1/currentMatches?apikey={key}&offset=0"
    with httpx.Client(timeout=10) as c:
        r = c.get(url)
        r.raise_for_status()
        return r.json()

def _normalize_cricbuzz(data: dict) -> list[dict]:
    out = []
    for m in data.get("matches", []):
        t1 = (m.get("team1") or {}).get("name", "")
        t2 = (m.get("team2") or {}).get("name", "")
        state = (m.get("state_title") or m.get("status") or "").strip()
        series = m.get("series_name") or ""
        start = m.get("start_time") or m.get("start_date") or None
        venue = (m.get("venue") or {}).get("name") or ""
        id_ = str(m.get("match_id") or m.get("id") or "")
        scr = []
        for inn in (m.get("score") or []):
            scr.append({
                "team": inn.get("bat_team_name") or inn.get("team_name"),
                "runs": inn.get("runs"),
                "wkts": inn.get("wickets"),
                "overs": inn.get("overs"),
            })
        out.append({
            "id": id_, "series": series, "teamA": t1, "teamB": t2,
            "status": state, "startTime": start, "venue": venue,
            "scores": scr, "source": "cricbuzz",
        })
    return out

def _normalize_cricapi(data: dict) -> list[dict]:
    out = []
    for m in data.get("data", []):
        teams = m.get("teams") or ["",""]
        t1, t2 = teams[0], teams[1]
        status = (m.get("status") or "").strip()
        start = m.get("dateTimeGMT")
        series = m.get("series") or ""
        venue  = m.get("venue") or ""
        score = []
        for s in (m.get("score") or []):
            score.append({
                "team": s.get("inning"),
                "runs": s.get("r"),
                "wkts": s.get("w"),
                "overs": s.get("o"),
            })
        out.append({
            "id": str(m.get("id") or ""),
            "series": series, "teamA": t1, "teamB": t2,
            "status": status, "startTime": start, "venue": venue,
            "scores": score, "source": "cricapi",
        })
    return out

def _aggregate(status: str) -> list[dict]:
    ttl = 30 if status == "live" else 120
    def fetch():
        items = []
        try:
            items += _normalize_cricbuzz(_fetch_cricbuzz_live())
        except Exception:
            pass
        try:
            items += _normalize_cricapi(_fetch_cricapi_current())
        except Exception:
            pass
        if not items:
            raise HTTPException(503, "No cricket provider available right now.")
        s = (status or "live").lower()
        if s == "live":
            sel = [x for x in items if "live" in (x["status"] or "").lower()]
        elif s in ("upcoming", "scheduled"):
            sel = [x for x in items if any(k in (x["status"] or "").lower() for k in ["start", "sched"])]
        elif s in ("finished", "result"):
            sel = [x for x in items if any(k in (x["status"] or "").lower() for k in ["won", "draw", "result", "stumps", "end"])]
        else:
            sel = items
        seen, uniq = set(), []
        for it in sel:
            key = (it["teamA"], it["teamB"], it["series"], it["startTime"])
            if key in seen:
                continue
            seen.add(key)
            uniq.append(it)
        return uniq[:50]
    return _ttl_get(f"agg:{status}", ttl, fetch)

@router.get("/cricket/matches")
def cricket_matches(status: str = Query("live", pattern="^(live|upcoming|finished|all)$")):
    return {"results": _aggregate(status)}

@router.get("/cricket/home")
def cricket_home():
    live = _aggregate("live")
    upcoming = _aggregate("upcoming")
    finished = _aggregate("finished")
    top = (live or upcoming or finished)[:5]
    return {"top": top, "counters": {"live": len(live), "upcoming": len(upcoming), "finished": len(finished)}}
