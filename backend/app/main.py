from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from postgrest.exceptions import APIError
from app.config import settings
from app.routes.specialties import router as specialties_router
from app.auth.router import router as auth_router
from app.doctors.router import router as doctors_router
from app.services.router import router as services_router
from app.appointments.router import router as appointments_router
from app.knowledge.router import router as knowledge_router
from app.sal.router import router as sal_router
from app.payments.router import router as payments_router
from app.storage.router import router as storage_router

app = FastAPI(title='The Clinic API', version='1.0.0')
app.add_middleware(CORSMiddleware, allow_origins=[settings().app_origin],
                   allow_credentials=True, allow_methods=['GET','POST','PATCH','PUT','DELETE'],
                   allow_headers=['Content-Type'])
for router in [specialties_router, auth_router, doctors_router, services_router, appointments_router,
               knowledge_router, sal_router, payments_router, storage_router]:
    app.include_router(router)


@app.middleware('http')
async def security_headers(request: Request, call_next):
    if request.method not in ('GET', 'HEAD', 'OPTIONS'):
        # Browser cookie authentication requires exact-origin CSRF protection.
        if request.headers.get('origin') != settings().app_origin:
            return JSONResponse({'detail': 'Request origin is not allowed'}, status_code=403)
    response = await call_next(request)
    response.headers['Cache-Control'] = 'no-store'
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['Referrer-Policy'] = 'no-referrer'
    return response


@app.exception_handler(RequestValidationError)
async def validation_error(request, error):
    # FastAPI's default includes rejected input, which can contain passwords.
    return JSONResponse({'detail': 'Invalid input', 'fields': [
        {'field': '.'.join(map(str, item['loc'])), 'message': item['msg']}
        for item in error.errors()]}, status_code=422)


@app.exception_handler(APIError)
async def database_error(request, error):
    code = error.code
    if code in ('PGRST202', 'PGRST204', '42703', '42883'):
        return JSONResponse({'detail': 'Database upgrade is required. Contact the platform administrator.'}, status_code=503)
    if code in ('23505', '23P01', 'P0001'):
        return JSONResponse({'detail': 'The record or appointment is no longer available, or the requested change is invalid.'}, status_code=409)
    if code == '42501':
        return JSONResponse({'detail': 'Insufficient permissions'}, status_code=403)
    return JSONResponse({'detail': 'Database request failed. Please try again.'}, status_code=503)


@app.exception_handler(Exception)
async def unavailable(request, error):
    return JSONResponse({'detail': 'Service temporarily unavailable. Please retry.'}, status_code=503)


@app.get('/health')
@app.get('/')
def root():
    return {'status': 'ok', 'service': 'The Clinic API'}
