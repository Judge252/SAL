from pydantic import Field
from typing import Literal
from app.schemas.common import Input


class SpecialtyInput(Input):
    name_en: str = Field(min_length=2, max_length=120)
    name_ar: str = Field(default='', max_length=120)
    name_he: str = Field(default='', max_length=120)
    description: str = Field(default='', max_length=4000)
    active: bool = True


class ServiceInput(SpecialtyInput):
    duration_minutes: int = Field(ge=5, le=240)
    price: float = Field(ge=0, le=100000)
    consultation_type: Literal['clinic', 'video'] = 'clinic'
