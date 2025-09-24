# accounts/urls.py
from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

urlpatterns = [
    path("token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("registration/", views.register),
    path("registration_otp/", views.send_otp),
    path("verify/", views.verify_otp),
    path("validate_email/", views.validate_email),
    path("password-reset/request-otp/", views.reset_request),
    path("password-reset/reset/", views.reset_confirm),
    path("auth/google/", views.google_login),
    path("profile_details/", views.profile_details),
]
