"""The periodic destruction run (ADR-0062; README, "Saklama ve imha").

Once a day it empties or anonymizes what is past its period under retention/rules.py and
writes a receipt without personal data (retention_runs, retention_run_rules).

- One run at a time: a session advisory lock on its own connection. Every gunicorn worker
  looks; the one that takes the lock checks whether the run is due and runs it.
- The schedule's run is due when no scheduled run of the same mode and event end ended ok
  or partial in the last 23 hours, read from retention_runs: a restart never makes a run
  due again; switching the mode or EVENT_ENDED_AT does.
- Apply changes at most batch_size rows per transaction (account_email: whole addresses up
  to that many rows; a single address with more rows alone), under a 30-second statement
  timeout, and never more rows than its count found.
- The brake: a rule that would change more than RETENTION_SWEEP_MAX_ROWS rows is refused
  (apply changes nothing for it; the dry run says would_refuse_large).
- Periods slide from each game's own time (retention/rules.py); EVENT_ENDED_AT, when set,
  counts too if it is later.
"""
import logging
import sys
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from sqlalchemy import text
from sqlalchemy.exc import DBAPIError

from retention import rules as rules_module
from retention.settings import RetentionSettings
from services.names import format_name

# "guessret"
LOCK_KEY = 0x6775657373726574
DUE_AFTER = timedelta(hours=23)
IP_PERIOD = timedelta(days=90)

log = logging.getLogger("guessr.retention")
if not log.handlers:
    # gunicorn leaves the root logger without a handler; these lines must reach the container log.
    _handler = logging.StreamHandler(sys.stdout)
    _handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(message)s"))
    log.addHandler(_handler)
    log.setLevel(logging.INFO)


@dataclass
class RuleResult:
    rule: str
    status: str
    matched: int = 0
    changed: int = 0
    cutoff: Optional[datetime] = None
    error_code: Optional[str] = None


@dataclass
class RunResult:
    # ran, not_due, locked, off
    outcome: str
    status: Optional[str] = None
    rules: List[RuleResult] = field(default_factory=list)

    def rule(self, name: str) -> RuleResult:
        return next(r for r in self.rules if r.rule == name)


def error_code(exc: BaseException) -> str:
    """A SQLSTATE or the exception's class: never the message, which can quote a value."""
    orig = getattr(exc, "orig", None)
    state = getattr(orig, "pgcode", None)
    if state:
        return f"sqlstate_{state}"
    return type(exc).__name__


def _cutoffs(now: datetime) -> dict:
    def years_ago(n: int) -> datetime:
        try:
            return now.replace(year=now.year - n)
        except ValueError:  # 29 February
            return now.replace(year=now.year - n, day=28)

    return {"ip_cutoff": now - IP_PERIOD, "account_cutoff": years_ago(1)}


def run(engine, settings: RetentionSettings, trigger: str = "schedule", now: Optional[datetime] = None) -> RunResult:
    """A run with these settings; the schedule's (trigger 'schedule') only if it is due."""
    if settings.mode == "off":
        return RunResult("off")
    now = now or datetime.now(timezone.utc)
    lock = engine.connect().execution_options(isolation_level="AUTOCOMMIT")
    locked = False
    try:
        locked = bool(lock.execute(text("SELECT pg_try_advisory_lock(:k)"), {"k": LOCK_KEY}).scalar())
        if not locked:
            if trigger != "schedule":
                log.info("retention_run trigger=%s status=skipped_locked", trigger)
            return RunResult("locked")
        if trigger == "schedule" and not _is_due(engine, settings, now):
            return RunResult("not_due")
        return _run_locked(engine, settings, trigger, now)
    finally:
        _release(lock, locked)


def _release(lock, locked: bool) -> None:
    # A session lock stays with its connection: one that cannot be released must not go back to the pool.
    try:
        if locked:
            lock.execute(text("SELECT pg_advisory_unlock(:k)"), {"k": LOCK_KEY})
    except Exception as exc:  # noqa: BLE001
        log.warning("retention_sweep unlock failed code=%s", error_code(exc))
        lock.invalidate()
    finally:
        lock.close()


def _is_due(engine, settings: RetentionSettings, now: datetime) -> bool:
    # A new EVENT_ENDED_AT makes the day's run due again too.
    with engine.connect() as conn:
        recent = conn.execute(
            text(
                "SELECT count(*) FROM retention_runs WHERE triggered_by = 'schedule' AND mode = :mode "
                "AND status IN ('ok', 'partial') AND started_at > :since "
                "AND event_ended_at IS NOT DISTINCT FROM CAST(:event_end AS timestamptz)"
            ),
            {"mode": settings.mode, "since": now - DUE_AFTER, "event_end": settings.event_ended_at},
        ).scalar()
    return not recent


def _run_locked(engine, settings: RetentionSettings, trigger: str, now: datetime) -> RunResult:
    with engine.begin() as conn:
        # Under the lock, a run still marked running belongs to a process that went away.
        conn.execute(
            text("UPDATE retention_runs SET status = 'abandoned', finished_at = :now WHERE status = 'running'"),
            {"now": now},
        )
        run_id = conn.execute(
            text(
                "INSERT INTO retention_runs (mode, triggered_by, event_ended_at, started_at, status) "
                "VALUES (:mode, :trigger, :event_end, :now, 'running') RETURNING id"
            ),
            {"mode": settings.mode, "trigger": trigger, "event_end": settings.event_ended_at, "now": now},
        ).scalar()

    results: List[RuleResult] = []
    status = "ok"
    code = None
    try:
        params = {"event_end": settings.event_ended_at, **_cutoffs(now)}
        for rule in rules_module.ALL:
            result = _run_rule(engine, rule, settings, params)
            results.append(result)
            _record_rule(engine, run_id, rule, result, settings.mode)
            if result.status in ("failed", "refused_large"):
                status = "partial"
    except Exception as exc:  # noqa: BLE001
        status = "failed"
        code = error_code(exc)

    with engine.begin() as conn:
        conn.execute(
            text("UPDATE retention_runs SET status = :status, finished_at = :now, error_code = :code WHERE id = :id"),
            {"status": status, "now": datetime.now(timezone.utc), "code": code, "id": run_id},
        )
    log.info(
        "retention_run id=%s mode=%s trigger=%s status=%s event_ended_at=%s matched=%s changed=%s code=%s",
        run_id, settings.mode, trigger, status,
        settings.event_ended_at.isoformat() if settings.event_ended_at else "unset",
        sum(r.matched for r in results), sum(r.changed for r in results), code or "-",
    )
    return RunResult("ran", status, results)


def _run_rule(engine, rule, settings: RetentionSettings, params: dict) -> RuleResult:
    result = RuleResult(rule.name, "dry_run", cutoff=params[rule.cutoff])
    try:
        with engine.begin() as conn:
            _statement_timeout(conn)
            result.matched = conn.execute(text(rule.count_sql()), params).scalar() or 0
        if result.matched > settings.max_rows:
            result.status = "refused_large" if settings.mode == "apply" else "would_refuse_large"
        elif settings.mode == "dry-run":
            result.status = "dry_run"
        else:
            while result.changed < result.matched:
                limit = min(settings.batch_size, result.matched - result.changed)
                if rule.action == "anonymize":
                    changed = _anonymize_batch(engine, rule, params, limit, result.matched - result.changed)
                else:
                    with engine.begin() as conn:
                        _statement_timeout(conn)
                        changed = conn.execute(text(rule.batch_sql()), {**params, "batch": limit}).rowcount
                if changed == 0:
                    break
                result.changed += changed
            result.status = "ok"
    except DBAPIError as exc:
        result.status = "failed"
        result.error_code = error_code(exc)
    return result


def _anonymize_batch(engine, rule, params: dict, limit: int, remaining: int) -> int:
    """Whole addresses, up to `limit` rows (one address with more rows alone, if it fits in
    `remaining`, what is left of the count): every game row of each gets one new player key and
    its leaderboard name. Each UPDATE checks the rule again, so an address that started a new
    game meanwhile is left for later."""
    changed = 0
    with engine.begin() as conn:
        _statement_timeout(conn)
        due = conn.execute(
            text(
                f"SELECT u.email, count(*) FROM {rule.from_clause} WHERE {rule.predicate} "
                "GROUP BY u.email ORDER BY u.email LIMIT :batch"
            ),
            {**params, "batch": limit},
        ).all()
        emails, rows = [], 0
        for email, count in due:
            if rows + count > limit and emails:
                break
            if rows + count > remaining:
                break
            emails.append(email)
            rows += count
        for email in emails:
            changed += conn.execute(
                text(
                    "UPDATE users u SET email = :key, ip_address = NULL, "
                    "leaderboard_name = CASE WHEN u.show_name THEN :shown ELSE 'ANONIM' END "
                    f"WHERE u.email = :email AND {rule.predicate}"
                ),
                {
                    **params,
                    "key": rules_module.ANONYMOUS_KEY_PREFIX + uuid.uuid4().hex,
                    "shown": format_name(email, True),
                    "email": email,
                },
            ).rowcount
    return changed


def _statement_timeout(conn) -> None:
    conn.execute(text("SET LOCAL statement_timeout = '30s'"))


def _record_rule(engine, run_id: int, rule, result: RuleResult, mode: str) -> None:
    with engine.begin() as conn:
        conn.execute(
            text(
                "INSERT INTO retention_run_rules (run_id, rule, version, table_name, action, cutoff, matched, changed, status, error_code) "
                "VALUES (:run, :rule, :version, :table, :action, :cutoff, :matched, :changed, :status, :code)"
            ),
            {
                "run": run_id, "rule": rule.name, "version": rule.version, "table": rule.table,
                "action": rule.action, "cutoff": result.cutoff, "matched": result.matched,
                "changed": result.changed, "status": result.status, "code": result.error_code,
            },
        )
    # Counts only: no address, IP or row id.
    log.info(
        "retention_rule rule=%s version=%s mode=%s status=%s table=%s action=%s cutoff=%s matched=%s changed=%s code=%s",
        rule.name, rule.version, mode, result.status, rule.table, rule.action,
        result.cutoff.isoformat() if result.cutoff else "-", result.matched, result.changed,
        result.error_code or "-",
    )
