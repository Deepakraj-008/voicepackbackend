from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Annotated
from pydantic import constr as _constr
from sqlmodel import Session, select
from ..db import get_session
from ..models import User, UserSettings
from ..security import make_token, hash_password, verify_password
from ..settings import ExtSettings

router = APIRouter()
settings = ExtSettings()
OTP: dict[str,str] = {}

class RegisterIn(BaseModel):
    email: Annotated[str, _constr(strip_whitespace=True, min_length=5)]
    password: str
    full_name: str | None = None

class LoginIn(BaseModel):
    email: Annotated[str, _constr(strip_whitespace=True, min_length=5)]
    password: str

@router.post("/registration/")
def registration(data: RegisterIn, db: Session = Depends(get_session)):
    if db.exec(select(User).where(User.email == data.email)).first():
        raise HTTPException(409, "email exists")
    u = User(email=data.email, password_hash=hash_password(data.password), full_name=data.full_name)
    db.add(u); db.commit(); db.refresh(u)
    db.add(UserSettings(user_id=u.id)); db.commit()
    return {"detail":"registered"}

@router.post("/registration_otp/")
def registration_otp(payload: dict):
    email = payload.get("email")
    OTP[email] = "123456"
    return {"detail":"otp_sent"}

@router.post("/verify/")
def verify(payload: dict):
    return {"verified": OTP.get(payload.get("email")) == payload.get("otp")}

@router.post("/validate_email/")
def validate_email(payload: dict, db: Session = Depends(get_session)):
    exists = db.exec(select(User).where(User.email == payload.get("email"))).first()
    return {"valid": exists is None}

@router.post("/token/")
def login(data: LoginIn, db: Session = Depends(get_session)):
    u = db.exec(select(User).where(User.email == data.email)).first()
    if not u or not verify_password(data.password, u.password_hash):
        raise HTTPException(401, "bad credentials")
    return {
      "access":  make_token(u.email, settings.ACCESS_TOKEN_EXPIRE_MIN),
      "refresh": make_token(u.email, settings.REFRESH_TOKEN_EXPIRE_MIN)
    }

@router.post("/token/refresh/")
def refresh(_payload: dict):
    # in real impl decode refresh & re-issue
    return {"access": make_token("refresh-user", settings.ACCESS_TOKEN_EXPIRE_MIN),
            "refresh": make_token("refresh-user", settings.REFRESH_TOKEN_EXPIRE_MIN)}
