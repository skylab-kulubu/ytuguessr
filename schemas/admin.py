from datetime import date, datetime, time, timedelta, timezone
from pydantic import BaseModel, BeforeValidator, ConfigDict, Field, model_validator
from typing import Annotated, Optional

class LocationDetail(BaseModel):
    id: int
    image_url: str
    lat: float
    lng: float

    model_config = ConfigDict(from_attributes=True)

class LocationCreate(BaseModel):
    image_url: str
    lat: float
    lng: float

    model_config = ConfigDict(from_attributes=True)

class LocationUpdate(BaseModel):
    image_url: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)


# Turkey keeps UTC+3 all year: a bare date is a whole day there.
TURKEY = timezone(timedelta(hours=3))
SLUG_PATTERN = r"^[a-z0-9]+(?:-[a-z0-9]+)*$"


def _moment(value, end_of_day: bool):
    """'2026-11-26' (the start of that day in Turkey; for ends_at the end of it, so the day counts)
    or a time with its offset, '2026-11-26T10:00:00+03:00'. Stored in UTC."""
    if isinstance(value, str):
        text = value.strip()
        if len(text) == 10:
            value = date.fromisoformat(text)
        else:
            value = datetime.fromisoformat(text.replace("Z", "+00:00"))
    if isinstance(value, datetime):
        if value.tzinfo is None:
            raise ValueError("saat, ofsetiyle verilmeli (ör. 2026-11-26T10:00:00+03:00)")
        return value.astimezone(timezone.utc)
    if isinstance(value, date):
        day = value + timedelta(days=1) if end_of_day else value
        return datetime.combine(day, time(0), TURKEY).astimezone(timezone.utc)
    raise ValueError("tarih (2026-11-26) ya da ofsetli saat (2026-11-26T10:00:00+03:00) bekleniyor")


StartsAt = Annotated[datetime, BeforeValidator(lambda v: _moment(v, end_of_day=False))]
EndsAt = Annotated[datetime, BeforeValidator(lambda v: _moment(v, end_of_day=True))]


class EventCreate(BaseModel):
    slug: str = Field(pattern=SLUG_PATTERN, max_length=64)
    name: str = Field(min_length=1, max_length=128)
    starts_at: StartsAt
    ends_at: EndsAt

    @model_validator(mode="after")
    def _ends_after_start(self):
        if self.ends_at <= self.starts_at:
            raise ValueError("ends_at, starts_at'tan sonra olmalı.")
        return self


class EventUpdate(BaseModel):
    slug: Optional[str] = Field(None, pattern=SLUG_PATTERN, max_length=64)
    name: Optional[str] = Field(None, min_length=1, max_length=128)
    starts_at: Optional[StartsAt] = None
    ends_at: Optional[EndsAt] = None


class EventDetail(BaseModel):
    id: int
    slug: str
    name: str
    starts_at: datetime
    ends_at: datetime

    model_config = ConfigDict(from_attributes=True)
