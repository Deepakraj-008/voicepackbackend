# live/tasks.py
from celery import shared_task
from django.core.cache import cache
from .views import ai_news  # or reimplement pure fetchers
# You can create dedicated fetch functions and set cache keys here.
@shared_task
def warm_ai_news():
    # call your fetcher and put into cache under a known key
    pass
