from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from ..deps import current_user
from ..db import get_session
from ..models import User, UserSettings

router = APIRouter()

@router.get("/profile_details/")
def profile_me(user: User = Depends(current_user)):
    return {"email": user.email, "full_name": user.full_name}

@router.put("/profile_details/")
def profile_update(payload: dict, db: Session = Depends(get_session), user: User = Depends(current_user)):
    user.full_name = payload.get("full_name", user.full_name)
    db.add(user); db.commit()
    return {"detail":"updated"}

@router.get("/user_settings/")
def get_settings(db: Session = Depends(get_session), user: User = Depends(current_user)):
    s = db.exec(select(UserSettings).where(UserSettings.user_id==user.id)).first()
    return {"language": s.language, "tts_voice": s.tts_voice, "theme": s.theme}

@router.put("/user_settings/")
def set_settings(payload: dict, db: Session = Depends(get_session), user: User = Depends(current_user)):
    s = db.exec(select(UserSettings).where(UserSettings.user_id==user.id)).first()
    if payload.get("language"): s.language = payload["language"]
    if payload.get("tts_voice"): s.tts_voice = payload["tts_voice"]
    if payload.get("theme"): s.theme = payload["theme"]
    db.add(s); db.commit()
    return {"detail":"settings_saved"}
