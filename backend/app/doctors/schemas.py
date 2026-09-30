from datetime import date, time
from uuid import UUID
from pydantic import Field, model_validator
from app.schemas.common import Input


class Location(Input):
    clinic_name: str = Field(min_length=1, max_length=200)
    address: str = Field(min_length=1, max_length=300)
    city: str = Field(min_length=1, max_length=100)


class DoctorInput(Input):
    full_name: str = Field(min_length=2, max_length=120)
    profile_id: UUID | None = None
    specialty_id: UUID
    languages: list[str] = Field(min_length=1, max_length=10)
    experience_years: int = Field(ge=0, le=80)
    bio: str = Field(min_length=10, max_length=8000)
    consultation_fee: float = Field(ge=0, le=100000)
    service_ids: list[UUID] = Field(min_length=1, max_length=30)
    location: Location


class DoctorSelfUpdate(Input):
    bio: str = Field(min_length=10, max_length=8000)
    languages: list[str] = Field(min_length=1, max_length=10)
    experience_years: int = Field(ge=0, le=80)
    consultation_fee: float = Field(ge=0, le=100000)


class SlotInput(Input):
    date: date
    start_time: time
    end_time: time

    @model_validator(mode='after')
    def valid_range(self):
        if self.end_time <= self.start_time:
            raise ValueError('End time must be after start time')
        return self
