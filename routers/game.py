from fastapi import APIRouter, Depends, Request, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy import func
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from schemas.game import StartGameRequest, GuessRequest
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
def start_game(data: StartGameRequest, request: Request, db: Session = Depends(get_db)):
    user = None

    if data.again:
        try:
            current_user = decode_jwt(request, db)
        except HTTPException:
            raise HTTPException(status_code=401, detail="Oturum geçersiz.")

        if not current_user.completed:
            raise HTTPException(status_code=400, detail="Oyun tamamlanmadan tekrar başlatılamaz.")

        user = User(
            email=current_user.email,
            show_name=current_user.show_name,
            ip_address=request.client.host,
            score=0.0,
            completed=False
        )
    else:
        if not data.school_mail:
            raise HTTPException(status_code=400, detail="Okul maili gereklidir.")

        if not re.fullmatch(r".+@(std\.)?yildiz\.edu\.tr", data.school_mail.lower()):
            raise HTTPException(status_code=400, detail="Sadece yildiz.edu.tr uzantılı mailler kabul edilir.")
        
        user = User(
            email=data.school_mail.lower(),
            show_name=data.show_name,
            ip_address=request.client.host,
            score=0.0,
            completed=False
        )

    db.add(user)
    db.commit()
    db.refresh(user)

    locations = get_random_locations(db)
    for loc in locations:
        db.add(Guess(user_id=user.id, location_id=loc.id))
    db.commit()

    token = create_jwt(user.id)
    
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

@router.post("/next")
def get_next_location(request: Request, db: Session = Depends(get_db)):
    user = decode_jwt(request, db)
    now = datetime.now(timezone.utc).timestamp()

    guess = (
        db.query(Guess)
        .filter_by(user_id=user.id, distance=None)
        .filter(Guess.started_at.isnot(None))
        .first()
    )

    if not guess:
        guess = (
            db.query(Guess)
            .filter_by(user_id=user.id, distance=None)
            .order_by(Guess.id.asc())
            .first()
        )
        if not guess:
            return {"message": "Tüm konumlar işaretlendi."}
        guess.started_at = now
        db.commit()

    location = db.query(Location).filter_by(id=guess.location_id).first()
    time_left = max(0, settings.QUESTION_DURATION - (now - guess.started_at))

    total_answered = db.query(Guess).filter(Guess.user_id == user.id, Guess.distance != None).count()
    question_number = total_answered + 1

    return {
        "question_number": question_number,
        "image_url": location.image_url,
        "time_left": time_left
    }

@router.post("/guess")
def make_guess(data: GuessRequest, request: Request, db: Session = Depends(get_db)):
    user = decode_jwt(request, db)

    guess = (
        db.query(Guess)
        .filter_by(user_id=user.id, distance=None)
        .order_by(Guess.id.asc())
        .first()
    )

    if not guess:
        raise HTTPException(status_code=400, detail="Tahmin yapılacak konum kalmadı.")

    if guess.started_at is None:
        raise HTTPException(status_code=400, detail="Soru başlatılmadan tahmin yapılamaz.")

    location = db.query(Location).filter_by(id=guess.location_id).first()
    now = datetime.now(timezone.utc).timestamp()

    score = 0
    distance = -1
    duration = now - guess.started_at

    if duration <= settings.QUESTION_DURATION:
        distance = haversine(data.latitude, data.longitude, location.lat, location.lng)
        score = calculate_score(distance, duration)
        
    guess.guessed_lat = data.latitude
    guess.guessed_lng = data.longitude
    guess.distance = distance
    guess.time_taken = duration
    guess.score = score
    user.score += score
    db.commit()
    db.refresh(user)

    total_answered = db.query(Guess).filter(Guess.user_id == user.id, Guess.distance != None).count()
    if total_answered >= settings.LOCATION_COUNT:
        user.completed = True
        db.commit()

    return {
        "question_number": total_answered,
        "current_score": user.score,
        "earned_score": score,
        "distance_km": distance,
        "actual_lat": location.lat,
        "actual_lng": location.lng,
        "time_sec": duration
    }

@router.get("/status")
def game_status(request: Request, db: Session = Depends(get_db)):
    try:
        user = decode_jwt(request, db)
    except HTTPException:
        return {"has_active_game": False}

    active_guess = (
        db.query(Guess)
        .filter_by(user_id=user.id)
        .filter(Guess.distance == None)
        .first()
    )

    has_active_game = active_guess is not None

    response = {
        "has_active_game": has_active_game,
        "email": user.email,
    }

    if has_active_game:
        total_answered = db.query(Guess).filter(
            Guess.user_id == user.id,
            Guess.distance != None
        ).count()

        response["current_score"] = user.score
        response["question_number"] = total_answered + 1

    return response

@router.get("/summary")
def get_summary(request: Request, db: Session = Depends(get_db)):
    user = decode_jwt(request, db)

    if not user.completed:
        raise HTTPException(status_code=400, detail="Kullanıcı oyunu henüz tamamlamamış.")

    guesses = (
        db.query(Guess)
        .filter_by(user_id=user.id)
        .filter(Guess.distance != None)
        .order_by(Guess.id.asc())
        .all()
    )

    total_distance = 0
    total_duration = 0
    total_score = 0

    details = []
    for g in guesses:
        detail = {
            "distance_km": g.distance,
            "time_sec": g.time_taken,
            "score": g.score,
        }
        details.append(detail)
        if g.distance != -1:
            total_distance += g.distance
        total_duration += g.time_taken
        total_score += g.score

    return {
        "summary": {
            "total_distance_km": total_distance,
            "total_time_sec": total_duration,
            "total_score": total_score,
        },
        "guesses": details
    }

@router.get("/leaderboard")
def get_leaderboard(request: Request, page: int = 1, db: Session = Depends(get_db)):
    try:
        current_user = decode_jwt(request, db)
    except HTTPException:
        current_user = None

    page_size = settings.LEADERBOARD_PAGE_SIZE
    offset = (page - 1) * page_size

    subquery = (
        db.query(
            User.email,
            func.max(User.score).label("max_score")
        )
        .filter(User.completed == True)
        .group_by(User.email)
        .subquery()
    )

    users = (
        db.query(User)
        .join(
            subquery,
            (User.email == subquery.c.email) & (User.score == subquery.c.max_score)
        )
        .order_by(User.score.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )

    total_users = db.query(User.email).filter(User.completed == True).distinct().count()

    def is_number_username(email: str):
        username = email.split("@")[0]
        return bool(re.fullmatch(r"[a-zA-Z]?\d+", username))

    def format_name(email: str, show: bool):
        username = email.split("@")[0]
        if is_number_username(email):
            return username if show else username[:2] + "*" * (len(username) - 2)
        cleaned = re.sub(r"[^a-zA-Z.]", "", username)
        parts = [p for p in cleaned.split(".") if p]
        if not parts:
            return "ANONIM"
        if show:
            return " ".join(part.upper() for part in parts)
        else:
            return " ".join(
                part.upper() if len(part) <= 2 else part[:2].upper() + "*" * (len(part) - 2)
                for part in parts
            )

    leaderboard = [
        {
            "name": format_name(user.email, user.show_name),
            "score": user.score,
            "is_me": current_user is not None and user.email == current_user.email
        }
        for user in users
    ]

    user_rank = None
    if current_user:
        best_score = (
            db.query(func.max(User.score))
            .filter(User.email == current_user.email, User.completed == True)
            .scalar()
        )
        if best_score is not None:
            higher_count = (
                db.query(User.email)
                .join(
                    subquery,
                    (User.email == subquery.c.email) & (User.score == subquery.c.max_score)
                )
                .filter(User.score > best_score)
                .count()
            )
            user_rank = higher_count + 1

    return {
        "page": page,
        "total_pages": (total_users + page_size - 1) // page_size,
        "total_users": total_users,
        "leaderboard": leaderboard,
        "user_rank": user_rank
    }