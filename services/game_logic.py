from sqlalchemy.orm import Session
from sqlalchemy.sql.expression import func
from models.models import Location
from core.config import settings

def get_random_locations(db: Session):
    return db.query(Location).order_by(func.random()).limit(settings.LOCATION_COUNT).all()