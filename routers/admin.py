from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from core.database import SessionLocal
from core.utils import verify_admin_key
from models.models import Location
from schemas.admin import LocationDetail, LocationCreate, LocationUpdate

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
