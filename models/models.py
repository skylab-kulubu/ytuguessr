from sqlalchemy import BigInteger, Column, DateTime, Integer, String, Float, Boolean, ForeignKey, func
from core.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True)
    score = Column(Float, default=0.0)
    completed = Column(Boolean, default=False)
    show_name = Column(Boolean, default=False)
    ip_address = Column(String, nullable=True)
    # Set when the periodic destruction run anonymizes the row (retention/rules.py): the
    # leaderboard name the person chose to show, or "ANONIM". Null while the row is personal.
    leaderboard_name = Column(String, nullable=True)
    # When the game was started (the database fills it). Rows from before this column hold the
    # time it was added, so the retention run never counts them as older than they may be.
    created_at = Column(DateTime(timezone=True), nullable=True, server_default=func.now())

class Location(Base):
    __tablename__ = "locations"
    id = Column(Integer, primary_key=True)
    image_url = Column(String)
    lat = Column(Float)
    lng = Column(Float)

class Guess(Base):
    __tablename__ = "guesses"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    location_id = Column(Integer, ForeignKey("locations.id"))
    guessed_lat = Column(Float, nullable=True)
    guessed_lng = Column(Float, nullable=True)
    distance = Column(Float, nullable=True)
    started_at = Column(Float, nullable=True)
    time_taken = Column(Float, nullable=True)
    score = Column(Float, nullable=True)

class RetentionRun(Base):
    """The receipt of one periodic destruction run, without personal data (ADR-0062).
    No code path deletes it: the destruction record is kept at least three years."""
    __tablename__ = "retention_runs"
    id = Column(BigInteger, primary_key=True)
    mode = Column(String(16), nullable=False)  # dry-run, apply
    triggered_by = Column(String(16), nullable=False)  # schedule, manual
    event_ended_at = Column(DateTime(timezone=True), nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=False)
    finished_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(16), nullable=False)  # running, ok, partial, failed, abandoned, config_error
    error_code = Column(String(64), nullable=True)  # a SQLSTATE or an exception's class, never its message


class RetentionRunRule(Base):
    """One rule's counts in one run: what it matched and changed, nothing about which rows."""
    __tablename__ = "retention_run_rules"
    id = Column(BigInteger, primary_key=True)
    run_id = Column(BigInteger, ForeignKey("retention_runs.id"), nullable=False)
    rule = Column(String(64), nullable=False)
    version = Column(Integer, nullable=False)
    table_name = Column(String(64), nullable=False)
    action = Column(String(16), nullable=False)  # empty, anonymize
    cutoff = Column(DateTime(timezone=True), nullable=True)
    matched = Column(BigInteger, nullable=False)
    changed = Column(BigInteger, nullable=False)
    status = Column(String(32), nullable=False)
    error_code = Column(String(64), nullable=True)
