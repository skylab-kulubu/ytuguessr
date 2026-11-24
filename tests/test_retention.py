"""The periodic destruction run (ADR-0062): IPs go 90 days after the event, the school
address a year after; scores and guesses stay, under a player key that names nobody and
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


def add_game(engine, email, ip, last_guess, show_name=True, score=100.0):
    with engine.begin() as conn:
        location = conn.execute(text("SELECT id FROM locations LIMIT 1")).scalar()
        if location is None:
            location = conn.execute(text(
                "INSERT INTO locations (image_url, lat, lng) VALUES ('https://example.invalid/a.jpg', 41.0, 28.9) RETURNING id"
            )).scalar()
        user_id = conn.execute(text(
            "INSERT INTO users (email, score, completed, show_name, ip_address) "
            "VALUES (:email, :score, true, :show, :ip) RETURNING id"
        ), {"email": email, "score": score, "show": show_name, "ip": ip}).scalar()
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


def test_the_event_end_is_a_date_in_turkey_or_a_time_with_its_offset():
    assert parse_event_end("") is None
    assert parse_event_end("2025-05-18") == datetime(2025, 5, 18, 21, 0, tzinfo=timezone.utc)
    assert parse_event_end("2025-05-18T22:00:00+03:00") == datetime(2025, 5, 18, 19, 0, tzinfo=timezone.utc)
    for wrong in ("18.05.2025", "2025-05-18T22:00:00"):
        with pytest.raises(RetentionConfigError, match="EVENT_ENDED_AT"):
            parse_event_end(wrong)
    with pytest.raises(RetentionConfigError, match="RETENTION_SWEEP_MAX_ROWS"):
        RetentionSettings.from_env({"RETENTION_SWEEP_MAX_ROWS": "0"})
    assert RetentionSettings.from_env({}) == RetentionSettings()


# Rules

def test_a_year_after_the_event_ips_and_addresses_go_scores_stay(engine):
    event_end = NOW - timedelta(days=400)
    first = add_game(engine, "ahmet.yilmaz@std.yildiz.edu.tr", "203.0.113.1", event_end - timedelta(hours=2), score=700)
    second = add_game(engine, "ahmet.yilmaz@std.yildiz.edu.tr", "203.0.113.1", event_end - timedelta(hours=1), score=900)
    hidden = add_game(engine, "gizli.kisi@std.yildiz.edu.tr", "203.0.113.2", event_end - timedelta(hours=1),
                      show_name=False, score=800)
    later = add_game(engine, "sonra.oynayan@std.yildiz.edu.tr", "203.0.113.3", NOW - timedelta(days=10), score=600)
    never_guessed = add_game(engine, "baslamadi@std.yildiz.edu.tr", "203.0.113.4", None, score=0)

    dry_run = sweep.run(engine, settings("dry-run", event_end), "manual", now=NOW)

    assert dry_run.status == "ok"
    assert {r.rule: (r.status, r.matched, r.changed) for r in dry_run.rules} == {
        "ip_address": ("dry_run", 4, 0),
        "account_email": ("dry_run", 4, 0),
    }
    assert row(engine, first)["ip_address"] == "203.0.113.1"

    apply = sweep.run(engine, settings("apply", event_end), "manual", now=NOW)

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
    # The game stays: every game row and every guess.
    assert scalar(engine, "SELECT count(*) FROM users") == 5
    assert scalar(engine, "SELECT count(*) FROM guesses") == 4
    assert scalar(engine, "SELECT count(*) FROM users WHERE email LIKE '%@%' AND leaderboard_name IS NOT NULL") == 0

    again = sweep.run(engine, settings("apply", event_end), "manual", now=NOW)

    assert [(r.matched, r.changed) for r in again.rules] == [(0, 0), (0, 0)]


def test_the_leaderboard_shows_the_chosen_name_after_anonymization(engine):
    from fastapi.testclient import TestClient
    from main import app

    event_end = NOW - timedelta(days=400)
    add_game(engine, "ahmet.yilmaz@std.yildiz.edu.tr", "203.0.113.1", event_end, score=700)
    add_game(engine, "ahmet.yilmaz@std.yildiz.edu.tr", "203.0.113.1", event_end, score=900)
    add_game(engine, "gizli.kisi@std.yildiz.edu.tr", "203.0.113.2", event_end, show_name=False, score=800)
    sweep.run(engine, settings("apply", event_end), "manual", now=NOW)

    body = TestClient(app).get("/api/game/leaderboard").json()

    assert [(e["name"], e["score"]) for e in body["leaderboard"]] == [("AHMET YILMAZ", 900), ("ANONIM", 800)]
    assert body["total_users"] == 2


def test_ninety_days_after_the_event_only_ips_go(engine):
    event_end = NOW - timedelta(days=100)
    player = add_game(engine, "doksan.gun@std.yildiz.edu.tr", "203.0.113.5", event_end - timedelta(hours=1))
    later = add_game(engine, "yeni.oyun@std.yildiz.edu.tr", "203.0.113.6", NOW - timedelta(days=89))

    apply = sweep.run(engine, settings("apply", event_end), "manual", now=NOW)

    assert (apply.rule("ip_address").changed, apply.rule("account_email").matched) == (1, 0)
    assert row(engine, player)["ip_address"] is None
    assert row(engine, player)["email"] == "doksan.gun@std.yildiz.edu.tr"
    assert row(engine, later)["ip_address"] == "203.0.113.6"


def test_without_the_event_end_nothing_is_counted_or_changed(engine):
    player = add_game(engine, "tarihsiz@std.yildiz.edu.tr", "203.0.113.7", NOW - timedelta(days=1000))

    apply = sweep.run(engine, settings("apply", None), "manual", now=NOW)

    assert apply.status == "ok"
    assert [(r.status, r.matched) for r in apply.rules] == [("no_event_end", 0), ("no_event_end", 0)]
    assert row(engine, player)["ip_address"] == "203.0.113.7"


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

    monkeypatch.setenv("EVENT_ENDED_AT", "dün")
    assert cli([]) == 2


def test_the_scheduler_does_not_start_while_the_mode_is_off(engine):
    scheduler = RetentionScheduler(engine, settings("off", None))
    scheduler.start()
    assert not scheduler.running
