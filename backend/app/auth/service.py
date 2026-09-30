from fastapi import Depends, HTTPException, Request, Response
from app.database import database, new_client
from app.config import settings

ACCESS = 'clinic-access'
REFRESH = 'clinic-refresh'


def set_session(response: Response, session):
    for key, value, age in [(ACCESS, session.access_token, session.expires_in),
                            (REFRESH, session.refresh_token, 60 * 60 * 24 * 14)]:
        response.set_cookie(key, value, max_age=age, httponly=True,
                            secure=settings().cookie_secure, samesite='lax', path='/')
    response.headers['Cache-Control'] = 'no-store'


def clear_session(response: Response):
    for key in [ACCESS, REFRESH]:
        response.delete_cookie(key, path='/', httponly=True, secure=settings().cookie_secure, samesite='lax')


def current_user(request: Request):
    token = request.cookies.get(ACCESS)
    if not token:
        raise HTTPException(401, 'Sign in required')
    try:
        user = new_client().auth.get_user(token).user
    except Exception:
        raise HTTPException(401, 'Session expired') from None
    if not user:
        raise HTTPException(401, 'Invalid session')
    rows = database().table('profiles').select('*').eq('id', str(user.id)).execute().data
    if not rows:
        # A confirmed auth user may lack a profile if the original DB has no trigger.
        # Role is ALWAYS assigned by this service, never copied from user metadata.
        database().table('profiles').upsert({'id': str(user.id), 'role': 'patient',
            'full_name': str((user.user_metadata or {}).get('full_name', ''))[:120]},
            on_conflict='id', ignore_duplicates=True).execute()
        rows = database().table('profiles').select('*').eq('id', str(user.id)).execute().data
    return {**rows[0], 'email': user.email}


def require_roles(*roles):
    def dependency(user=Depends(current_user)):
        if user['role'] not in roles:
            raise HTTPException(403, 'Insufficient permissions')
        return user
    return dependency


admin_user = require_roles('admin', 'super_admin')
doctor_user = require_roles('doctor')
patient_user = require_roles('patient')
