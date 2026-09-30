from functools import lru_cache
from pathlib import Path
from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=Path(__file__).resolve().parents[1] / '.env', extra='ignore')
    supabase_url: str
    supabase_secret_key: SecretStr
    gemini_api_key: SecretStr
    app_origin: str = 'http://127.0.0.1:3107'
    cookie_secure: bool = False
    gemini_model: str = 'gemini-3.8-flash'
    gemini_fallback_model: str = 'gemini-3.5-flash'
    embedding_model: str = 'gemini-embedding-001'
    clinic_timezone: str = 'Asia/Jerusalem'
    payment_provider: str = 'disabled'


@lru_cache
def settings() -> Settings:
    return Settings()
