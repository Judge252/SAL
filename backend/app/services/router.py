from uuid import UUID
from fastapi import APIRouter, Depends
from app.auth.service import admin_user
from app.database import database
from app.services.schemas import ServiceInput, SpecialtyInput
from app.services.service import list_active, save

router = APIRouter(tags=['Services and specialties'])


@router.get('/services')
def services():
    return list_active('services')


@router.get('/admin/services')
def admin_services(user=Depends(admin_user)):
    return database().table('services').select('*').order('name_en').execute().data


@router.get('/admin/specialties')
def admin_specialties(user=Depends(admin_user)):
    return database().table('specialties').select('*').order('name_en').execute().data


@router.post('/admin/services', status_code=201)
def create_service(data: ServiceInput, user=Depends(admin_user)):
    return save('services', data.model_dump(), user)


@router.patch('/admin/services/{id}')
def update_service(id: UUID, data: ServiceInput, user=Depends(admin_user)):
    return save('services', data.model_dump(), user, str(id))


@router.delete('/admin/services/{id}')
def deactivate_service(id: UUID, user=Depends(admin_user)):
    return save('services', {'active': False}, user, str(id))


@router.post('/admin/specialties', status_code=201)
def create_specialty(data: SpecialtyInput, user=Depends(admin_user)):
    return save('specialties', data.model_dump(), user)


@router.patch('/admin/specialties/{id}')
def update_specialty(id: UUID, data: SpecialtyInput, user=Depends(admin_user)):
    return save('specialties', data.model_dump(), user, str(id))


@router.delete('/admin/specialties/{id}')
def deactivate_specialty(id: UUID, user=Depends(admin_user)):
    return save('specialties', {'active': False}, user, str(id))
