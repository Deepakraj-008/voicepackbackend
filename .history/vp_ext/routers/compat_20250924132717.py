from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from ..deps import current_user
from ..db import get_session
from ..models import SessionRun, StudySchedule, Course, Lesson, User

router = APIRouter()


@router.post('/learning/session/')
def learning_session(payload: dict, db: Session = Depends(get_session), user: User = Depends(current_user)):
    # create a SessionRun similar to existing sessions.start
    course_id = payload.get('course_id')
    s = SessionRun(user_id=user.id, course_id=course_id)
    db.add(s); db.commit(); db.refresh(s)
    return {'session_id': s.id, 'question': {'id': 1, 'q': 'Demo Q', 'choices': ['A','B']}}


@router.get('/study/schedule/')
def get_study_schedule(db: Session = Depends(get_session), user: User = Depends(current_user)):
    rows = db.exec(select(StudySchedule).where(StudySchedule.user_id==user.id)).all()
    return {'results':[r.dict() for r in rows]}


@router.post('/study/schedule/')
def post_study_schedule(payload: dict, db: Session = Depends(get_session), user: User = Depends(current_user)):
    s = StudySchedule(user_id=user.id, course_id=payload.get('course_id'), title=payload.get('title','Study'), start_at=payload.get('start_at'), end_at=payload.get('end_at'))
    db.add(s); db.commit(); db.refresh(s)
    return {'id': s.id}


@router.get('/app/splash/')
def splash_config():
    return {'splash': {'title': 'VoicePack', 'image': ''}}


@router.get('/home/dashboard/')
def home_dashboard():
    return {'courses': [], 'progress': {}}


@router.get('/profile/settings/')
def profile_settings():
    return {'settings': {}}


@router.get('/voice/onboarding/')
def voice_onboarding():
    return {'steps': []}


@router.post('/voice/chat/')
def voice_chat(payload: dict):
    return {'reply': 'demo reply'}


@router.get('/progress/analytics/')
def progress_analytics():
    return {'analytics': {}}


@router.get('/auth/registration-flow/')
def registration_flow():
    return {'flow': 'simple'}


@router.get('/voice/dashboard/')
def voice_dashboard():
    return {'voice': {}}


@router.get('/schedule/manager/')
def schedule_manager():
    return {'manager': {}}


@router.get('/courses/detail/')
def course_detail_generic(cid: int | None = None, db: Session = Depends(get_session)):
    if not cid:
        return {'detail': None}
    c = db.get(Course, cid)
    if not c:
        raise HTTPException(404, 'not found')
    lessons = db.exec(select(Lesson).where(Lesson.course_id==cid)).all()
    return {'id': c.id, 'name': c.name, 'lessons': [l.dict() for l in lessons]}


@router.get('/courses/catalog/')
def course_catalog(db: Session = Depends(get_session)):
    rows = db.exec(select(Course).where(Course.is_active==True)).all()
    return {'results':[{'id':r.id,'name':r.name} for r in rows]}


@router.get('/sports/crex/')
def crex_hub():
    return {'crex': 'hub'}


@router.get('/sports/crex/match/{match_id}/')
def crex_match(match_id: str):
    return {'id': match_id, 'detail': 'crex match'}


@router.get('/sports/crex/series/{series_key}/')
def crex_series(series_key: str):
    return {'series': series_key, 'matches': []}
