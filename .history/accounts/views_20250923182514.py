# accounts/views.py (stubs; fill real logic later)
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

@api_view(["POST"])
@permission_classes([AllowAny])
def register(req): return Response({"ok": True})

@api_view(["POST"])
@permission_classes([AllowAny])
def send_otp(req): return Response({"message":"OTP sent"})

@api_view(["POST"])
@permission_classes([AllowAny])
def verify_otp(req): return Response({"verified": True})

@api_view(["POST"])
@permission_classes([AllowAny])
def validate_email(req): return Response({"valid": True})

@api_view(["POST"])
@permission_classes([AllowAny])
def reset_request(req): return Response({"message":"reset OTP sent"})

@api_view(["POST"])
@permission_classes([AllowAny])
def reset_confirm(req): return Response({"message":"password updated"})

@api_view(["POST"])
@permission_classes([AllowAny])
def google_login(req): return Response({"token":"jwt-here"})

@api_view(["GET","PUT"])
@permission_classes([IsAuthenticated])
def profile_details(req): return Response({"profile": {"name": req.user.username}})
