from fastapi import FastAPI
from routers import game, admin
from core.database import Base, engine

Base.metadata.create_all(bind=engine)

app = FastAPI()
app.include_router(game.router, prefix="/api/game")
app.include_router(admin.router, prefix="/api/admin")