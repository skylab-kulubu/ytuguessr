"""The tests need a Postgres: POSTGRES_HOST/PORT/USER/PASSWORD/DB (CI: the service container).

The application's settings are read when its modules are imported, so the stand-ins for
the deployment's variables are set here first. The retention scheduler stays off; the
tests run the sweep themselves.
"""
import os
import sys

DEFAULTS = {
    "POSTGRES_USER": "guessr",
    "POSTGRES_PASSWORD": "test",
    "POSTGRES_DB": "game_db",
    "POSTGRES_HOST": "localhost",
    "POSTGRES_PORT": "5432",
    "ADMIN_SECRET": "test-admin",
    "JWT_SECRET": "test-jwt",
    "LOCATION_COUNT": "5",
    "QUESTION_DURATION": "60",
    "ALPHA_COEFFICIENT": "1",
    "BETA_COEFFICIENT": "1",
    "LEADERBOARD_PAGE_SIZE": "10",
    "DOMAIN": "http://localhost:3000",
}
for key, value in DEFAULTS.items():
    os.environ.setdefault(key, value)
os.environ["RETENTION_SWEEP_MODE"] = "off"
os.environ.pop("EVENT_ENDED_AT", None)

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest  # noqa: E402
from sqlalchemy import text  # noqa: E402

from core.database import engine as app_engine  # noqa: E402
from core.schema import ensure_schema  # noqa: E402


@pytest.fixture
def engine():
    ensure_schema(app_engine)
    with app_engine.begin() as conn:
        conn.execute(text(
            "TRUNCATE guesses, users, locations, events, retention_run_rules, retention_runs RESTART IDENTITY CASCADE"
        ))
    yield app_engine
