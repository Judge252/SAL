from uuid import UUID
from fastapi import APIRouter, Depends, Query
from app.auth.service import admin_user, doctor_user
from app.database import database, audit
from app.doctors.schemas import DoctorInput, DoctorSelfUpdate, SlotInput
from app.doctors.service import search_doctors, doctor_detail, own_doctor, get_availability

router = APIRouter(tags=['Doctors'])


@router.get('/doctors')
def doctors(q: str = Query('', max_length=120), specialty: UUID | None = None,
            city: str | None = Query(None, max_length=100), language: str | None = Query(None, max_length=40),
            consultation_type: str | None = Query(None, pattern='^(clinic|video)$')):
    return search_doctors(str(specialty) if specialty else None, city, language, consultation_type, q)


@router.get('/doctors/{id}')
def profile(id: UUID):
    return doctor_detail(str(id))


@router.get('/doctors/{id}/availability')
def availability(id: UUID):
    return doctor_detail(str(id))['availability']


@router.get('/doctor/profile')
def my_profile(user=Depends(doctor_user)):
    return own_doctor(user)


@router.patch('/doctor/profile')
def edit_my_profile(data: DoctorSelfUpdate, user=Depends(doctor_user)):
    row = own_doctor(user)
    # Clinical profile edits need administrator review before republication.
    return database().table('doctors').update({**data.model_dump(), 'status': 'pending'}).eq('id', row['id']).execute().data[0]


@router.get('/doctor/availability')
def own_slots(user=Depends(doctor_user)):
    return get_availability(own_doctor(user)['id'])


@router.post('/doctor/availability', status_code=201)
def add_slot(data: SlotInput, user=Depends(doctor_user)):
    return database().rpc('clinic_add_slot', {'p_actor': user['id'], 'p_doctor': own_doctor(user)['id'],
        'p_date': data.date.isoformat(), 'p_start': data.start_time.isoformat(), 'p_end': data.end_time.isoformat()}).execute().data


@router.delete('/doctor/availability/{id}')
def remove_slot(id: UUID, user=Depends(doctor_user)):
    return database().rpc('clinic_remove_slot', {'p_actor': user['id'], 'p_slot': str(id)}).execute().data


@router.get('/admin/doctors')
def all_doctors(user=Depends(admin_user)):
    return database().table('doctors').select('*,doctor_locations(*),doctor_services(*)').order('created_at', desc=True).execute().data


@router.get('/admin/doctor-accounts')
def doctor_accounts(user=Depends(admin_user)):
    return database().table('profiles').select('id,full_name,role').eq('role','doctor').execute().data


@router.post('/admin/doctors', status_code=201)
def create(data: DoctorInput, user=Depends(admin_user)):
    return database().rpc('clinic_save_doctor', {'p_actor': user['id'], 'p_id': None, 'p_data': data.model_dump(mode='json')}).execute().data


@router.patch('/admin/doctors/{id}')
def update(id: UUID, data: DoctorInput, user=Depends(admin_user)):
    return database().rpc('clinic_save_doctor', {'p_actor': user['id'], 'p_id': str(id), 'p_data': data.model_dump(mode='json')}).execute().data


@router.patch('/admin/doctors/{id}/approve')
def approve(id: UUID, user=Depends(admin_user)):
    from app.services.service import save
    return save('doctors', {'status': 'approved'}, user, str(id))


@router.delete('/admin/doctors/{id}')
def deactivate(id: UUID, user=Depends(admin_user)):
    from app.services.service import save
    return save('doctors', {'status': 'inactive'}, user, str(id))
