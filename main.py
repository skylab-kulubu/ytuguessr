from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import game, admin
from core.database import engine
from core.config import settings
from core.schema import ensure_schema
from retention.scheduler import RetentionScheduler
from retention.settings import RetentionSettings

# An unknown RETENTION_SWEEP_MODE stops the start here (a bad EVENT_ENDED_AT is logged and ignored).
retention_settings = RetentionSettings.from_env()

ensure_schema(engine)

retention_scheduler = RetentionScheduler(engine, retention_settings)


@asynccontextmanager
async def lifespan(app: FastAPI):
    retention_scheduler.start()
    yield
    retention_scheduler.stop()


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.DOMAIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(game.router, prefix="/api/game")
app.include_router(admin.router, prefix="/api/admin")
