from sqlalchemy.orm import Session
from sqlalchemy.sql.expression import func
from models.models import Location
from core.config import settings
import math

def get_random_locations(db: Session):
    return db.query(Location).order_by(func.random()).limit(settings.LOCATION_COUNT).all()

def calculate_score(distance, duration):
    if duration <= settings.QUESTION_DURATION / 12:
        duration = 0
    else:
        duration -= settings.QUESTION_DURATION / 12

    return math.exp(-settings.ALPHA * distance) * math.exp(-settings.BETA * duration) * 1000