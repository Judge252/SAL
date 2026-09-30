from fastapi import APIRouter, Depends, HTTPException, Request, Response
from app.auth.schemas import Login, Register, ProfileUpdate, Confirm, AuthDestination, Resend
from app.auth.service import current_user, set_session, clear_session, ACCESS, REFRESH
from app.database import new_client, database
from app.config import settings
from app.auth.redirects import safe_next
from urllib.parse import urlencode
import base64
import hashlib
import secrets
import httpx

PKCE = 'clinic-pkce'
STATE = 'clinic-oauth-state'


def confirmation_url(next_path: str) -> str:
    return settings().app_origin + '/auth/confirm?' + urlencode({'next': safe_next(next_path)})

router = APIRouter(prefix='/auth', tags=['Authentication'])


@router.post('/register', status_code=201)
def register(data: Register, response: Response):
    try:
        result = new_client().auth.sign_up({'email': str(data.email), 'password': data.password,
            'options': {'data': {'full_name': data.full_name, 'preferred_language': data.preferred_language},
                        'email_redirect_to': confirmation_url(data.next)}})
    except Exception:
        raise HTTPException(400, 'Unable to register. Check your details or try again later.') from None
    if result.session:
        set_session(response, result.session)
    return {'confirmation_required': result.session is None}


@router.post('/login')
def login(data: Login, response: Response):
    try:
        result = new_client().auth.sign_in_with_password({'email': str(data.email), 'password': data.password})
    except Exception:
        raise HTTPException(401, 'Invalid credentials or email not confirmed') from None
    set_session(response, result.session)
    return {'authenticated': True}


@router.post('/confirm')
def confirm(data: Confirm, request: Request, response: Response):
    try:
        client = new_client()
        if data.code:
            verifier = request.cookies.get(PKCE)
            expected = request.cookies.get(STATE)
            if not verifier or not expected or not data.state or not secrets.compare_digest(expected, data.state):
                raise ValueError('Missing or mismatched OAuth transaction')
            result = client.auth.exchange_code_for_session({'auth_code': data.code, 'code_verifier': verifier})
        elif data.token_hash:
            result = client.auth.verify_otp({'token_hash': data.token_hash, 'type': data.type})
        else:
            # Supabase's default confirmation email returns a token pair in the
            # URL fragment. Validate and rotate it into our existing HttpOnly cookies.
            original = client.auth.get_user(data.access_token).user
            result = client.auth.refresh_session(data.refresh_token)
            if not original or not result.user or original.id != result.user.id:
                raise ValueError('Session identities do not match')
        if not result.session:
            raise ValueError('No session returned')
        set_session(response, result.session)
        for key in (PKCE, STATE):
            response.delete_cookie(key, path='/', httponly=True, secure=settings().cookie_secure, samesite='lax')
    except Exception:
        raise HTTPException(400, 'Confirmation link is invalid or expired') from None
    return {'authenticated': True}


@router.post('/oauth/google')
def google(data: AuthDestination, response: Response):
    config = settings()
    try:
        options = httpx.get(config.supabase_url + '/auth/v1/settings',
            headers={'apikey': config.supabase_secret_key.get_secret_value()}, timeout=10)
        options.raise_for_status()
        if not options.json().get('external', {}).get('google'):
            raise HTTPException(503, 'Google sign-in is not enabled yet. Please use email to continue.')
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(503, 'Google sign-in is temporarily unavailable. Please use email.') from None
    verifier, state = secrets.token_urlsafe(48), secrets.token_urlsafe(32)
    challenge = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).decode().rstrip('=')
    redirect = confirmation_url(data.next) + '&' + urlencode({'state': state})
    for key, value in ((PKCE, verifier), (STATE, state)):
        response.set_cookie(key, value, max_age=600, httponly=True,
            secure=config.cookie_secure, samesite='lax', path='/')
    url = config.supabase_url + '/auth/v1/authorize?' + urlencode({
        'provider': 'google', 'redirect_to': redirect,
        'code_challenge': challenge, 'code_challenge_method': 's256',
        'scopes': 'openid email profile'})
    return {'url': url}


@router.post('/resend')
def resend(data: Resend):
    try:
        new_client().auth.resend({'type': 'signup', 'email': str(data.email),
            'options': {'email_redirect_to': confirmation_url(data.next)}})
    except Exception:
        raise HTTPException(429, 'Please wait before requesting another confirmation email.') from None
    return {'sent': True}


@router.post('/refresh')
def refresh(request: Request, response: Response):
    token = request.cookies.get(REFRESH)
    if not token:
        raise HTTPException(401, 'Sign in required')
    try:
        result = new_client().auth.refresh_session(token)
    except Exception:
        clear_session(response)
        response.status_code = 401
        return {'detail': 'Session expired'}
    set_session(response, result.session)
    return {'authenticated': True}


@router.post('/logout')
def logout(request: Request, response: Response):
    token = request.cookies.get(ACCESS)
    if token:
        try:
            new_client().auth.admin.sign_out(token, scope='local')
        except Exception:
            raise HTTPException(503, 'Session revocation unavailable. Please retry.') from None
    clear_session(response)
    return {'authenticated': False}


@router.get('/me')
def me(user=Depends(current_user)):
    return user


@router.patch('/me')
def update_profile(data: ProfileUpdate, user=Depends(current_user)):
    return database().table('profiles').update(data.model_dump()).eq('id', user['id']).execute().data[0]
