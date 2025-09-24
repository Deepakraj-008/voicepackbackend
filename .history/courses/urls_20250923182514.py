# courses/urls.py
from django.urls import path
from . import views
urlpatterns = [
    path("courses/", views.list_courses),                # ?name=
    path("user_courses/", views.user_courses),
    path("subscribe/", views.subscribe),
    path("unsubscribe/<int:course_id>/", views.unsubscribe),
    path("user_settings/", views.user_settings),
]

# exams/urls.py
from django.urls import path
from . import views
urlpatterns = [
    path("start_exam/", views.start_exam),
    path("submit_exam/", views.submit_exam),
    path("exam_result/<int:exam_id>/", views.exam_result),
    path("all_exam_results/", views.exam_history),       # ?user_course_id=&page=&page_size=
    path("get_exam_result/<str:test_id>/", views.exam_result_legacy), # (your old URL had //api/, fixed here)
    path("course_performance/", views.course_perf),
    path("course_performance/compare/", views.course_perf_compare),
]

# flashcards/urls.py
from django.urls import path
from . import views
urlpatterns = [
    path("flashcards/counters/", views.counters),    # ?course_subscription_id=
    path("flashcards/cards/", views.cards),          # ?course_subscription_id=&subject_id=&chapter_id=&type=&page=&page_size=
    path("flashcards/answer/", views.answer),
]

# feedbacks/urls.py
from django.urls import path
from . import views
urlpatterns = [
    path("feedback/reasons/", views.reasons),
    path("feedback/", views.create),
]

# payments/urls.py
from django.urls import path
from . import views
urlpatterns = [
    path("v1/payments/history/", views.history),
]
