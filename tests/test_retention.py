"""The periodic destruction run (ADR-0062), with sliding periods: a game's IP goes 90 days
after the game (its last guess, or its start), the school address a year after the
person's newest game; scores and guesses stay, under a player key that names nobody and
the leaderboard name the player chose to show. Dry run and apply select the same rows; a
second run changes nothing; one run at a time; the brake; the daily schedule."""
import logging
from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy import text

from retention import sweep
from retention.__main__ import main as cli
from retention.rules import ALL
from retention.scheduler import RetentionScheduler
from retention.settings import RetentionConfigError, RetentionSettings, parse_event_end, parse_mode

NOW = datetime.now(timezone.utc)


def settings(mode, event_end, max_rows=50000, batch_size=500):
    return RetentionSettings(mode=mode, event_ended_at=event_end, max_rows=max_rows, batch_size=batch_size)


def ago(days):
    return NOW - timedelta(days=days)


def add_game(engine, email, ip, last_guess, show_name=True, score=100.0, created_at=None):
    """A game row; started when given, else at its last guess, else now."""
    created_at = created_at or last_guess or datetime.now(timezone.utc)
    with engine.begin() as conn:
        location = conn.execute(text("SELECT id FROM locations LIMIT 1")).scalar()
        if location is None:
            location = conn.execute(text(
                "INSERT INTO locations (image_url, lat, lng) VALUES ('https://example.invalid/a.jpg', 41.0, 28.9) RETURNING id"
            )).scalar()
        user_id = conn.execute(text(
            "INSERT INTO users (email, score, completed, show_name, ip_address, created_at) "
            "VALUES (:email, :score, :completed, :show, :ip, :created) RETURNING id"
        ), {"email": email, "score": score, "completed": last_guess is not None, "show": show_name, "ip": ip,
            "created": created_at}).scalar()
        if last_guess is not None:
            conn.execute(text(
                "INSERT INTO guesses (user_id, location_id, started_at, distance, score) VALUES (:u, :l, :at, 0.1, 50)"
            ), {"u": user_id, "l": location, "at": last_guess.timestamp()})
    return user_id


def row(engine, user_id):
    with engine.connect() as conn:
        return conn.execute(text(
            "SELECT email, ip_address, leaderboard_name, score FROM users WHERE id = :id"
        ), {"id": user_id}).mappings().one()


def scalar(engine, sql):
    with engine.connect() as conn:
        return conn.execute(text(sql)).scalar()


# Settings

def test_the_mode_is_dry_run_unless_set_and_an_unknown_mode_stops_the_start():
    assert parse_mode(None) == "dry-run"
    assert parse_mode("") == "dry-run"
    assert parse_mode(" Apply ") == "apply"
    assert parse_mode("off") == "off"
    with pytest.raises(RetentionConfigError, match="RETENTION_SWEEP_MODE"):
        parse_mode("dryrun")


def test_the_event_end_is_a_date_in_turkey_or_a_time_with_its_offset_or_ignored():
    assert parse_event_end("") is None
    assert parse_event_end("2025-05-18") == datetime(2025, 5, 18, 21, 0, tzinfo=timezone.utc)
    assert parse_event_end("2025-05-18T22:00:00+03:00") == datetime(2025, 5, 18, 19, 0, tzinfo=timezone.utc)
    # Optional: a value that is not a date (or has no offset) is logged and ignored.
    for wrong in ("18.05.2025", "2025-05-18T22:00:00"):
        assert parse_event_end(wrong) is None
    with pytest.raises(RetentionConfigError, match="RETENTION_SWEEP_MAX_ROWS"):
        RetentionSettings.from_env({"RETENTION_SWEEP_MAX_ROWS": "0"})
    assert RetentionSettings.from_env({}) == RetentionSettings()


# Rules

def test_periods_slide_from_each_game_and_the_persons_newest_game(engine):
    first = add_game(engine, "ahmet.yilmaz@std.yildiz.edu.tr", "203.0.113.1", ago(401), score=700)
    second = add_game(engine, "ahmet.yilmaz@std.yildiz.edu.tr", "203.0.113.1", ago(400), score=900)
    hidden = add_game(engine, "gizli.kisi@std.yildiz.edu.tr", "203.0.113.2", ago(400), show_name=False, score=800)
    later = add_game(engine, "sonra.oynayan@std.yildiz.edu.tr", "203.0.113.3", ago(10), score=600)
    never_guessed = add_game(engine, "baslamadi@std.yildiz.edu.tr", "203.0.113.4", None, score=0, created_at=ago(400))
    # An old player who has just started a new game, no guess yet: the new game keeps the
    # address on every row of it, and its own IP; only the old game's IP goes.
    old_game = add_game(engine, "eski.adres@std.yildiz.edu.tr", "203.0.113.5", ago(400))
    new_game = add_game(engine, "eski.adres@std.yildiz.edu.tr", "203.0.113.6", None)

    dry_run = sweep.run(engine, settings("dry-run", None), "manual", now=NOW)

    assert dry_run.status == "ok"
    assert {r.rule: (r.status, r.matched, r.changed) for r in dry_run.rules} == {
        "ip_address": ("dry_run", 5, 0),
        "account_email": ("dry_run", 4, 0),
    }
    assert row(engine, first)["ip_address"] == "203.0.113.1"

    apply = sweep.run(engine, settings("apply", None), "manual", now=NOW)

    assert apply.status == "ok"
    for rule in apply.rules:
        assert rule.status == "ok"
        assert rule.changed == dry_run.rule(rule.rule).matched
    a, b = row(engine, first), row(engine, second)
    assert a["email"].startswith("anonim:") and a["email"] == b["email"]
    assert (a["ip_address"], a["leaderboard_name"], a["score"]) == (None, "AHMET YILMAZ", 700)
    assert (b["leaderboard_name"], b["score"]) == ("AHMET YILMAZ", 900)
    h = row(engine, hidden)
    assert h["email"].startswith("anonim:") and h["email"] != a["email"]
    assert h["leaderboard_name"] == "ANONIM"
    assert row(engine, never_guessed)["email"].startswith("anonim:")
    assert dict(row(engine, later)) == {
        "email": "sonra.oynayan@std.yildiz.edu.tr", "ip_address": "203.0.113.3", "leaderboard_name": None, "score": 600,
    }
    assert (row(engine, old_game)["email"], row(engine, old_game)["ip_address"]) == ("eski.adres@std.yildiz.edu.tr", None)
    assert (row(engine, new_game)["email"], row(engine, new_game)["ip_address"]) == ("eski.adres@std.yildiz.edu.tr", "203.0.113.6")
    # The game stays: every game row and every guess.
    assert scalar(engine, "SELECT count(*) FROM users") == 7
    assert scalar(engine, "SELECT count(*) FROM guesses") == 5
    assert scalar(engine, "SELECT count(*) FROM users WHERE email LIKE '%@%' AND leaderboard_name IS NOT NULL") == 0

    again = sweep.run(engine, settings("apply", None), "manual", now=NOW)

    assert [(r.matched, r.changed) for r in again.rules] == [(0, 0), (0, 0)]


def test_a_game_started_during_apply_keeps_its_address(engine, monkeypatch):
    add_game(engine, "yaris@std.yildiz.edu.tr", "203.0.113.7", ago(400))
    add_game(engine, "diger@std.yildiz.edu.tr", "203.0.113.8", ago(400))
    original = sweep._anonymize_batch

    def a_new_game_first(*args, **kwargs):
        # Between the count and the change, the player starts a new game.
        add_game(engine, "yaris@std.yildiz.edu.tr", "203.0.113.9", None)
        return original(*args, **kwargs)

    monkeypatch.setattr(sweep, "_anonymize_batch", a_new_game_first)

    apply = sweep.run(engine, settings("apply", None), "manual", now=NOW)

    assert apply.rule("account_email").matched == 2
    assert apply.rule("account_email").changed == 1
    assert scalar(engine, "SELECT count(*) FROM users WHERE email = 'yaris@std.yildiz.edu.tr'") == 3
    assert scalar(engine, "SELECT count(*) FROM users WHERE email = 'diger@std.yildiz.edu.tr'") == 0


def test_the_leaderboard_shows_the_chosen_name_after_anonymization(engine):
    from fastapi.testclient import TestClient
    from main import app

    add_game(engine, "ahmet.yilmaz@std.yildiz.edu.tr", "203.0.113.1", ago(400), score=700)
    add_game(engine, "ahmet.yilmaz@std.yildiz.edu.tr", "203.0.113.1", ago(400), score=900)
    add_game(engine, "gizli.kisi@std.yildiz.edu.tr", "203.0.113.2", ago(400), show_name=False, score=800)
    sweep.run(engine, settings("apply", None), "manual", now=NOW)

    body = TestClient(app).get("/api/game/leaderboard").json()

    assert [(e["name"], e["score"]) for e in body["leaderboard"]] == [("AHMET YILMAZ", 900), ("ANONIM", 800)]
    assert body["total_users"] == 2


def test_ninety_days_after_a_game_only_its_ip_goes(engine):
    player = add_game(engine, "doksan.gun@std.yildiz.edu.tr", "203.0.113.5", ago(100))
    later = add_game(engine, "yeni.oyun@std.yildiz.edu.tr", "203.0.113.6", ago(89))

    apply = sweep.run(engine, settings("apply", None), "manual", now=NOW)

    assert (apply.rule("ip_address").changed, apply.rule("account_email").matched) == (1, 0)
    assert row(engine, player)["ip_address"] is None
    assert row(engine, player)["email"] == "doksan.gun@std.yildiz.edu.tr"
    assert row(engine, later)["ip_address"] == "203.0.113.6"


def test_an_event_end_counts_too_when_it_is_later(engine):
    player = add_game(engine, "etkinlik@std.yildiz.edu.tr", "203.0.113.7", ago(400))

    recent_event = sweep.run(engine, settings("apply", ago(50)), "manual", now=NOW)

    assert [(r.matched, r.changed) for r in recent_event.rules] == [(0, 0), (0, 0)]
    assert row(engine, player)["ip_address"] == "203.0.113.7"

    old_event = sweep.run(engine, settings("apply", ago(100)), "manual", now=NOW)

    assert (old_event.rule("ip_address").changed, old_event.rule("account_email").matched) == (1, 0)


def test_the_brake_refuses_a_rule_that_would_change_too_many_rows(engine):
    event_end = NOW - timedelta(days=100)
    for i in range(3):
        add_game(engine, f"fren{i}@std.yildiz.edu.tr", "203.0.113.8", event_end)

    dry_run = sweep.run(engine, settings("dry-run", event_end, max_rows=2), "manual", now=NOW)
    apply = sweep.run(engine, settings("apply", event_end, max_rows=2), "manual", now=NOW)

    assert dry_run.rule("ip_address").status == "would_refuse_large"
    assert dry_run.status == "ok"
    assert (apply.rule("ip_address").status, apply.rule("ip_address").changed) == ("refused_large", 0)
    assert apply.status == "partial"
    assert scalar(engine, "SELECT count(*) FROM users WHERE ip_address IS NOT NULL") == 3


def test_apply_works_in_batches_and_one_persons_games_share_one_key(engine):
    event_end = NOW - timedelta(days=400)
    for i in range(5):
        add_game(engine, f"parti{i % 2}@std.yildiz.edu.tr", "203.0.113.9", event_end)

    apply = sweep.run(engine, settings("apply", event_end, batch_size=1), "manual", now=NOW)

    assert apply.rule("ip_address").changed == 5
    assert apply.rule("account_email").changed == 5
    assert scalar(engine, "SELECT count(DISTINCT email) FROM users") == 2


def test_a_run_that_finds_the_lock_taken_does_nothing(engine):
    event_end = NOW - timedelta(days=100)
    player = add_game(engine, "kilit@std.yildiz.edu.tr", "203.0.113.10", event_end)

    with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as other:
        other.execute(text("SELECT pg_advisory_lock(:k)"), {"k": sweep.LOCK_KEY})
        try:
            assert sweep.run(engine, settings("apply", event_end), "schedule", now=NOW).outcome == "locked"
        finally:
            other.execute(text("SELECT pg_advisory_unlock(:k)"), {"k": sweep.LOCK_KEY})

    assert row(engine, player)["ip_address"] == "203.0.113.10"
    assert scalar(engine, "SELECT count(*) FROM retention_runs") == 0
    assert sweep.run(engine, settings("apply", event_end), "schedule", now=NOW).outcome == "ran"


def test_the_schedule_runs_once_a_day_per_mode_and_a_run_by_hand_does_not_count(engine):
    event_end = NOW - timedelta(days=100)

    assert sweep.run(engine, settings("dry-run", event_end), "manual", now=NOW).outcome == "ran"
    assert sweep.run(engine, settings("dry-run", event_end), "schedule", now=NOW).outcome == "ran"
    assert sweep.run(engine, settings("dry-run", event_end), "schedule", now=NOW).outcome == "not_due"
    # A new EVENT_ENDED_AT makes it due again.
    assert sweep.run(engine, settings("dry-run", event_end - timedelta(days=1)), "schedule", now=NOW).outcome == "ran"
    assert sweep.run(engine, settings("apply", event_end), "schedule", now=NOW).outcome == "ran"
    assert sweep.run(engine, settings("apply", event_end), "schedule", now=NOW).outcome == "not_due"

    later = NOW + timedelta(hours=23, minutes=1)

    assert sweep.run(engine, settings("apply", event_end), "schedule", now=later).outcome == "ran"
    assert sweep.run(engine, settings("off", event_end), "schedule", now=later).outcome == "off"


def test_a_run_left_running_is_abandoned_and_every_run_leaves_a_receipt(engine):
    with engine.begin() as conn:
        conn.execute(text(
            "INSERT INTO retention_runs (mode, triggered_by, started_at, status) VALUES ('apply', 'schedule', now(), 'running')"
        ))

    sweep.run(engine, settings("dry-run", NOW - timedelta(days=100)), "schedule", now=NOW)

    with engine.connect() as conn:
        assert conn.execute(text("SELECT status FROM retention_runs ORDER BY id")).scalars().all() == ["abandoned", "ok"]
    assert scalar(engine, "SELECT count(*) FROM retention_run_rules") == len(ALL)


def test_the_log_holds_counts_never_addresses_or_ips(engine, caplog):
    event_end = NOW - timedelta(days=400)
    add_game(engine, "log.kisi@std.yildiz.edu.tr", "203.0.113.99", event_end)

    with caplog.at_level(logging.INFO, logger="guessr.retention"):
        sweep.run(engine, settings("apply", event_end), "manual", now=NOW)

    assert "retention_rule rule=ip_address version=1 mode=apply status=ok table=users action=empty" in caplog.text
    assert "matched=1 changed=1" in caplog.text
    assert "retention_run id=" in caplog.text
    assert "log.kisi" not in caplog.text and "203.0.113.99" not in caplog.text


def test_the_command_runs_a_dry_run_unless_told_to_apply(engine, monkeypatch, capsys):
    event_end = NOW - timedelta(days=100)
    player = add_game(engine, "komut@std.yildiz.edu.tr", "203.0.113.11", event_end)
    monkeypatch.setenv("EVENT_ENDED_AT", event_end.isoformat())

    assert cli([]) == 0
    assert row(engine, player)["ip_address"] == "203.0.113.11"
    assert "ip_address       dry_run" in capsys.readouterr().out

    assert cli(["--apply"]) == 0
    assert row(engine, player)["ip_address"] is None

    # A bad EVENT_ENDED_AT is ignored; an unknown mode is not (the flag sets it here, so the brake stands in).
    monkeypatch.setenv("EVENT_ENDED_AT", "dün")
    assert cli([]) == 0
    monkeypatch.setenv("RETENTION_SWEEP_MAX_ROWS", "0")
    assert cli([]) == 2


def test_the_scheduler_does_not_start_while_the_mode_is_off(engine):
    scheduler = RetentionScheduler(engine, settings("off", None))
    scheduler.start()
    assert not scheduler.running


def test_created_at_is_added_to_an_existing_table_with_the_time_it_is_added(engine):
    from core.schema import ensure_schema

    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE users DROP COLUMN created_at"))
        conn.execute(text("INSERT INTO users (email, score, completed, show_name) VALUES ('eski@std.yildiz.edu.tr', 0, false, true)"))
    before = datetime.now(timezone.utc) - timedelta(seconds=5)

    ensure_schema(engine)

    with engine.connect() as conn:
        added = conn.execute(text("SELECT created_at FROM users")).scalar()
    assert added is not None and added >= before
    # So the row is not old: nothing is due.
    result = sweep.run(engine, settings("dry-run", None), "manual", now=NOW)
    assert [r.matched for r in result.rules] == [0, 0]
