from fastapi import APIRouter, Depends
from datetime import datetime
from sqlmodel import Session
from ..deps import current_user
from ..db import get_session
from ..models import User

router = APIRouter(prefix="/v1/account")

@router.post("/delete/request")
def req(db: Session = Depends(get_session), user: User = Depends(current_user)):
    user.is_active = True  # keep active; just mark time if you store it
    db.add(user); db.commit()
    return {"detail":"requested"}

@router.post("/delete/cancel")
def cancel():
    return {"detail":"cancelled"}

@router.get("/delete/status")
def status():
    return {"status":"none"}
