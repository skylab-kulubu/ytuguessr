"""Guessr's rules for the periodic destruction run (ADR-0062, the Place and Guessr rows).

Every period counts from the event's end (EVENT_ENDED_AT), or from the row's own last
guess when that is later (a game played after the event gets its full period). Guessr
has no Turnstile, no ban and no login tokens on the server: its personal data is the
address a game was started with (users.email) and the IP (users.ip_address).

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

# Per address, the last guess of any of its games: one person's games go together.
EMAIL_LAST_GUESS = (
    "(SELECT u2.email, max(g2.at) AS at FROM users u2 "
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


# IP addresses: event + 90 days.
IP_ADDRESS = Rule(
    name="ip_address",
    version=1,
    table="users",
    action="empty",
    cutoff="ip_cutoff",
    from_clause=f"users u LEFT JOIN {LAST_GUESS} g ON g.user_id = u.id",
    predicate=f"u.ip_address IS NOT NULL AND greatest({EVENT_END}, g.at) <= CAST(:ip_cutoff AS timestamptz)",
    set_clause="ip_address = NULL",
)

# The account (school address): event + 1 year, counted from the address's last game.
# Every game row of the address gets one random player key in place of the address (so the
# leaderboard still shows one entry per player) and its leaderboard name.
ACCOUNT_EMAIL = Rule(
    name="account_email",
    version=1,
    table="users",
    action="anonymize",
    cutoff="account_cutoff",
    from_clause="users u",
    predicate=(
        "u.leaderboard_name IS NULL AND u.email IS NOT NULL AND u.email IN ("
        f"SELECT e.email FROM {EMAIL_LAST_GUESS} e "
        f"WHERE greatest({EVENT_END}, e.at) <= CAST(:account_cutoff AS timestamptz))"
    ),
)

ALL = (IP_ADDRESS, ACCOUNT_EMAIL)

# The player key that replaces an address: not an address, and no way back to one.
ANONYMOUS_KEY_PREFIX = "anonim:"
