from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from datetime import datetime, timedelta
from typing import Optional
from ..deps import current_user
from ..db import get_session
from ..models import User, StudySchedule

router = APIRouter()

@router.get("/schedules")
def list_schedules(db: Session = Depends(get_session), user: User = Depends(current_user)):
    rows = db.exec(select(StudySchedule).where(StudySchedule.user_id==user.id)).all()
    return {"results":[r.dict() for r in rows]}

@router.post("/schedules")
def create_schedule(payload: dict, db: Session = Depends(get_session), user: User = Depends(current_user)):
    s = StudySchedule(user_id=user.id,
                      course_id=payload.get("course_id"),
                      title=payload.get("title","Study"),
                      start_at=datetime.fromisoformat(payload["start_at"]),
                      end_at=datetime.fromisoformat(payload["end_at"]))
    db.add(s); db.commit(); db.refresh(s)
    return {"id": s.id}

@router.get("/schedules/upcoming")
def upcoming(db: Session = Depends(get_session), user: User = Depends(current_user)):
    now = datetime.utcnow()
    rows = db.exec(select(StudySchedule).where(StudySchedule.user_id==user.id, StudySchedule.start_at>=now).order_by(StudySchedule.start_at)).all()
    return {"results":[r.dict() for r in rows[:10]]}
