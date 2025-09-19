# app.py
import os, uuid
from pathlib import Path
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from dotenv import load_dotenv

from utils.audio import ensure_ffmpeg, convert_to_16k_wav
from utils.cache import SimpleCache
from asr import VoskASR
from nlu import classify_intent
from actions import run_action
from tts_service import TTSService

BASE = Path(__file__).resolve().parent
TMP_DIR = BASE / "tmp"
TTS_DIR = BASE / "tts_cache"
MODEL_DIR = BASE / os.getenv("MODEL_DIR", "models/vosk-model-small-en-us-0.15")

TMP_DIR.mkdir(exist_ok=True)
TTS_DIR.mkdir(exist_ok=True)

load_dotenv()
app = FastAPI(title="Mini Voice Assistant")
CORS = os.getenv("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in CORS],
    allow_methods=["*"],
    allow_headers=["*"],
)

if not ensure_ffmpeg():
    print("!!! ffmpeg missing or not in PATH; audio conversion will fail.")

# Load ASR + TTS once
asr = VoskASR(MODEL_DIR)
tts = TTSService(TTS_DIR, lang=os.getenv("TTS_LANG", "en"))
cache = SimpleCache(TTS_DIR)

@app.get("/healthz")
def health():
    return {"ok": True}

@app.post("/v1/assist")
async def assist(file: UploadFile = File(...)):
    # save upload
    uid = uuid.uuid4().hex
    in_path = TMP_DIR / f"{uid}_{file.filename}"
    with open(in_path, "wb") as f:
        f.write(await file.read())

    wav_path = TMP_DIR / f"{uid}.wav"
    try:
        convert_to_16k_wav(in_path, wav_path)
    except Exception as e:
        return JSONResponse({"error": "ffmpeg conversion failed", "detail": str(e)}, status_code=500)

    try:
        transcript = asr.transcribe_wav(wav_path)
    except Exception as e:
        return JSONResponse({"error": "ASR failed", "detail": str(e)}, status_code=500)

    intent, entities = classify_intent(transcript)
    reply = run_action(intent, entities)

    # TTS cache on reply text
    out_path = cache.get_path({"reply": reply, "lang": tts.lang}, ".mp3")
    if not out_path.exists():
        try:
            tts.synth(reply, out_path.name)
        except Exception:
            # If TTS fails, we still return text
            return {"transcript": transcript, "intent": intent, "reply": reply}

    # cleanup tmp
    try:
        in_path.unlink(missing_ok=True); wav_path.unlink(missing_ok=True)
    except Exception:
        pass

    return {
        "transcript": transcript,
        "intent": intent,
        "entities": entities,
        "reply": reply,
        "tts_url": f"/v1/tts/{out_path.name}"
    }

@app.get("/v1/tts/{fname}")
def serve_tts(fname: str):
    p = TTS_DIR / fname
    if not p.exists():
        return JSONResponse({"error": "not found"}, status_code=404)
    return FileResponse(str(p), media_type="audio/mpeg")
