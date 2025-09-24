from fastapi import APIRouter, Depends
from pydantic import BaseModel
from ..deps import current_user
from ..models import User
import os

router = APIRouter(prefix="/chat")

class ChatIn(BaseModel):
    message: str

@router.post("/send")
def chat_send(data: ChatIn, user: User = Depends(current_user)):
    # simple stub; plug your LLM here (OpenAI/OpenRouter/etc.)
    msg = data.message.lower()
    if "course" in msg:
        answer = "You can browse courses in Course Catalog."
    else:
        answer = "Hi! Ask me about your schedule, courses, or progress."
    return {"reply": answer}
