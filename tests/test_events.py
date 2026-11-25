"""Event leaderboards: an event is a window [starts_at, ends_at); its leaderboard ranks each
player's best game completed within it. The general leaderboard does not change."""
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError
from sqlalchemy import text

from core.config import settings
from core.utils import create_jwt
from main import app
from schemas.admin import EventCreate

NOW = datetime.now(timezone.utc)
ADMIN = {"key": settings.ADMIN_SECRET}


@pytest.fixture
def client(engine):
    # https: the session cookie is secure.
    return TestClient(app, base_url="https://testserver")


def add_game(engine, email, score, completed_at, completed=True):
    with engine.begin() as conn:
        return conn.execute(text(
            "INSERT INTO users (email, score, completed, show_name, completed_at) "
            "VALUES (:email, :score, :completed, true, :completed_at) RETURNING id"
        ), {"email": email, "score": score, "completed": completed, "completed_at": completed_at}).scalar()


def create_event(client, slug, starts_at, ends_at, name="Festival Günü"):
    return client.post("/api/admin/events", params=ADMIN, json={
        "slug": slug, "name": name, "starts_at": starts_at, "ends_at": ends_at,
    })


def scores(body):
    return [row["score"] for row in body["leaderboard"]]


# Dates

def test_dates_are_whole_days_in_turkey_and_the_last_day_counts():
    event = EventCreate(slug="festival-gunu", name="Festival Günü", starts_at="2026-11-26", ends_at="2026-11-29")
    assert event.starts_at == datetime(2026, 11, 25, 21, 0, tzinfo=timezone.utc)
    assert event.ends_at == datetime(2026, 11, 29, 21, 0, tzinfo=timezone.utc)

    exact = EventCreate(slug="a", name="A", starts_at="2026-11-26T10:00:00+03:00", ends_at="2026-11-26T18:00:00Z")
    assert exact.starts_at == datetime(2026, 11, 26, 7, 0, tzinfo=timezone.utc)
    assert exact.ends_at == datetime(2026, 11, 26, 18, 0, tzinfo=timezone.utc)


@pytest.mark.parametrize("fields", [
    {"starts_at": "2026-11-26T10:00:00", "ends_at": "2026-11-29"},  # no offset
    {"starts_at": "2026-11-29", "ends_at": "2026-11-26"},  # ends before it starts
    {"starts_at": "26.11.2026", "ends_at": "2026-11-29"},
    {"slug": "Festival Günü"},
])
def test_wrong_events_are_refused(fields):
    data = {"slug": "festival-gunu", "name": "Festival Günü", "starts_at": "2026-11-26", "ends_at": "2026-11-29"}
    with pytest.raises(ValidationError):
        EventCreate(**{**data, **fields})


# Admin

def test_admin_creates_lists_updates_and_deletes_events(client):
    assert client.get("/api/admin/events").status_code == 401

    created = create_event(client, "festival-gunu", "2026-11-26", "2026-11-29")
    assert created.status_code == 200
    event_id = created.json()["id"]
    assert create_event(client, "festival-gunu", "2026-12-01", "2026-12-02").status_code == 409

    updated = client.put(f"/api/admin/events/{event_id}", params=ADMIN, json={"ends_at": "2026-11-30"})
    assert updated.status_code == 200
    assert datetime.fromisoformat(updated.json()["ends_at"]) == datetime(2026, 11, 30, 21, 0, tzinfo=timezone.utc)
    assert client.put(f"/api/admin/events/{event_id}", params=ADMIN, json={"ends_at": "2026-11-20"}).status_code == 422

    assert [e["slug"] for e in client.get("/api/admin/events", params=ADMIN).json()] == ["festival-gunu"]
    assert client.delete(f"/api/admin/events/{event_id}", params=ADMIN).status_code == 200
    assert client.get("/api/admin/events", params=ADMIN).json() == []


def test_the_public_list_says_which_events_are_on(client):
    day = timedelta(days=1)
    create_event(client, "gecmis", (NOW - 3 * day).isoformat(), (NOW - 2 * day).isoformat())
    create_event(client, "simdi", (NOW - day).isoformat(), (NOW + day).isoformat())
    create_event(client, "gelecek", (NOW + 2 * day).isoformat(), (NOW + 3 * day).isoformat())

    events = client.get("/api/game/events").json()["events"]
    assert [(e["slug"], e["status"]) for e in events] == [
        ("gelecek", "upcoming"), ("simdi", "active"), ("gecmis", "ended"),
    ]


# Leaderboards

def test_the_event_leaderboard_counts_only_games_completed_in_its_window(engine, client):
    start, end = NOW - timedelta(days=1), NOW + timedelta(days=1)
    create_event(client, "festival-gunu", start.isoformat(), end.isoformat())

    add_game(engine, "a@std.yildiz.edu.tr", 900, start - timedelta(hours=1))  # before the event
    add_game(engine, "a@std.yildiz.edu.tr", 500, NOW)
    a_best = add_game(engine, "a@std.yildiz.edu.tr", 600, NOW)
    add_game(engine, "b@std.yildiz.edu.tr", 700, start)  # starts_at counts
    add_game(engine, "c@std.yildiz.edu.tr", 950, end)  # ends_at does not
    add_game(engine, "d@std.yildiz.edu.tr", 800, None, completed=False)  # not finished
    client.cookies.set("session", create_jwt(a_best))

    event = client.get("/api/game/leaderboard", params={"event": "festival-gunu"}).json()
    assert scores(event) == [700, 600]
    assert event["total_users"] == 2
    assert event["user_rank"] == 2
    assert event["event"]["slug"] == "festival-gunu" and event["event"]["status"] == "active"
    assert [row["is_me"] for row in event["leaderboard"]] == [False, True]

    general = client.get("/api/game/leaderboard").json()
    assert scores(general) == [950, 900, 700]
    assert general["total_users"] == 3
    assert general["user_rank"] == 2
    assert "event" not in general


def test_an_unknown_event_is_not_found(client):
    assert client.get("/api/game/leaderboard", params={"event": "yok"}).status_code == 404


def test_finishing_a_game_puts_it_on_the_running_events_leaderboard(engine, client, monkeypatch):
    monkeypatch.setattr(settings, "_valid_emails", {"oyuncu@std.yildiz.edu.tr"}, raising=False)
    with engine.begin() as conn:
        for i in range(settings.LOCATION_COUNT):
            conn.execute(text(
                "INSERT INTO locations (image_url, lat, lng) VALUES (:url, 41.027, 28.889)"
            ), {"url": f"https://example.invalid/{i}.jpg"})
    create_event(client, "festival-gunu", (NOW - timedelta(hours=1)).isoformat(), (NOW + timedelta(hours=1)).isoformat())

    assert client.post("/api/game/start", json={"school_mail": "oyuncu@std.yildiz.edu.tr"}).status_code == 200
    for _ in range(settings.LOCATION_COUNT):
        assert client.post("/api/game/next").status_code == 200
        assert client.post("/api/game/guess", json={"latitude": 41.027, "longitude": 28.889}).status_code == 200

    with engine.connect() as conn:
        completed, completed_at = conn.execute(text("SELECT completed, completed_at FROM users")).one()
    assert completed and completed_at is not None

    event = client.get("/api/game/leaderboard", params={"event": "festival-gunu"}).json()
    assert event["total_users"] == 1 and event["user_rank"] == 1
