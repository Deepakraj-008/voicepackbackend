from typing import Generator
from sqlmodel import SQLModel, create_engine, Session
from .settings import ExtSettings
from . import models

_engine = None

def get_engine():
    global _engine
    if _engine is None:
        settings = ExtSettings()
        url = settings.DATABASE_URL or "sqlite:///./vp_ext.db"
        # Normalize common incorrect sqlite URL forms like: sqlite://./db.sqlite3
        if url.startswith("sqlite://") and not url.startswith("sqlite:///"):
            url = url.replace("sqlite://", "sqlite:///", 1)
        _engine = create_engine(url, echo=False)
    return _engine

def create_db_and_tables():
    """Create the database file (if sqlite) and all SQLModel tables.

    This is safe to call multiple times.
    """
    engine = get_engine()
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a database session.

    Usage:
        db: Session = Depends(get_session)
    """
    engine = get_engine()
    with Session(engine) as session:
        yield session

