from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from ..deps import current_user
from ..db import get_session
from ..models import User, UserCourse, SessionRun

router = APIRouter(prefix="/dashboard")

@router.get("/summary")
def summary(db: Session = Depends(get_session), user: User = Depends(current_user)):
    subs = db.exec(select(UserCourse).where(UserCourse.user_id==user.id)).all()
    sessions = db.exec(select(SessionRun).where(SessionRun.user_id==user.id)).all()
    return {
        "user": {"email": user.email, "name": user.full_name},
        "courses_count": len(subs),
        "sessions_count": len(sessions),
        "next_actions": ["Start Learning Session", "Review Flashcards", "Check Schedule"]
    }
