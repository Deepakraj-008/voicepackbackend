# voicepackbackend/asgi.py
import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from django.urls import re_path
from live.consumers import LiveConsumer

os.environ.setdefault('DJANGO_SETTINGS_MODULE','voicepackbackend.settings')
django_asgi_app = get_asgi_application()

application = ProtocolTypeRouter({
  "http": django_asgi_app,
  "websocket": URLRouter([ re_path(r"^ws/live/$", LiveConsumer.as_asgi()) ]),
})
