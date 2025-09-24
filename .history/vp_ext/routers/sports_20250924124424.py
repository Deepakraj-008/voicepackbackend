# vp_ext/routers/sports.py
from __future__ import annotations
import os, asyncio, datetime as dt, random
from typing import Any, Dict, List, Optional
import httpx
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Query

router = APIRouter()

# --------- ENV / Providers ----------
CRICKET_PROVIDER = os.getenv("CRICKET_PROVIDER", "").lower().strip()  # rapidapi | demo | ""
RAPIDAPI_KEY     = os.getenv("RAPIDAPI_KEY", "").strip()
RAPIDAPI_HOST    = os.getenv("RAPIDAPI_HOST", "cricbuzz-cricket.p.rapidapi.com").strip()

FOOTBALL_PROVIDER = os.getenv("FOOTBALL_PROVIDER", "").lower().strip()  # apisports | demo | ""
FOOTBALL_KEY      = os.getenv("FOOTBALL_KEY", "").strip()
FOOTBALL_HOST     = os.getenv("FOOTBALL_HOST", "v3.football.api-sports.io").strip()

TIMEOUT = httpx.Timeout(20.0, read=20.0, connect=20.0)


# ---------- Unified models (dicts) ----------
def _match_stub(
    *,
    sport: str,
    match_id: str,
    status: str,
    league: str = "",
    series: str = "",
    start_time: Optional[str] = None,
    home_name: str = "",
    away_name: str = "",
    home_score: Any = None,
    away_score: Any = None,
) -> Dict[str, Any]:
    return {
        "id": match_id,
        "sport": sport,
        "status": status,  # live|upcoming|finished
        "league": league,
        "series": series,
        "start_time": start_time,
        "home": {"name": home_name, "score": home_score},
        "away": {"name": away_name, "score": away_score},
    }


# ---------- DEMO provider (fallback) ----------
class DemoProvider:
    def __init__(self, sport: str):
        self.sport = sport

    async def home(self) -> Dict[str, Any]:
        now = dt.datetime.utcnow()
        live = [
            _match_stub(
                sport=self.sport,
                match_id=f"{self.sport}-live-{i}",
                status="live",
                league=f"{self.sport.capitalize()} League",
                series="Regular",
                start_time=(now - dt.timedelta(minutes=30)).isoformat() + "Z",
                home_name=f"{self.sport[:1].upper()} Team A{i}",
                away_name=f"{self.sport[:1].upper()} Team B{i}",
                home_score=random.randint(1, 100),
                away_score=random.randint(1, 100),
            )
            for i in range(3)
        ]
        upcoming = [
            _match_stub(
                sport=self.sport,
                match_id=f"{self.sport}-upc-{i}",
                status="upcoming",
                league=f"{self.sport.capitalize()} League",
                series="Regular",
                start_time=(now + dt.timedelta(hours=i+1)).isoformat() + "Z",
                home_name=f"{self.sport[:1].upper()} Team C{i}",
                away_name=f"{self.sport[:1].upper()} Team D{i}",
            )
            for i in range(5)
        ]
        finished = [
            _match_stub(
                sport=self.sport,
                match_id=f"{self.sport}-fin-{i}",
                status="finished",
                league=f"{self.sport.capitalize()} League",
                series="Regular",
                start_time=(now - dt.timedelta(hours=i+2)).isoformat() + "Z",
                home_name=f"{self.sport[:1].upper()} Team E{i}",
                away_name=f"{self.sport[:1].upper()} Team F{i}",
                home_score=random.randint(1, 100),
                away_score=random.randint(1, 100),
            )
            for i in range(5)
        ]
        return {"live": live, "upcoming": upcoming, "finished": finished}

    async def matches(self, status: str) -> List[Dict[str, Any]]:
        data = await self.home()
        if status == "all":
            return data["live"] + data["upcoming"] + data["finished"]
        return data.get(status, [])

    async def scorecard(self, match_id: str) -> Dict[str, Any]:
        # Fake scoreboard
        return {
            "id": match_id,
            "sport": self.sport,
            "status": "live",
            "score": {
                "home": {"runs": random.randint(50, 200), "wickets": random.randint(0, 9), "overs": f"{random.randint(1,19)}.{random.randint(0,5)}"},
                "away": {"runs": random.randint(50, 200), "wickets": random.randint(0, 9), "overs": f"{random.randint(1,19)}.{random.randint(0,5)}"},
            },
            "commentary": [
                {"over": "14.2", "text": "Nice shot through covers!", "ts": dt.datetime.utcnow().isoformat() + "Z"}
            ],
        }

    async def schedule(self, start: dt.date, days: int) -> List[Dict[str, Any]]:
        out = []
        for i in range(days):
            d = (start + dt.timedelta(days=i)).isoformat()
            out.append({
                "date": d,
                "matches": [
                    _match_stub(
                        sport=self.sport,
                        match_id=f"{self.sport}-sch-{d}-{j}",
                        status="upcoming",
                        league=f"{self.sport.capitalize()} League",
                        series="Regular",
                        start_time=f"{d}T12:00:00Z",
                        home_name=f"{self.sport[:1].upper()} Team S{j}",
                        away_name=f"{self.sport[:1].upper()} Team T{j}",
                    )
                    for j in range(3)
                ],
            })
        return out


# ---------- Cricket (RapidAPI Cricbuzz) ----------
class CricketRapidAPI:
    def __init__(self):
        if not RAPIDAPI_KEY:
            raise RuntimeError("RAPIDAPI_KEY missing")
        self.headers = {"x-rapidapi-key": RAPIDAPI_KEY, "x-rapidapi-host": RAPIDAPI_HOST}
        self.base = f"https://{RAPIDAPI_HOST}"
        self.client = httpx.AsyncClient(timeout=TIMEOUT, headers=self.headers)

    async def home(self) -> Dict[str, Any]:
        # live
        live_resp = await self.client.get(f"{self.base}/matches/v1/live")
        live_json = live_resp.json()
        live = []
        for m in (live_json.get("matches", []) or []):
            home = (m.get("matchInfo", {}) or {}).get("team1", {}).get("teamSName", "")
            away = (m.get("matchInfo", {}) or {}).get("team2", {}).get("teamSName", "")
            mid  = str(m.get("matchInfo", {}).get("matchId", ""))
            series = (m.get("seriesAdWrapper", {}) or {}).get("seriesName", "")
            league = m.get("matchInfo", {}).get("seriesName", series) or "Cricket"
            # Score text
            score_a = m.get("score", {}).get("team1Score", {})
            score_b = m.get("score", {}).get("team2Score", {})
            def sc(s): 
                r = s.get("inngs1", {}) or {}
                if not r: 
                    return None
                return f"{r.get('runs','-')}/{r.get('wickets','-')} ({r.get('overs','-')})"
            live.append(_match_stub(
                sport="cricket",
                match_id=mid,
                status="live",
                league=league, series=series,
                start_time=None,
                home_name=home, away_name=away,
                home_score=sc(score_a), away_score=sc(score_b),
            ))
        # upcoming (next)
        up_resp = await self.client.get(f"{self.base}/matches/v1/upcoming")
        up_json = up_resp.json()
        upcoming = []
        for m in (up_json.get("typeMatches", []) or []):
            for series in m.get("seriesMatches", []) or []:
                for inner in (series.get("seriesAdWrapper", {}) or {}).get("matches", []) or []:
                    info = inner.get("matchInfo", {}) or {}
                    mid = str(info.get("matchId", ""))
                    home = info.get("team1", {}).get("teamSName", "")
                    away = info.get("team2", {}).get("teamSName", "")
                    sname = (series.get("seriesAdWrapper") or {}).get("seriesName") if isinstance(series.get("seriesAdWrapper"), dict) else ""
                    st = info.get("startDate", None)
                    start = None
                    if st:
                        try:
                            start = dt.datetime.utcfromtimestamp(int(st)//1000).isoformat() + "Z"
                        except:
                            start = None
                    upcoming.append(_match_stub(
                        sport="cricket", match_id=mid, status="upcoming",
                        league=sname or "Cricket", series=sname or "Cricket",
                        start_time=start, home_name=home, away_name=away
                    ))
        # results (finished)
        fin_resp = await self.client.get(f"{self.base}/matches/v1/recent")
        fin_json = fin_resp.json()
        finished = []
        for m in (fin_json.get("typeMatches", []) or []):
            for series in m.get("seriesMatches", []) or []:
                for inner in (series.get("seriesAdWrapper", {}) or {}).get("matches", []) or []:
                    info = inner.get("matchInfo", {}) or {}
                    mid = str(info.get("matchId", ""))
                    home = info.get("team1", {}).get("teamSName", "")
                    away = info.get("team2", {}).get("teamSName", "")
                    sname = (series.get("seriesAdWrapper") or {}).get("seriesName") if isinstance(series.get("seriesAdWrapper"), dict) else ""
                    finished.append(_match_stub(
                        sport="cricket", match_id=mid, status="finished",
                        league=sname or "Cricket", series=sname or "Cricket",
                        start_time=None, home_name=home, away_name=away
                    ))
        return {"live": live, "upcoming": upcoming, "finished": finished}

    async def matches(self, status: str) -> List[Dict[str, Any]]:
        data = await self.home()
        if status == "all":
            return data["live"] + data["upcoming"] + data["finished"]
        return data.get(status, [])

    async def scorecard(self, match_id: str) -> Dict[str, Any]:
        # minimal scorecard (Cricbuzz detail endpoint is outside “free”; we do a second best)
        # return the match with live scores if available
        all_live = await self.matches("live")
        for m in all_live:
            if m["id"] == match_id:
                return {
                    "id": match_id, "sport": "cricket", "status": "live",
                    "score": {
                        "home": {"text": m["home"]["score"]},
                        "away": {"text": m["away"]["score"]},
                    },
                    "commentary": [],
                }
        return {"id": match_id, "sport": "cricket", "status": "unknown", "score": {}, "commentary": []}

    async def schedule(self, start: dt.date, days: int) -> List[Dict[str, Any]]:
        # Use 'upcoming' as schedule
        up = await self.matches("upcoming")
        by_date: Dict[str, List[Dict[str, Any]]] = {}
        for m in up:
            d = (m.get("start_time") or "")[:10] or dt.date.today().isoformat()
            by_date.setdefault(d, []).append(m)
        out = []
        for i in range(days):
            d = (start + dt.timedelta(days=i)).isoformat()
            out.append({"date": d, "matches": by_date.get(d, [])})
        return out


# ---------- Football (API-FOOTBALL by api-sports.io) ----------
class FootballAPISports:
    def __init__(self):
        if not FOOTBALL_KEY:
            raise RuntimeError("FOOTBALL_KEY missing")
        self.headers = {"x-rapidapi-key": FOOTBALL_KEY, "x-rapidapi-host": FOOTBALL_HOST}
        # API-FOOTBALL is NOT on RapidAPI; it uses its own host/key header: "x-apisports-key".
        # Many devs front it differently, so allow both:
        self.headers_alt = {"x-apisports-key": FOOTBALL_KEY}
        self.base = f"https://{FOOTBALL_HOST}"
        self.client = httpx.AsyncClient(timeout=TIMEOUT, headers=self.headers_alt)

    async def home(self) -> Dict[str, Any]:
        # live
        live = []
        r_live = await self.client.get(f"{self.base}/fixtures?live=all")
        j_live = r_live.json()
        for fx in (j_live.get("response", []) or []):
            mid = str(fx.get("fixture", {}).get("id", ""))
            league = fx.get("league", {}).get("name", "Football")
            start = fx.get("fixture", {}).get("date", None)
            home = fx.get("teams", {}).get("home", {}).get("name", "")
            away = fx.get("teams", {}).get("away", {}).get("name", "")
            hs = fx.get("goals", {}).get("home", 0)
            as_ = fx.get("goals", {}).get("away", 0)
            live.append(_match_stub(
                sport="football", match_id=mid, status="live",
                league=league, series=league, start_time=start,
                home_name=home, away_name=away, home_score=hs, away_score=as_
            ))
        # upcoming (next)
        up = []
        today = dt.date.today().isoformat()
        r_up = await self.client.get(f"{self.base}/fixtures?date={today}&status=NS")
        j_up = r_up.json()
        for fx in (j_up.get("response", []) or []):
            mid = str(fx.get("fixture", {}).get("id", ""))
            league = fx.get("league", {}).get("name", "Football")
            start = fx.get("fixture", {}).get("date", None)
            home = fx.get("teams", {}).get("home", {}).get("name", "")
            away = fx.get("teams", {}).get("away", {}).get("name", "")
            up.append(_match_stub(
                sport="football", match_id=mid, status="upcoming",
                league=league, series=league, start_time=start,
                home_name=home, away_name=away
            ))
        # finished (status FT)
        fin = []
        r_fin = await self.client.get(f"{self.base}/fixtures?date={today}&status=FT")
        j_fin = r_fin.json()
        for fx in (j_fin.get("response", []) or []):
            mid = str(fx.get("fixture", {}).get("id", ""))
            league = fx.get("league", {}).get("name", "Football")
            start = fx.get("fixture", {}).get("date", None)
            home = fx.get("teams", {}).get("home", {}).get("name", "")
            away = fx.get("teams", {}).get("away", {}).get("name", "")
            hs = fx.get("goals", {}).get("home", 0)
            as_ = fx.get("goals", {}).get("away", 0)
            fin.append(_match_stub(
                sport="football", match_id=mid, status="finished",
                league=league, series=league, start_time=start,
                home_name=home, away_name=away, home_score=hs, away_score=as_
            ))
        return {"live": live, "upcoming": up, "finished": fin}

    async def matches(self, status: str) -> List[Dict[str, Any]]:
        data = await self.home()
        if status == "all":
            return data["live"] + data["upcoming"] + data["finished"]
        return data.get(status, [])

    async def scorecard(self, match_id: str) -> Dict[str, Any]:
        r = await self.client.get(f"{self.base}/fixtures?id={match_id}")
        j = r.json()
        if not j.get("response"):
            return {"id": match_id, "sport": "football", "status": "unknown", "score": {}, "commentary": []}
        fx = j["response"][0]
        hs = fx.get("goals", {}).get("home", 0)
        as_ = fx.get("goals", {}).get("away", 0)
        return {
            "id": match_id, "sport": "football", "status": fx.get("fixture", {}).get("status", {}).get("short", "").lower(),
            "score": {"home": {"goals": hs}, "away": {"goals": as_}},
            "commentary": [],
        }

    async def schedule(self, start: dt.date, days: int) -> List[Dict[str, Any]]:
        out = []
        for i in range(days):
            d = (start + dt.timedelta(days=i)).isoformat()
            r = await self.client.get(f"{self.base}/fixtures?date={d}")
            j = r.json()
            day_matches = []
            for fx in (j.get("response", []) or []):
                mid = str(fx.get("fixture", {}).get("id", ""))
                league = fx.get("league", {}).get("name", "Football")
                start_iso = fx.get("fixture", {}).get("date", None)
                home = fx.get("teams", {}).get("home", {}).get("name", "")
                away = fx.get("teams", {}).get("away", {}).get("name", "")
                day_matches.append(_match_stub(
                    sport="football", match_id=mid, status="upcoming",
                    league=league, series=league, start_time=start_iso,
                    home_name=home, away_name=away
                ))
            out.append({"date": d, "matches": day_matches})
        return out


# --------- Provider selector ----------
def _provider_for(sport: str):
    sport = sport.lower()
    if sport == "cricket":
        if CRICKET_PROVIDER == "rapidapi" and RAPIDAPI_KEY:
            try:
                return CricketRapidAPI()
            except Exception:
                return DemoProvider("cricket")
        return DemoProvider("cricket")
    if sport in ("football", "soccer"):
        if FOOTBALL_PROVIDER in ("apisports", "api-sports", "api_sports") and FOOTBALL_KEY:
            try:
                return FootballAPISports()
            except Exception:
                return DemoProvider("football")
        return DemoProvider("football")
    # Add more sports later (basketball, tennis, etc.) -> default demo
    return DemoProvider(sport)


# --------- REST endpoints ----------
@router.get("/ping")
def ping():
    return {
        "cricket_provider": CRICKET_PROVIDER or "demo",
        "football_provider": FOOTBALL_PROVIDER or "demo",
        "has_cricket_key": bool(RAPIDAPI_KEY),
        "has_football_key": bool(FOOTBALL_KEY),
    }

@router.get("/{sport}/home")
async def home(sport: str):
    prov = _provider_for(sport)
    try:
        return await prov.home()
    except Exception as e:
        raise HTTPException(503, detail=f"{sport.capitalize()} provider error: {e}")

@router.get("/{sport}/matches")
async def matches(
    sport: str,
    status: str = Query("live", regex="^(live|upcoming|finished|all)$")
):
    prov = _provider_for(sport)
    try:
        return await prov.matches(status)
    except Exception as e:
        raise HTTPException(503, detail=f"{sport.capitalize()} provider error: {e}")

@router.get("/{sport}/scorecard/{match_id}")
async def scorecard(sport: str, match_id: str):
    prov = _provider_for(sport)
    try:
        return await prov.scorecard(match_id)
    except Exception as e:
        raise HTTPException(503, detail=f"{sport.capitalize()} provider error: {e}")

@router.get("/{sport}/schedule")
async def schedule(
    sport: str,
    date: Optional[str] = None,
    days: int = 7
):
    prov = _provider_for(sport)
    try:
        start = dt.date.fromisoformat(date) if date else dt.date.today()
        return await prov.schedule(start, days)
    except Exception as e:
        raise HTTPException(503, detail=f"{sport.capitalize()} provider error: {e}")


# --------- Additional unified endpoints (paths under /api/sports/...) ---------


@router.get("/live-matches")
async def live_matches(sport: str = "all", format: str = "all"):
    """Return live matches across sports or for a specific sport."""
    out = []
    sports_to_query = [sport] if sport != "all" else ["cricket", "football"]
    for s in sports_to_query:
        prov = _provider_for(s)
        try:
            ms = await prov.matches("live")
            for m in ms:
                m.setdefault("format", format)
            out.extend(ms)
        except Exception:
            continue
    return out


@router.get("/matches/{match_id}/")
async def match_details(match_id: str):
    """Try to find a match across known sports by id and return its detail."""
    for s in ("cricket", "football"):
        prov = _provider_for(s)
        try:
            allm = await prov.matches("all")
            for m in allm:
                if str(m.get("id")) == match_id or (m.get("id") and str(m.get("id")) == match_id):
                    return m
        except Exception:
            continue
    # fallback stub
    return _match_stub(sport="generic", match_id=match_id, status="unknown")


@router.get("/matches/{match_id}/scorecard/")
async def match_scorecard(match_id: str):
    # try providers
    for s in ("cricket", "football"):
        prov = _provider_for(s)
        try:
            sc = await prov.scorecard(match_id)
            if sc and sc.get("id"):
                return sc
        except Exception:
            continue
    return {"id": match_id, "score": {}}


@router.get("/matches/{match_id}/commentary/")
async def match_commentary(match_id: str):
    sc = await match_scorecard(match_id)
    return sc.get("commentary", [])


@router.get("/matches/{match_id}/streaming/")
async def match_streaming(match_id: str):
    # In demo mode we return a placeholder streaming URL metadata
    return {"id": match_id, "streams": [{"quality": "480p", "url": f"https://example.com/stream/{match_id}"}]}


@router.get("/upcoming-matches")
async def upcoming_matches(sport: str = "all", days: int = 7):
    sports_to_query = [sport] if sport != "all" else ["cricket", "football"]
    out = []
    start = dt.date.today()
    for s in sports_to_query:
        prov = _provider_for(s)
        try:
            out.extend(await prov.schedule(start, days))
        except Exception:
            continue
    return out


@router.get("/recent-matches")
async def recent_matches(sport: str = "all", limit: int = 20):
    out = []
    for s in ([sport] if sport != "all" else ["cricket", "football"]):
        prov = _provider_for(s)
        try:
            ms = await prov.matches("finished")
            out.extend(ms[:limit])
        except Exception:
            continue
    return out


@router.get("/categories/")
def sports_categories():
    return [{"id": "cricket", "label": "Cricket"}, {"id": "football", "label": "Football"}]


@router.get("/leagues")
def sports_leagues(sport: str = "cricket"):
    # demo leagues
    return [f"{sport.capitalize()} League", f"{sport.capitalize()} Cup"]


@router.get("/teams/{team_id}")
def team_details(team_id: str):
    return {"id": team_id, "name": f"Team {team_id}", "sport": "generic"}


@router.get("/teams/{team_id}/squad")
def team_squad(team_id: str, tournament: Optional[str] = None):
    return {"team_id": team_id, "tournament": tournament, "players": [{"id": f"p{n}", "name": f"Player {n}"} for n in range(1,12)]}


@router.get("/players/{player_id}/")
def player_profile(player_id: str):
    return {"id": player_id, "name": f"Player {player_id}", "bio": "Demo player"}


@router.get("/players/{player_id}/stats")
def player_stats(player_id: str, format: str = "all"):
    return {"id": player_id, "format": format, "stats": {"matches": random.randint(0,200)}}


@router.get("/tournaments/{tournament_id}/")
def tournament_details(tournament_id: str):
    return {"id": tournament_id, "name": f"Tournament {tournament_id}"}


@router.get("/tournaments/{tournament_id}/standings/")
def tournament_standings(tournament_id: str):
    return {"tournament_id": tournament_id, "standings": []}


@router.get("/tournaments/{tournament_id}/schedule/")
def tournament_schedule(tournament_id: str):
    return {"tournament_id": tournament_id, "schedule": []}


_alerts_subscribers = set()

@router.get("/alerts/")
def match_alerts():
    return {"subscribers": len(_alerts_subscribers)}


@router.post("/alerts/subscribe/")
def subscribe_alerts(user: Optional[str] = None):
    if user:
        _alerts_subscribers.add(user)
    return {"ok": True, "subscribers": len(_alerts_subscribers)}


@router.post("/alerts/unsubscribe/")
def unsubscribe_alerts(user: Optional[str] = None):
    if user and user in _alerts_subscribers:
        _alerts_subscribers.discard(user)
    return {"ok": True, "subscribers": len(_alerts_subscribers)}


@router.get("/news")
def sports_news(sport: str = "all", limit: int = 20):
    return [{"id": f"n{i}", "title": f"{sport} news {i}"} for i in range(limit)]


@router.get("/venues/{venue_id}")
def venue_details(venue_id: str):
    return {"id": venue_id, "name": f"Venue {venue_id}", "city": "Demo"}


@router.get("/matches/{match_id}/highlights/")
def match_highlights(match_id: str):
    return {"id": match_id, "highlights": []}


@router.get("/matches/{match_id}/videos/")
def match_videos(match_id: str):
    return {"id": match_id, "videos": []}


@router.get("/matches/{match_id}/predictions/")
def match_predictions(match_id: str):
    return {"id": match_id, "prediction": "50-50"}


@router.get("/head-to-head")
def head_to_head(team1: str, team2: str):
    return {"team1": team1, "team2": team2, "history": []}


@router.get("/fantasy/matches/{match_id}/players/")
def fantasy_players(match_id: str):
    return {"match_id": match_id, "players": []}


@router.get("/fantasy/players/{player_id}/matches/{match_id}/points/")
def fantasy_points(player_id: str, match_id: str):
    return {"player_id": player_id, "match_id": match_id, "points": 0}


# --------- WebSocket live push ----------
@router.websocket("/ws/{sport}/{match_id}")
async def ws_live(websocket: WebSocket, sport: str, match_id: str):
    await websocket.accept()
    prov = _provider_for(sport)
    try:
        while True:
            try:
                sc = await prov.scorecard(match_id)
                await websocket.send_json({"type": "score_update", "data": sc})
            except Exception as inner:
                await websocket.send_json({"type": "error", "error": str(inner)})
            await asyncio.sleep(5)
    except WebSocketDisconnect:
        return
