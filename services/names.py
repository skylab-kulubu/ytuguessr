import re


def is_number_username(email: str) -> bool:
    username = email.split("@")[0]
    return bool(re.fullmatch(r"[a-zA-Z]?\d+", username))


def format_name(email: str, show: bool) -> str:
    """The leaderboard name of a school address: in full if the player chose to show it, masked otherwise."""
    username = email.split("@")[0]
    if is_number_username(email):
        return username if show else username[:2] + "*" * (len(username) - 2)
    cleaned = re.sub(r"[^a-zA-Z.]", "", username)
    parts = [p for p in cleaned.split(".") if p]
    if not parts:
        return "ANONIM"
    if show:
        return " ".join(part.upper() for part in parts)
    return " ".join(
        part.upper() if len(part) <= 2 else part[:2].upper() + "*" * (len(part) - 2)
        for part in parts
    )


def leaderboard_name(user) -> str:
    """An anonymized row keeps only its leaderboard name (retention/rules.py)."""
    if user.leaderboard_name is not None:
        return user.leaderboard_name
    return format_name(user.email, user.show_name)
