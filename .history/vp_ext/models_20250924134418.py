from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    password_hash: str
    full_name: Optional[str] = None
    is_active: bool = True

    settings: Optional["UserSettings"] = Relationship(back_populates="user")

class UserSettings(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    language: str = "en"
    tts_voice: Optional[str] = None
    theme: str = "light"
    user: User = Relationship(back_populates="settings")

class Course(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    description: Optional[str] = None
    is_active: bool = True

class Lesson(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    course_id: int = Field(foreign_key="course.id", index=True)
    title: str
    content: Optional[str] = None
    order: int = 0

class UserCourse(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    course_id: int = Field(foreign_key="course.id", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class SessionRun(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    course_id: Optional[int] = None
    started_at: datetime = Field(default_factory=datetime.utcnow)
    finished_at: Optional[datetime] = None
    score: Optional[float] = None


class StudySchedule(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    course_id: Optional[int] = None
    title: str
    start_at: datetime
    end_at: datetime

class Flashcard(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    course_id: int = Field(foreign_key="course.id", index=True)
    subject_id: Optional[int] = None
    chapter_id: Optional[int] = None
    front: str
    back: str
    ftype: Optional[str] = None  # "new", "weak", etc.

class FeedbackReason(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    label: str

class Feedback(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    reason_id: int = Field(foreign_key="feedbackreason.id")
    message: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Payment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    amount: float
    status: str = "success"
    created_at: datetime = Field(default_factory=datetime.utcnow)


# ----------------- Sports related models -----------------
class Team(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    country: Optional[str] = None
    sport: Optional[str] = "generic"


class Player(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    team_id: Optional[int] = Field(foreign_key="team.id")
    full_name: str
    position: Optional[str] = None
    jersey: Optional[str] = None


class Match(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    external_id: Optional[str] = Field(index=True, default=None)
    sport: str = "cricket"
    status: str = "upcoming"  # live|upcoming|finished
    league: Optional[str] = None
    series: Optional[str] = None
    start_time: Optional[datetime] = None
    home_team_id: Optional[int] = Field(foreign_key="team.id")
    away_team_id: Optional[int] = Field(foreign_key="team.id")
    home_score: Optional[str] = None
    away_score: Optional[str] = None


class ChatMessage(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: Optional[int] = Field(foreign_key="user.id", default=None)
    role: str = "user"  # user | assistant | system
    prompt: Optional[str] = None
    response: Optional[str] = None
    provider: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

