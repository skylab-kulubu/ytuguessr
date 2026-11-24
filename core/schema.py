from sqlalchemy import text

from core.database import Base, engine
import models.models  # noqa: F401  (registers the tables)

# "guesssch": only one process creates or changes the schema at a time. Every gunicorn
# worker imports the app; without the lock they race on CREATE TABLE in an empty database.
SCHEMA_LOCK_KEY = 0x6775657373736368


# Columns create_all does not add to an existing table. created_at's default fills the rows
# already there with the time it is added: none of them counts as older than it may be.
ADDED_COLUMNS = (
    ("users", "leaderboard_name", "VARCHAR"),
    ("users", "created_at", "TIMESTAMPTZ DEFAULT now()"),
)


def ensure_schema(bind=engine):
    """Creates missing tables and adds missing columns."""
    with bind.begin() as conn:
        conn.execute(text("SELECT pg_advisory_xact_lock(:key)"), {"key": SCHEMA_LOCK_KEY})
        Base.metadata.create_all(bind=conn)
        # Checked first, and under a short lock timeout: ALTER TABLE queues behind every open query
        # on the table, and every request behind it would wait too.
        conn.execute(text("SET LOCAL lock_timeout = '5s'"))
        for table, column, definition in ADDED_COLUMNS:
            exists = conn.execute(text(
                "SELECT count(*) FROM information_schema.columns "
                "WHERE table_schema = current_schema() AND table_name = :t AND column_name = :c"
            ), {"t": table, "c": column}).scalar()
            if not exists:
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {column} {definition}"))
