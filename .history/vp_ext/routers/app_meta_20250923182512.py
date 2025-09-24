from fastapi import APIRouter

router = APIRouter()

@router.get("/app/config")
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
    }

@router.get("/app/ping")
def app_ping():
    return {"ok": True}
