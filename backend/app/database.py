from functools import lru_cache
from supabase import create_client, ClientOptions
from app.config import settings


def new_client():
    config = settings()
    return create_client(config.supabase_url, config.supabase_secret_key.get_secret_value(),
                         options=ClientOptions(auto_refresh_token=False, persist_session=False))


@lru_cache
def database():
    # This privileged client is never used for sign-in. Every private service
    # scopes data using a server-verified profile, not user-supplied ownership.
    return new_client()


def audit(actor_id: str, action: str, table: str, record_id: str):
    database().table('audit_logs').insert(dict(user_id=actor_id, action=action,
                                             table_name=table, record_id=record_id)).execute()
