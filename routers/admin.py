from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from typing import List

from core.database import SessionLocal
from core.utils import verify_admin_key
from models.models import Event, Location, Guess, User
from schemas.admin import (
    EventCreate, EventDetail, EventUpdate, LocationDetail, LocationCreate, LocationUpdate,
)

router = APIRouter(dependencies=[Depends(verify_admin_key)])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/locations", response_model=List[LocationDetail])
def list_locations(db: Session = Depends(get_db)):
    return db.query(Location).all()

@router.post("/locations", response_model=LocationCreate)
def create_location(data: LocationCreate, db: Session = Depends(get_db)):
    location = Location(**data.model_dump())
    db.add(location)
    db.commit()
    db.refresh(location)
    return location

@router.put("/locations/{location_id}", response_model=LocationCreate)
def update_location(location_id: int, data: LocationUpdate, db: Session = Depends(get_db)):
    location = db.query(Location).filter_by(id=location_id).first()
    if not location:
        raise HTTPException(status_code=404, detail="Konum bulunamadı.")
    
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(location, key, value)
    
    db.commit()
    db.refresh(location)
    return location

@router.delete("/locations/{location_id}")
def delete_location(location_id: int, db: Session = Depends(get_db)):
    location = db.query(Location).filter_by(id=location_id).first()
    if not location:
        raise HTTPException(status_code=404, detail="Konum bulunamadı.")
    
    db.delete(location)
    db.commit()
    return {"message": "Konum başarıyla silindi."}

@router.get("/events", response_model=List[EventDetail])
def list_events(db: Session = Depends(get_db)):
    return db.query(Event).order_by(Event.starts_at.desc()).all()

def _commit_event(db: Session, event: Event):
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Bu slug ile bir etkinlik zaten var.")
    db.refresh(event)
    return event

@router.post("/events", response_model=EventDetail)
def create_event(data: EventCreate, db: Session = Depends(get_db)):
    event = Event(**data.model_dump())
    db.add(event)
    return _commit_event(db, event)

@router.put("/events/{event_id}", response_model=EventDetail)
def update_event(event_id: int, data: EventUpdate, db: Session = Depends(get_db)):
    event = db.query(Event).filter_by(id=event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Etkinlik bulunamadı.")

    for key, value in data.model_dump(exclude_unset=True, exclude_none=True).items():
        setattr(event, key, value)

    if event.ends_at <= event.starts_at:
        db.rollback()
        raise HTTPException(status_code=422, detail="ends_at, starts_at'tan sonra olmalı.")

    return _commit_event(db, event)

@router.delete("/events/{event_id}")
def delete_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(Event).filter_by(id=event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Etkinlik bulunamadı.")

    db.delete(event)
    db.commit()
    return {"message": "Etkinlik silindi; skorlar genel lider tablosunda kalır."}

@router.delete("/reset")
def reset_all_data(db: Session = Depends(get_db)):
    try:
        db.query(Guess).delete()
        db.query(User).delete()
        db.commit()
        return {"message": "Tüm kullanıcılar ve tahminler başarıyla silindi."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Veriler silinirken hata oluştu: {str(e)}")