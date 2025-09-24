"""Helper module to mount vp_ext routers into an existing FastAPI app.

This module intentionally does not assume a global `app` object at import
time. Call `_mount_vp_ext(app)` from your FastAPI application (see
project `app.py`) to safely include routers and perform startup tasks.
"""
from typing import Any

from vp_ext.routers import sports, ai  # these are safe to import at module load


def _mount_vp_ext(_app: Any):
    """Mount extension routers and perform basic startup work.

    This mirrors the previous behavior but avoids referencing `app`
    at import time which caused NameError on module import.
    """
    try:
        from vp_ext.db import create_db_and_tables
        from vp_ext.routers import (
            app_meta, auth, profile, courses, sessions, schedules,
            analytics, live, chat, payments, account, dashboard, exams
        )
        from vp_ext.routers import compat

        @_app.get("/")
        def _root():
            return {"status": "ok", "docs": "/docs"}

        _app.include_router(app_meta.router,   prefix="/api",      tags=["app"])
        _app.include_router(auth.router,       prefix="/api",      tags=["auth"])
        _app.include_router(profile.router,    prefix="/api",      tags=["profile"])
        _app.include_router(courses.router,    prefix="/api",      tags=["courses"])
        _app.include_router(sessions.router,   prefix="/api",      tags=["sessions"])
        _app.include_router(schedules.router,  prefix="/api",      tags=["schedules"])
        _app.include_router(analytics.router,  prefix="/api",      tags=["analytics"])
        _app.include_router(live.router,       prefix="/api/live", tags=["live"])
        _app.include_router(chat.router,       prefix="/api",      tags=["chat"])
        _app.include_router(payments.router,   prefix="/api",      tags=["payments"])
        _app.include_router(account.router,    prefix="/api",      tags=["account"])
        _app.include_router(dashboard.router,  prefix="/api",      tags=["dashboard"])

        # Also include the specialized routers for AI and Sports under
        # the short prefixes expected by the Flutter client.
        _app.include_router(sports.router, prefix="/api/sports", tags=["sports"])
        _app.include_router(ai.router,     prefix="/api/ai",     tags=["ai"])
    _app.include_router(compat.router, prefix="/api",         tags=["compat"])
    _app.include_router(exams.router,  prefix="/api",         tags=["exams"])

        # Mount admin UI if available
        try:
            from vp_ext.admin import mount_admin
            mount_admin(_app)
        except Exception as exc:
            print("[vp_ext] admin mount skipped:", exc)

        @_app.on_event("startup")
        def _vp_ext_bootstrap():
            create_db_and_tables()

        @_app.get("/debug/routes")
        def _debug_routes():
            return sorted({r.path for r in _app.routes})

        print("[vp_ext] Routers mounted successfully.")
    except Exception as e:
        import traceback
        print("[vp_ext] Mount FAILED:", e)
        traceback.print_exc()

# Nothing is executed at import time. Call `_mount_vp_ext(app)` from
# your primary application module (this is already done by `app.py`).
