# live/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path("live/weather/", views.weather),       # ?city=&lat=&lon=&limit=
    path("live/news/", views.news),             # ?topic=world&limit=20
    path("live/sports/", views.sports),         # ?sport=cricket&team=&limit=
    path("live/trending/", views.trending),     # general trends (Google Trends)
    path("ai/news/", views.ai_news),            # all AI feeds merged
    path("ai/community/", views.ai_community),  # curated community posts (RSS/Reddit/etc)
    path("ai/trending/", views.ai_trending),    # trending models/papers
]
