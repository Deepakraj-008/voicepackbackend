from fastapi import APIRouter, Depends
from sqlmodel import Session, select, func
from ..deps import current_user
from ..db import get_session
from ..models import SessionRun, User

router = APIRouter(prefix="/analytics")

@router.get("/progress")
def progress(db: Session = Depends(get_session), user: User = Depends(current_user)):
    rows = db.exec(select(SessionRun)).all()
    total = len(rows)
    avg = sum([r.score or 0 for r in rows])/total if total else 0
    series = [{"label":"Week 1","value":60},{"label":"Week 2","value":70},{"label":"Week 3","value":75}]
    return {"total_sessions": total, "avg_score": avg, "series": series}
