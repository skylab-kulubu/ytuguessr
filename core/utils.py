import math
import jwt
import time
from fastapi import HTTPException
from core.config import settings
from models.models import User

def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = (math.sin(dLat/2)**2 +
         math.cos(math.radians(lat1)) *
         math.cos(math.radians(lat2)) *
         math.sin(dLon/2)**2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def create_jwt(email):
    return jwt.encode({"email": email, "timestamp": time.time()}, settings.JWT_SECRET, algorithm="HS256")

def decode_jwt(token, db):
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        email = payload.get("email")

        if not email:
            raise HTTPException(status_code=401, detail="JWT içinde e-posta bulunamadı.")

        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=401, detail="Kullanıcı sistemde kayıtlı değil.")

        return user
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Oturum doğrulaması başarısız.")