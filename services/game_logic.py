from sqlalchemy.orm import Session
from sqlalchemy.sql.expression import func
from models.models import Location
from core.config import settings
import math
from core.utils import haversine

# Map boundaries
BOUNDS = [
    (41.032344, 28.883054),
    (41.020792, 28.899499),
]

def get_random_locations(db: Session):
    return db.query(Location).order_by(func.random()).limit(settings.LOCATION_COUNT).all()

def calculate_score(distance_km, duration_sec):
    if distance_km is None or distance_km < 0:
        return 0.0

    duration_capped = min(duration_sec, settings.QUESTION_DURATION)

    max_distance = haversine(BOUNDS[0][0], BOUNDS[0][1], BOUNDS[1][0], BOUNDS[1][1])

    if max_distance <= 0:
        max_distance = 1.0

    normalized_distance = min(distance_km / max_distance, 1.0)
    normalized_time = duration_capped / settings.QUESTION_DURATION

    score = math.exp(-settings.ALPHA * normalized_distance) * math.exp(-settings.BETA * normalized_time) * 1000
    return score
