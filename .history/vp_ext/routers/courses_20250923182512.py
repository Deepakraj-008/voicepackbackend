from fastapi import APIRouter, Depends, Query, HTTPException
from sqlmodel import Session, select
from ..db import get_session
from ..deps import current_user
from ..models import Course, Lesson, UserCourse, User

router = APIRouter()

@router.get("/courses/")
def list_courses(name: str = Query(default="", alias="name"), db: Session = Depends(get_session)):
    q = select(Course).where(Course.is_active == True)
    if name: q = q.where(Course.name.ilike(f"%{name}%"))
    items = db.exec(q).all()
    return {"results":[{"id":c.id,"name":c.name,"description":c.description} for c in items]}

@router.get("/courses/{cid}/detail")
def course_detail(cid: int, db: Session = Depends(get_session)):
    c = db.get(Course, cid)
    if not c: raise HTTPException(404, "course not found")
    lessons = db.exec(select(Lesson).where(Lesson.course_id==cid).order_by(Lesson.order)).all()
    return {"id": c.id, "name": c.name, "description": c.description,
            "lessons":[{"id":l.id,"title":l.title,"content":l.content,"order":l.order} for l in lessons]}

@router.get("/user_courses/")
def my_courses(db: Session = Depends(get_session), user: User = Depends(current_user)):
    rows = db.exec(select(UserCourse).where(UserCourse.user_id==user.id)).all()
    return {"results":[{"id":r.id,"course_id":r.course_id} for r in rows]}

@router.post("/subscribe/")
def subscribe(payload: dict, db: Session = Depends(get_session), user: User = Depends(current_user)):
    cid = int(payload.get("course_id"))
    if not db.get(Course, cid): raise HTTPException(404,"course not found")
    if db.exec(select(UserCourse).where(UserCourse.user_id==user.id, UserCourse.course_id==cid)).first():
        return {"detail":"already_subscribed"}
    uc = UserCourse(user_id=user.id, course_id=cid)
    db.add(uc); db.commit()
    return {"detail":"subscribed"}

@router.delete("/unsubscribe/{cid}/")
def unsubscribe(cid: int, db: Session = Depends(get_session), user: User = Depends(current_user)):
    row = db.exec(select(UserCourse).where(UserCourse.user_id==user.id, UserCourse.course_id==cid)).first()
    if row: db.delete(row); db.commit()
    return {"detail":"unsubscribed"}
