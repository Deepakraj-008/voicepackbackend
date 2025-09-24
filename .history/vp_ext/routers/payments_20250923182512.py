from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from ..deps import current_user
from ..db import get_session
from ..models import Payment, User

router = APIRouter(prefix="/v1/payments")

@router.get("/history/")
def history(db: Session = Depends(get_session), user: User = Depends(current_user)):
    rows = db.exec(select(Payment).where(Payment.user_id==user.id)).all()
    return {"results":[{"id":p.id,"amount":p.amount,"status":p.status,"created_at":str(p.created_at)} for p in rows]}
