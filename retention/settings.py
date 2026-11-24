import logging
import os
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta, timezone
from typing import Optional

MODE_ENV = "RETENTION_SWEEP_MODE"
EVENT_END_ENV = "EVENT_ENDED_AT"
MAX_ROWS_ENV = "RETENTION_SWEEP_MAX_ROWS"
BATCH_SIZE_ENV = "RETENTION_SWEEP_BATCH_SIZE"

MODES = ("off", "dry-run", "apply")

# Turkey keeps UTC+3 all year: a date in EVENT_ENDED_AT is the end of that day there.
TURKEY = timezone(timedelta(hours=3))


log = logging.getLogger("guessr.retention")


class RetentionConfigError(ValueError):
    """A value the run cannot use: the application does not start."""


def parse_mode(value: Optional[str]) -> str:
    normalized = (value or "").strip().lower()
    if not normalized:
        return "dry-run"
    if normalized not in MODES:
        raise RetentionConfigError(f"{MODE_ENV} must be off, dry-run or apply")
    return normalized


def parse_event_end(value: Optional[str]) -> Optional[datetime]:
    """'2025-05-18' (the end of that day in Turkey) or '2025-05-18T22:00:00+03:00'; blank is None.

    Optional: anything else is logged and counts as unset, the application still starts
    (RetentionSettings.event_end_invalid: apply then changes nothing)."""
    if value is None or not value.strip():
        return None
    text = value.strip()
    try:
        if len(text) == 10:
            day = date.fromisoformat(text)
            return datetime.combine(day + timedelta(days=1), time(0), TURKEY).astimezone(timezone.utc)
        parsed = datetime.fromisoformat(text.replace("Z", "+00:00"))
    except ValueError:
        parsed = None
    if parsed is None or parsed.tzinfo is None:
        log.warning(
            "retention_sweep %s ignored: not a date (2025-05-18) or a time with its offset (2025-05-18T22:00:00+03:00)",
            EVENT_END_ENV,
        )
        return None
    return parsed.astimezone(timezone.utc)


def _positive(name: str, value: Optional[str], default: int) -> int:
    if value is None or not value.strip():
        return default
    try:
        number = int(value)
    except ValueError:
        number = 0
    if number < 1:
        raise RetentionConfigError(f"{name} must be a positive number")
    return number


@dataclass(frozen=True)
class RetentionSettings:
    mode: str = "dry-run"
    # Optional: when an event ended; periods also count from it when it is later than the row's time.
    event_ended_at: Optional[datetime] = None
    # The brake: a rule that would change more rows is refused for the day.
    max_rows: int = 50000
    # Rows per statement in apply.
    batch_size: int = 500
    # EVENT_ENDED_AT was set but is not a date: the application still starts, the dry run counts
    # without it, and apply changes nothing (config_error): a typo must not shorten a period.
    event_end_invalid: bool = False

    @classmethod
    def from_env(cls, env=None) -> "RetentionSettings":
        env = os.environ if env is None else env
        raw_event_end = env.get(EVENT_END_ENV)
        event_ended_at = parse_event_end(raw_event_end)
        return cls(
            mode=parse_mode(env.get(MODE_ENV)),
            event_ended_at=event_ended_at,
            event_end_invalid=bool(raw_event_end and raw_event_end.strip()) and event_ended_at is None,
            max_rows=_positive(MAX_ROWS_ENV, env.get(MAX_ROWS_ENV), 50000),
            batch_size=_positive(BATCH_SIZE_ENV, env.get(BATCH_SIZE_ENV), 500),
        )
