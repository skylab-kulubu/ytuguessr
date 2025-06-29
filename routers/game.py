from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from schemas.schemas import StartGameRequest
from core.database import SessionLocal
from models.models import User, Guess
from services.game_logic import get_random_locations
from core.utils import create_jwt
import re

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/start")
def start_game(data: StartGameRequest, db: Session = Depends(get_db)):
    if not re.fullmatch(r".+@(std\.)?yildiz\.edu\.tr", data.school_mail.lower()):
        raise HTTPException(status_code=400, detail="Sadece yildiz.edu.tr uzantılı mailler kabul edilir.")

    if db.query(User).filter_by(email=data.school_mail.lower()).first():
        raise HTTPException(status_code=400, detail="Bu mail ile zaten oynandı.")
    
    user = User(email=data.school_mail.lower(), show_name=data.show_name)
    db.add(user)
    db.commit()

    locations = get_random_locations(db)
    for loc in locations:
        db.add(Guess(user_id=user.id, location_id=loc.id))
    db.commit()

    token = create_jwt(user.email)

    response = JSONResponse(content={"message": "Oyun başlatıldı."})
    response.set_cookie(
        key="session",
        value=token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=2592000
    )
    return response