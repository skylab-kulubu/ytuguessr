from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey
from core.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True)
    score = Column(Integer, default=0)
    completed = Column(Boolean, default=False)
    show_name = Column(Boolean, default=False)
    ip_address = Column(String, nullable=True)

class Location(Base):
    __tablename__ = "locations"
    id = Column(Integer, primary_key=True)
    image_url = Column(String)
    lat = Column(Float)
    lng = Column(Float)

class Guess(Base):
    __tablename__ = "guesses"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    location_id = Column(Integer, ForeignKey("locations.id"))
    guessed_lat = Column(Float, nullable=True)
    guessed_lng = Column(Float, nullable=True)
    distance = Column(Float, nullable=True)
    started_at = Column(Float, nullable=True)
    time_taken = Column(Float, nullable=True)
    score = Column(Float, nullable=True)