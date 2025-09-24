# ================== VP EXT AUTO-MOUNT (append-only) ==================
from vp_ext.routers import sports
app.include_router(sports.router, prefix="/api/sports", tags=["sports"])




def _mount_vp_ext(_app):
    try:
        from vp_ext.db import create_db_and_tables
        from vp_ext.routers import (
            app_meta, auth, profile, courses, sessions, schedules,
            analytics, live, chat, payments, account, dashboard
        )

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

try:
    _mount_vp_ext(app)  # 'app' must be your FastAPI() instance from this module
except NameError:
    print("[vp_ext] ERROR: FastAPI instance 'app' not found in this module.")
# =====================================================================
