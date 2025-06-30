from fastapi import APIRouter, Depends, Request, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from schemas.schemas import StartGameRequest, GuessRequest
from core.database import SessionLocal
from core.config import settings
from models.models import User, Guess, Location
from services.game_logic import get_random_locations, calculate_score
from core.utils import create_jwt, decode_jwt, haversine
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

@router.post("/guess")
def make_guess(data: GuessRequest, request: Request, db: Session = Depends(get_db)):
    user = decode_jwt(request, db)

    guess = db.query(Guess).filter_by(user_id=user.id, distance=None).first()
    if not guess:
        raise HTTPException(status_code=400, detail="Tahmin yapılacak konum kalmadı.")

    location = db.query(Location).filter_by(id=guess.location_id).first()
    now = datetime.now(timezone.utc).timestamp()

    if guess.started_at is None:
        raise HTTPException(status_code=400, detail="Soru başlatılmadan tahmin yapılamaz.")
    
    distance = haversine(data.latitude, data.longitude, location.lat, location.lng)
    duration = now - guess.started_at
    score = calculate_score(distance, duration)
    if duration > settings.QUESTION_DURATION:
        score = 0

    guess.guessed_lat = data.latitude
    guess.guessed_lng = data.longitude
    guess.distance = distance
    guess.time_taken = duration
    guess.score = score
    user.score += score
    db.commit()

    total_answered = db.query(Guess).filter(Guess.user_id == user.id, Guess.distance != None).count()
    if total_answered >= settings.LOCATION_COUNT:
        user.completed = True
        db.commit()

    return {
        "current_score": user.score,
        "distance_km": distance,
        "time_sec": duration,
        "question_number": total_answered
    }

@router.post("/next")
def get_next_location(request: Request, db: Session = Depends(get_db)):
    user = decode_jwt(request, db)

    guess = db.query(Guess).filter_by(user_id=user.id, distance=None).first()
    if not guess:
        return {"message": "Tüm konumlar işaretlendi."}
    
    location = db.query(Location).filter_by(id=guess.location_id).first()

    if guess.started_at is None:
        guess.started_at = datetime.now(timezone.utc).timestamp()
        db.commit()

    return {"image_url": location.image_url}