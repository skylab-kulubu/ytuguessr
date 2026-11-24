from sqlalchemy import text

from core.database import Base, engine
import models.models  # noqa: F401  (registers the tables)

# "guesssch": only one process creates or changes the schema at a time. Every gunicorn
# worker imports the app; without the lock they race on CREATE TABLE in an empty database.
SCHEMA_LOCK_KEY = 0x6775657373736368


def ensure_schema(bind=engine):
    """Creates missing tables and adds the columns create_all does not add to an existing table."""
    with bind.begin() as conn:
        conn.execute(text("SELECT pg_advisory_xact_lock(:key)"), {"key": SCHEMA_LOCK_KEY})
        Base.metadata.create_all(bind=conn)
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS leaderboard_name VARCHAR"))
