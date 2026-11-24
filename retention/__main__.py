"""Runs the periodic destruction run by hand, inside the backend container:

    python -m retention                 # dry run: counts per rule, changes nothing
    python -m retention --apply         # changes the rows, under the brake
    python -m retention --apply --allow-large
                                        # past the brake, for a backlog (first apply)

EVENT_ENDED_AT, RETENTION_SWEEP_MAX_ROWS and RETENTION_SWEEP_BATCH_SIZE come from the
environment; RETENTION_SWEEP_MODE does not matter here (the flag decides). The run is
recorded as triggered_by=manual and does not stand in for the schedule's day.
Exit codes: 0 done, 1 a rule failed or was refused (or the run failed), 2 configuration,
3 another run holds the lock.
"""
import argparse
import dataclasses
import sys

from retention.settings import RetentionConfigError, RetentionSettings


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(prog="python -m retention")
    parser.add_argument("--apply", action="store_true", help="change the rows (default: dry run)")
    parser.add_argument("--allow-large", action="store_true", help="pass the brake (RETENTION_SWEEP_MAX_ROWS)")
    args = parser.parse_args(argv)
    try:
        settings = RetentionSettings.from_env()
    except RetentionConfigError as exc:
        print(exc, file=sys.stderr)
        return 2
    settings = dataclasses.replace(
        settings,
        mode="apply" if args.apply else "dry-run",
        max_rows=sys.maxsize if args.allow_large else settings.max_rows,
    )

    from core.database import engine
    from core.schema import ensure_schema
    from retention import sweep

    ensure_schema(engine)
    result = sweep.run(engine, settings, "manual")
    if result.outcome == "locked":
        print("another run holds the lock", file=sys.stderr)
        return 3
    print(f"{'RULE':<16} {'STATUS':<20} {'MATCHED':>8} {'CHANGED':>8}")
    for rule in result.rules:
        print(f"{rule.rule:<16} {rule.status:<20} {rule.matched:>8} {rule.changed:>8}")
    print(f"run: mode={settings.mode} status={result.status} "
          f"event_ended_at={settings.event_ended_at.isoformat() if settings.event_ended_at else 'unset'}")
    return 0 if result.status == "ok" else 1


if __name__ == "__main__":
    sys.exit(main())
