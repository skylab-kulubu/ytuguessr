"""Guessr's rules for the periodic destruction run (ADR-0062, the Place and Guessr rows).

Guessr runs all the time, so the periods slide. A game row's time is its last guess, or
when it was started (created_at) if it has none yet; a person's time is the latest of all
their games (rows with the same address). EVENT_ENDED_AT is optional: when it is set, a
period counts from it too, if it is later. An account active in the last 90 days is never
anonymized (its last game is newer than the year).

Guessr has no Turnstile, no ban and no login tokens on the server: its personal data is
the address a game was started with (users.email) and the IP (users.ip_address).

Never touched: scores, guesses and locations. A game row stays; once anonymized it is a
score under a random player key that names nobody, with the leaderboard name the player
chose to show (show_name), or "ANONIM".

The dry run's count and apply's statements are built from the same WHERE clause, and the
clause leaves out rows already handled, so a second run changes nothing.
"""
from dataclasses import dataclass
from typing import Optional

EVENT_END = "CAST(:event_end AS timestamptz)"

# The last guess started on each game row (started_at is a Unix time).
LAST_GUESS = "(SELECT user_id, to_timestamp(max(started_at)) AS at FROM guesses GROUP BY user_id)"

# A game row's time: its last guess, or when it was started.
ROW_TIME = "coalesce(g.at, u.created_at)"

# Per address, the time of its newest game (guessed or not): one person's games go together.
EMAIL_LAST_ACTIVITY = (
    "(SELECT u2.email, max(coalesce(g2.at, u2.created_at)) AS at FROM users u2 "
    f"LEFT JOIN {LAST_GUESS} g2 ON g2.user_id = u2.id GROUP BY u2.email)"
)


@dataclass(frozen=True)
class Rule:
    name: str
    version: int
    table: str
    # "empty": set_clause empties the fields; "anonymize": the account rule (retention/sweep.py).
    action: str
    # The bind parameter holding this rule's cutoff: ip_cutoff (90 days) or account_cutoff (a year).
    cutoff: str
    from_clause: str
    predicate: str
    set_clause: Optional[str] = None

    def count_sql(self) -> str:
        return f"SELECT count(*) FROM {self.from_clause} WHERE {self.predicate}"

    def batch_sql(self) -> str:
        """Empties at most :batch rows; rows another transaction holds wait for the next run."""
        return (
            f"UPDATE {self.table} SET {self.set_clause} WHERE id IN ("
            f"SELECT u.id FROM {self.from_clause} WHERE {self.predicate} "
            "ORDER BY u.id LIMIT :batch FOR UPDATE OF u SKIP LOCKED)"
        )


# IP addresses: 90 days after the game row's time. GREATEST skips a null EVENT_ENDED_AT.
IP_ADDRESS = Rule(
    name="ip_address",
    version=1,
    table="users",
    action="empty",
    cutoff="ip_cutoff",
    from_clause=f"users u LEFT JOIN {LAST_GUESS} g ON g.user_id = u.id",
    predicate=f"u.ip_address IS NOT NULL AND greatest({EVENT_END}, {ROW_TIME}) <= CAST(:ip_cutoff AS timestamptz)",
    set_clause="ip_address = NULL",
)

# The account (school address): a year after the address's newest game. Every game row of the
# address gets one random player key in place of the address (so the leaderboard still shows
# one entry per player) and its leaderboard name.
ACCOUNT_EMAIL = Rule(
    name="account_email",
    version=1,
    table="users",
    action="anonymize",
    cutoff="account_cutoff",
    from_clause="users u",
    predicate=(
        "u.leaderboard_name IS NULL AND u.email IS NOT NULL AND u.email IN ("
        f"SELECT e.email FROM {EMAIL_LAST_ACTIVITY} e "
        f"WHERE greatest({EVENT_END}, e.at) <= CAST(:account_cutoff AS timestamptz))"
    ),
)

ALL = (IP_ADDRESS, ACCOUNT_EMAIL)

# The player key that replaces an address: not an address, and no way back to one.
ANONYMOUS_KEY_PREFIX = "anonim:"
