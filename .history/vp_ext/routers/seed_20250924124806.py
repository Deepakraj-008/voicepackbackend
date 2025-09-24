from sqlmodel import Session, text
from vp_ext.db import get_engine
from vp_ext.models import Course, Lesson

engine = get_engine()

with Session(engine) as s:
    # simple check if courses table has rows
    try:
        has = s.exec(text("select id from course")).first()
    except Exception:
        has = None
    if not has:
        c1 = Course(name="Flutter Basics", description="Widgets, Layout, State")
        c2 = Course(name="Dart Fundamentals", description="Language, OOP, Futures")
        s.add(c1); s.add(c2); s.commit(); s.refresh(c1); s.refresh(c2)
        s.add_all([
            Lesson(course_id=c1.id, title="Stateless vs Stateful", order=1),
            Lesson(course_id=c1.id, title="Layouts 101", order=2),
            Lesson(course_id=c2.id, title="Classes & Mixins", order=1),
        ])
        s.commit()

print("seeded")
