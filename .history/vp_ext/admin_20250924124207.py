from fastapi import FastAPI
from sqladmin import Admin, ModelView
from sqlmodel import Session
from .db import get_engine
from . import models

# Minimal ModelViews
class UserAdmin(ModelView, model=models.User):
    column_list = ["id", "email", "full_name", "is_active"]

class TeamAdmin(ModelView, model=models.Team):
    column_list = ["id", "name", "sport", "country"]

class MatchAdmin(ModelView, model=models.Match):
    column_list = ["id", "external_id", "sport", "status", "league", "start_time"]


def mount_admin(app: FastAPI):
    """Mount sqladmin admin app onto the FastAPI app under /admin.

    This will be a no-op if sqladmin isn't installed or DB not configured.
    """
    try:
        engine = get_engine()
        admin = Admin(app, engine=engine, title="VP-Ext Admin")
        admin.add_view(UserAdmin)
        admin.add_view(TeamAdmin)
        admin.add_view(MatchAdmin)
    except Exception as e:
        print("[vp_ext.admin] admin mount skipped:", e)
