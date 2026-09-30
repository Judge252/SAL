from uuid import UUID
from typing import Literal
from pydantic import Field
from app.schemas.common import Input


class BookingInput(Input):
    doctor_id: UUID
    service_id: UUID
    slot_id: UUID
    request_id: UUID
    notes: str = Field(default='', max_length=2000)


class StatusInput(Input):
    status: Literal['confirmed', 'completed', 'cancelled']
