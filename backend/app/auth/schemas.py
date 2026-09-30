from typing import Literal
from pydantic import EmailStr, Field, model_validator
from app.schemas.common import Input


class Login(Input):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class Register(Login):
    full_name: str = Field(min_length=2, max_length=120)
    preferred_language: Literal['ar', 'en', 'he'] = 'ar'
    next: str = Field(default='/dashboard', max_length=500)


class ProfileUpdate(Input):
    full_name: str = Field(min_length=2, max_length=120)
    phone: str | None = Field(default=None, max_length=30, pattern=r'^\+?[0-9 ()-]{6,30}$')
    preferred_language: Literal['ar', 'en', 'he'] = 'ar'


class Confirm(Input):
    token_hash: str | None = Field(default=None, min_length=10, max_length=512)
    type: Literal['signup', 'email'] = 'signup'
    code: str | None = Field(default=None, min_length=10, max_length=2048)
    state: str | None = Field(default=None, max_length=128)
    access_token: str | None = Field(default=None, max_length=8192)
    refresh_token: str | None = Field(default=None, max_length=2048)

    @model_validator(mode='after')
    def one_method(self):
        if sum([bool(self.token_hash), bool(self.code), bool(self.access_token or self.refresh_token)]) != 1:
            raise ValueError('Exactly one confirmation method is required')
        if bool(self.access_token) != bool(self.refresh_token):
            raise ValueError('Both session tokens are required')
        return self


class AuthDestination(Input):
    next: str = Field(default='/dashboard', max_length=500)


class Resend(AuthDestination):
    email: EmailStr
