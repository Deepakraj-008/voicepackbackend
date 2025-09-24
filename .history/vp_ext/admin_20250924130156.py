from fastapi import FastAPI
from sqladmin import Admin, ModelView
from vp_ext.db import get_engine
import vp_ext.models as models


class UserAdmin(ModelView, model=models.User):
    column_list = ["id", "email", "full_name", "is_active"]


class UserSettingsAdmin(ModelView, model=models.UserSettings):
    column_list = ["id", "user_id", "language", "tts_voice", "theme"]


class CourseAdmin(ModelView, model=models.Course):
    column_list = ["id", "name", "is_active"]


class LessonAdmin(ModelView, model=models.Lesson):
    column_list = ["id", "course_id", "title", "order"]


class UserCourseAdmin(ModelView, model=models.UserCourse):
    column_list = ["id", "user_id", "course_id", "created_at"]


class SessionRunAdmin(ModelView, model=models.SessionRun):
    column_list = ["id", "user_id", "course_id", "started_at", "finished_at", "score"]


class FlashcardAdmin(ModelView, model=models.Flashcard):
    column_list = ["id", "course_id", "front", "back", "ftype"]


class FeedbackReasonAdmin(ModelView, model=models.FeedbackReason):
    column_list = ["id", "label"]


class FeedbackAdmin(ModelView, model=models.Feedback):
    column_list = ["id", "user_id", "reason_id", "message", "created_at"]


class PaymentAdmin(ModelView, model=models.Payment):
    column_list = ["id", "user_id", "amount", "status", "created_at"]


class StudyScheduleAdmin(ModelView, model=models.StudySchedule):
    column_list = ["id", "user_id", "course_id", "title", "start_at", "end_at"]


class TeamAdmin(ModelView, model=models.Team):
    column_list = ["id", "name", "sport", "country"]


class PlayerAdmin(ModelView, model=models.Player):
    column_list = ["id", "team_id", "full_name", "position", "jersey"]


class MatchAdmin(ModelView, model=models.Match):
    column_list = ["id", "external_id", "sport", "status", "league", "series", "start_time", "home_team_id", "away_team_id", "home_score", "away_score"]


def mount_admin(app: FastAPI):
    """Mount sqladmin admin app onto the FastAPI app under /admin.

    This will be a no-op if sqladmin isn't installed or DB not configured.
    """
    try:
        engine = get_engine()
        admin = Admin(app, engine=engine, title="VP-Ext Admin")

        # Register all ModelViews
        admin.add_view(UserAdmin)
        admin.add_view(UserSettingsAdmin)
        admin.add_view(CourseAdmin)
        admin.add_view(LessonAdmin)
        admin.add_view(UserCourseAdmin)
        admin.add_view(SessionRunAdmin)
        admin.add_view(FlashcardAdmin)
        admin.add_view(FeedbackReasonAdmin)
        admin.add_view(FeedbackAdmin)
        admin.add_view(PaymentAdmin)
    admin.add_view(StudyScheduleAdmin)
        admin.add_view(TeamAdmin)
        admin.add_view(PlayerAdmin)
        admin.add_view(MatchAdmin)
    except Exception as e:
        print("[vp_ext.admin] admin mount skipped:", e)
