from sqlmodel import SQLModel, create_engine
from .settings import ExtSettings
from . import models

_engine = None

def get_engine():
    global _engine
    if _engine is None:
        settings = ExtSettings()
        _engine = create_engine(settings.DATABASE_URL, echo=False)
    return _engine

def create_db_and_tables():
    """Create the database file (if sqlite) and all SQLModel tables.

    This is safe to call multiple times.
    """
    engine = get_engine()
    SQLModel.metadata.create_all(engine)

