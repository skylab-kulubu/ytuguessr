import jwt
import time
from fastapi import HTTPException
from core.config import settings
from models.models import User

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