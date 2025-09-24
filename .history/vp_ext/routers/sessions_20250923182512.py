from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from ..deps import current_user
from ..db import get_session
from ..models import SessionRun, User

router = APIRouter(prefix="/sessions")

@router.post("/start")
def start(payload: dict, db: Session = Depends(get_session), user: User = Depends(current_user)):
    course_id = payload.get("course_id")
    s = SessionRun(user_id=user.id, course_id=course_id)
    db.add(s); db.commit(); db.refresh(s)
    # return a first question stub; replace with your logic
    return {"session_id": s.id, "question":{"id":1,"q":"2+2?","choices":["3","4","5"]}}

@router.post("/{sid}/answer")
def answer(sid: int, payload: dict, db: Session = Depends(get_session), user: User = Depends(current_user)):
    if not db.get(SessionRun, sid): raise HTTPException(404, "session not found")
    correct = payload.get("answer") == "4"
    return {"correct": correct, "next":{"id":2,"q":"5*3?","choices":["10","15","20"]}}

@router.post("/{sid}/finish")
def finish(sid: int, payload: dict, db: Session = Depends(get_session), user: User = Depends(current_user)):
    s = db.get(SessionRun, sid)
    if not s: raise HTTPException(404, "session not found")
    s.score = float(payload.get("score", 0))
    db.add(s); db.commit()
    return {"detail":"finished","score": s.score}
