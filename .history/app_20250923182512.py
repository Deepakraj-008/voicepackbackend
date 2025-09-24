# app.py  (C:\Users\91812\Desktop\Deepak\voicepackbackend\app.py)

from fastapi import FastAPI, UploadFile, File, APIRouter, HTTPException, Query
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import subprocess, uuid, json, time, importlib.util, sys

# Optional libs (TTS/ASR)
try:
    from gtts import gTTS
except Exception:
    gTTS = None

try:
    from vosk import Model, KaldiRecognizer
except Exception:
    Model = KaldiRecognizer = None

# --------------------------------------------------------------------------------------
# Paths & optional Vosk model
# --------------------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent
TMP_DIR = BASE_DIR / "tmp"
TTS_DIR = BASE_DIR / "tts_cache"
MODEL_PATH = BASE_DIR / "models" / "vosk-model-small-en-us-0.15"  # adjust if different

TMP_DIR.mkdir(exist_ok=True)
TTS_DIR.mkdir(exist_ok=True)

if Model:
    if not MODEL_PATH.exists():
        print(f"[WARN] Vosk model not found at {MODEL_PATH}. /transcribe will still work for TTS-only.")
    else:
        print(f"[ok] Vosk model present: {MODEL_PATH}")

# --------------------------------------------------------------------------------------
# FastAPI app + CORS
# --------------------------------------------------------------------------------------
app = FastAPI(title="VoicePack Backend", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

# --------------------------------------------------------------------------------------
# ALWAYS-ON debug helpers (so you can verify what’s running)
# --------------------------------------------------------------------------------------
@app.get("/__whoami")
def __whoami():
    return {"file": __file__, "cwd": str(Path.cwd()), "sys_path0": sys.path[0]}

@app.get("/debug/routes")
def debug_routes():
    # list all registered routes at runtime
    return sorted({getattr(r, "path", "") for r in app.routes})

# --------------------------------------------------------------------------------------
# Helpers for ASR/TTS
# --------------------------------------------------------------------------------------
def have_ffmpeg() -> bool:
    try:
        subprocess.run(["ffmpeg", "-version"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=False)
        return True
    except Exception:
        return False

def convert_to_wav(input_path: str, out_path: str):
    cmd = ["ffmpeg", "-y", "-i", input_path, "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", out_path]
    subprocess.run(cmd, check=True)

def transcribe_wav(wav_path: str) -> str:
    if not (Model and KaldiRecognizer and MODEL_PATH.exists()):
        return ""  # ASR unavailable
    rec = KaldiRecognizer(Model(str(MODEL_PATH)), 16000)
    txt = ""
    with open(wav_path, "rb") as f:
        chunk = f.read(4000)
        while chunk:
            if rec.AcceptWaveform(chunk):
                res = json.loads(rec.Result())
                txt += " " + res.get("text", "")
            chunk = f.read(4000)
    final = json.loads(rec.FinalResult())
    txt += " " + final.get("text", "")
    return txt.strip()

def nlu(text: str):
    t = (text or "").lower().strip()
    if any(k in t for k in ["time", "what time"]):
        from datetime import datetime
        return "get_time", f"The time is {datetime.now().strftime('%I:%M %p')}"
    if any(k in t for k in ["weather", "forecast", "temperature"]):
        return "get_weather", "Weather skill not wired yet. Add a free API later."
    if not t:
        return "empty", "I didn't catch that. Please try again."
    return "small_talk", "I'm your assistant. Ask me the time or about the weather."

# --------------------------------------------------------------------------------------
# Core endpoints
# --------------------------------------------------------------------------------------
@app.get("/")
def root():
    return {"status": "ok", "docs": "/docs"}

@app.get("/health")
def health():
    return {
        "ok": True,
        "ffmpeg": have_ffmpeg(),
        "model_exists": bool(Model and MODEL_PATH.exists()),
        "tts": bool(gTTS),
    }

@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    uid = uuid.uuid4().hex
    raw_path = TMP_DIR / f"{uid}_{file.filename}"
    with open(raw_path, "wb") as f:
        f.write(await file.read())

    wav_path = TMP_DIR / f"{uid}.wav"
    try:
        convert_to_wav(str(raw_path), str(wav_path))
    except Exception as e:
        return JSONResponse({"error": "ffmpeg conversion failed", "detail": str(e)}, status_code=500)

    text = transcribe_wav(str(wav_path))
    intent, reply = nlu(text)

    out = {"transcript": text, "intent": intent, "response_text": reply}
    if gTTS:
        try:
            tts_file = f"{uid}.mp3"
            tts_path = TTS_DIR / tts_file
            gTTS(reply).save(str(tts_path))
            out["tts_url"] = f"/tts/{tts_file}"
        except Exception:
            pass

    try:
        raw_path.unlink(missing_ok=True)
        wav_path.unlink(missing_ok=True)
    except Exception:
        pass
    return out

@app.get("/tts/{name}")
def serve_tts(name: str):
    p = TTS_DIR / name
    if not p.exists():
        return JSONResponse({"error": "not found"}, status_code=404)
    return FileResponse(str(p), media_type="audio/mpeg")

# --------------------------------------------------------------------------------------
# vp_ext mounting (prefers your package, falls back to built-ins)
# --------------------------------------------------------------------------------------
def _mount_vp_ext(_app: FastAPI):
    print("\n=== [_mount_vp_ext] starting ===")
    print("cwd:", Path.cwd())
    print("__file__:", __file__)
    print("sys.path[0]:", sys.path[0])

    try:
        spec = importlib.util.find_spec("vp_ext")
        print("find_spec('vp_ext') ->", spec)

        if spec is None:
            raise ImportError("Package 'vp_ext' not found on sys.path")

        # real routers (if your vp_ext package exists)
        from vp_ext.db import create_db_and_tables
        from vp_ext.routers import sports, app_meta

        _app.include_router(app_meta.router,  prefix="/api",        tags=["app"])
        _app.include_router(sports.router,    prefix="/api/sports", tags=["sports"])

        @_app.on_event("startup")
        def _vp_ext_bootstrap():
            print("[vp_ext] creating tables…")
            create_db_and_tables()
            print("[vp_ext] tables ready")

        print("[vp_ext] mounted OK (real routers)")

    except Exception as e:
        # fallback routers (no external package needed)
        print("[vp_ext] MOUNT FAILED -> using FALLBACK routers")
        print("ERROR:", e)
        import traceback; traceback.print_exc()

        import httpx
        sports_fallback = APIRouter()
        app_meta_fallback = APIRouter()
        _CACHE: dict[str, tuple[float, object]] = {}

        def _ttl_get(key: str, ttl_sec: int, fetch):
            now = time.time()
            item = _CACHE.get(key)
            if item and now - item[0] < ttl_sec:
                return item[1]
            val = fetch()
            _CACHE[key] = (now, val)
            return val

        # ---- app/config
        @app_meta_fallback.get("/app/config")
        def app_config():
            return {
                "appName": "VoicePack",
                "version": "0.1.0",
                "features": {"sports": True, "voice": True, "tts": True, "asr": True},
                "endpoints": {
                    "health": "/health",
                    "transcribe": "/transcribe",
                    "tts": "/tts/{name}",
                    "sports_home": "/api/sports/cricket/home",
                    "sports_matches": "/api/sports/cricket/matches?status={live|upcoming|finished|all}",
                },
                "note": "served by fallback router (vp_ext import failed)"
            }

        # ---- cricket (Cricbuzz only)
        def _fetch_cricbuzz_live() -> dict:
            url = "https://mapps.cricbuzz.com/cbzios/match/livematches"
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

        def _aggregate(status: str) -> list[dict]:
            ttl = 30 if status == "live" else 120
            def fetch():
                items = []
                try:
                    items += _normalize_cricbuzz(_fetch_cricbuzz_live())
                except Exception:
                    pass
                if not items:
                    raise HTTPException(503, "No cricket provider available right now (fallback).")
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

        @sports_fallback.get("/cricket/matches")
        def cricket_matches(status: str = Query("live")):
            if status not in ("live", "upcoming", "finished", "all"):
                status = "live"
            return {"results": _aggregate(status)}

        @sports_fallback.get("/cricket/home")
        def cricket_home():
            live = _aggregate("live")
            upcoming = _aggregate("upcoming")
            finished = _aggregate("finished")
            top = (live or upcoming or finished)[:5]
            return {
                "top": top,
                "counters": {"live": len(live), "upcoming": len(upcoming), "finished": len(finished)},
                "note": "served by fallback router (vp_ext import failed)"
            }

        _app.include_router(app_meta_fallback, prefix="/api",        tags=["app"])
        _app.include_router(sports_fallback,   prefix="/api/sports", tags=["sports"])
        print("[vp_ext] fallback routers mounted")

print(">>> calling _mount_vp_ext")
_mount_vp_ext(app)
print(">>> _mount_vp_ext returned")
