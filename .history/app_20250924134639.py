from fastapi import FastAPI, UploadFile, File
from fastapi.responses import FileResponse, JSONResponse
from pathlib import Path
import subprocess, uuid, json, os, sys
from gtts import gTTS
from vosk import Model, KaldiRecognizer
import vp_ext.routers.sports as sports
import vp_ext.routers.ai as ai


BASE_DIR = Path(__file__).resolve().parent
TMP_DIR = BASE_DIR / "tmp"
TTS_DIR = BASE_DIR / "tts_cache"
MODEL_PATH = BASE_DIR / "models" / "vosk-model-small-en-us-0.15"  # adjust only if your folder name differs

TMP_DIR.mkdir(exist_ok=True)
TTS_DIR.mkdir(exist_ok=True)

if not MODEL_PATH.exists():
    raise RuntimeError(f"Vosk model not found at {MODEL_PATH}")
else:
    print(f"[ok] Vosk model present: {MODEL_PATH}")

app = FastAPI()


# ================== VP EXT AUTO-MOUNT ==================
def _mount_vp_ext(_app):
    """Mount extension routers and do basic startup work. Keep this block unchanged later."""
    print("\n>>> calling _mount_vp_ext\n")
    try:
        import importlib.util
        print("=== [_mount_vp_ext] starting ===")
        print("cwd:", os.getcwd())
        print("__file__:", __file__)
        print("sys.path[0]:", sys.path[0] if sys.path else "")
        spec = importlib.util.find_spec("vp_ext")
        print("find_spec('vp_ext') ->", spec)

        # Import routers explicitly (avoid __init__ export issues)
        import vp_ext.routers.sports as sports
        import vp_ext.routers.ai as ai

        @_app.get("/")
        def _root():
            return {"status": "ok", "docs": "/docs"}

        # Mount routers
        _app.include_router(sports.router, prefix="/api/sports", tags=["sports"])
        _app.include_router(ai.router,     prefix="/api/ai",     tags=["ai"])

        # Try to mount admin UI (optional)
        try:
            from vp_ext.admin import mount_admin
            mount_admin(_app)
        except Exception as e:
            print("[app] admin mount skipped:", e)

        # DB (safe no-op if not present)
        @_app.on_event("startup")
        def _vp_ext_bootstrap():
            try:
                from vp_ext.db import create_db_and_tables
                print("[vp_ext] creating tables…")
                create_db_and_tables()
                print("[vp_ext] tables ready")
            except Exception as e:
                print("[vp_ext] DB init skipped/failed:", e)

        # Debug helper to list all routes
        @_app.get("/debug/routes")
        def _debug_routes():
            return sorted({r.path for r in _app.routes})

        print("[vp_ext] mounted OK (real routers)")
    except Exception as e:
        import traceback
        print("[vp_ext] Mount FAILED:", e)
        traceback.print_exc()


# IMPORTANT: this call actually mounts everything
_mount_vp_ext(app)
# =======================================================


def have_ffmpeg() -> bool:
    try:
        subprocess.run(
            ["ffmpeg", "-version"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=False,
        )
        return True
    except Exception:
        return False


def convert_to_wav(input_path: str, out_path: str):
    cmd = ["ffmpeg", "-y", "-i", input_path, "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", out_path]
    subprocess.run(cmd, check=True)


def transcribe_wav(wav_path: str) -> str:
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
    t = text.lower()
    if any(k in t for k in ["time", "what time"]):
        from datetime import datetime
        return "get_time", f"The time is {datetime.now().strftime('%I:%M %p')}"
    if any(k in t for k in ["weather", "forecast", "temperature"]):
        return "get_weather", "Weather skill not wired yet. Add a free API later."
    if not t:
        return "empty", "I didn't catch that. Please try again."
    return "small_talk", "I'm your assistant. Ask me the time or about the weather."


@app.get("/health")
def health():
    return {"ok": True, "ffmpeg": have_ffmpeg(), "model_exists": MODEL_PATH.exists()}


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

    # TTS
    tts_file = f"{uid}.mp3"
    tts_path = TTS_DIR / tts_file
    out = {"transcript": text, "intent": intent, "response_text": reply}
    try:
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
