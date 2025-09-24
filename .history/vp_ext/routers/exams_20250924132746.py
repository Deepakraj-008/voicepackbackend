from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from ..db import get_session
from ..deps import current_user
from ..models import SessionRun, User

router = APIRouter()


@router.post('/start_exam/')
def start_exam(payload: dict, db: Session = Depends(get_session), user: User = Depends(current_user)):
    # simple stub: create a SessionRun
    s = SessionRun(user_id=user.id, course_id=payload.get('course_id'))
    db.add(s); db.commit(); db.refresh(s)
    return {'exam_session_id': s.id}


@router.post('/submit_exam/')
def submit_exam(payload: dict, db: Session = Depends(get_session), user: User = Depends(current_user)):
    sid = payload.get('session_id')
    if not sid:
        raise HTTPException(400, 'missing session_id')
    s = db.get(SessionRun, sid)
    if not s:
        raise HTTPException(404, 'session not found')
    s.score = float(payload.get('score', 0))
    db.add(s); db.commit()
    return {'detail': 'submitted', 'score': s.score}


@router.get('/get_user_counters/')
def get_user_counters(user: User = Depends(current_user)):
    return {'counters': {'attempts': 0}}


@router.post('/adaptive/start/')
def adaptive_start(payload: dict, user: User = Depends(current_user)):
    return {'adaptive_session': 'started'}


@router.post('/adaptive/preload/')
def adaptive_preload(payload: dict, user: User = Depends(current_user)):
    return {'preloaded': True}


@router.get('/exam_result/{exam_id}/')
def exam_result(exam_id: int, db: Session = Depends(get_session), user: User = Depends(current_user)):
    s = db.get(SessionRun, exam_id)
    if not s:
        raise HTTPException(404, 'not found')
    return {'id': s.id, 'score': s.score}


@router.get('/all_exam_results/')
def all_exam_results(user_course_id: int | None = None, page: int = 1, page_size: int = 20, db: Session = Depends(get_session), user: User = Depends(current_user)):
    q = select(SessionRun).where(SessionRun.user_id==user.id)
    rows = db.exec(q).all()
    return {'results': [{'id':r.id,'score':r.score} for r in rows]}
