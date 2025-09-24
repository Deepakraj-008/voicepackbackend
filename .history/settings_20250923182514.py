# voicepackbackend/settings.py
from pathlib import Path
import environ, os
env = environ.Env(
    DEBUG=(bool, True),
    SECRET_KEY=(str, "dev-secret"),
    ALLOWED_HOSTS=(list, ["*"]),
    CORS_ALLOWED_ORIGINS=(list, []),
    REDIS_URL=(str, "redis://127.0.0.1:6379/0"),
    NEWS_API_KEY=(str, ""),            # optional (NewsData/GNews/etc)
)
environ.Env.read_env(os.path.join(Path(__file__).resolve().parent, ".env"))

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = env("SECRET_KEY")
DEBUG = env("DEBUG")
ALLOWED_HOSTS = env.list("ALLOWED_HOSTS", default=["*"])

INSTALLED_APPS = [
    "django.contrib.admin","django.contrib.auth","django.contrib.contenttypes",
    "django.contrib.sessions","django.contrib.messages","django.contrib.staticfiles",
    "rest_framework","corsheaders","django_filters","drf_spectacular","channels",
    "accounts","courses","exams","flashcards","feedbacks","payments","live",
]
MIDDLEWARE = ["corsheaders.middleware.CorsMiddleware","django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware","django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware","django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware","django.middleware.clickjacking.XFrameOptionsMiddleware",
]
ROOT_URLCONF = "voicepackbackend.urls"
TEMPLATES = [{ "BACKEND":"django.template.backends.django.DjangoTemplates","DIRS":[],
               "APP_DIRS":True,"OPTIONS":{"context_processors":[
                   "django.template.context_processors.debug",
                   "django.template.context_processors.request",
                   "django.contrib.auth.context_processors.auth",
                   "django.contrib.messages.context_processors.messages"]}}]
WSGI_APPLICATION = "voicepackbackend.wsgi.application"
ASGI_APPLICATION = "voicepackbackend.asgi.application"

DATABASES = {
    "default": {"ENGINE":"django.db.backends.sqlite3","NAME": BASE_DIR/"db.sqlite3"}
}

# CORS for your Flutter app (Android emulator/web)
CORS_ALLOW_ALL_ORIGINS = True  # tighten in prod

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_FILTER_BACKENDS": ["django_filters.rest_framework.DjangoFilterBackend"],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
}
SPECTACULAR_SETTINGS = {"TITLE":"VoicePack API","VERSION":"1.0.0"}

# Static
STATIC_URL = "static/"

# Cache / Celery
CACHES = {"default": {"BACKEND": "django_redis.cache.RedisCache","LOCATION": env("REDIS_URL"),
                      "OPTIONS": {"CLIENT_CLASS": "django_redis.client.DefaultClient"}}}
CELERY_BROKER_URL = env("REDIS_URL")
CELERY_RESULT_BACKEND = env("REDIS_URL")

# Channels (WebSocket)
CHANNEL_LAYERS = {"default": {"BACKEND": "channels_redis.core.RedisChannelLayer",
                              "CONFIG": {"hosts": [env("REDIS_URL")]}}}

# JWT lifetimes optional via SIMPLE_JWT (defaults ok)
