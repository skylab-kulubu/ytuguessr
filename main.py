from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import game, admin
from core.database import Base, engine
from core.config import settings

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.DOMAIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(game.router, prefix="/api/game")
app.include_router(admin.router, prefix="/api/admin")