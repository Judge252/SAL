from uuid import UUID
from fastapi import APIRouter, Depends
from app.auth.service import patient_user, doctor_user, admin_user, current_user
from app.doctors.service import own_doctor
from app.appointments.schemas import BookingInput, StatusInput
from app.appointments.service import create_booking, list_appointments
from app.database import database

router = APIRouter(tags=['Appointments'])


@router.post('/appointments', status_code=201)
def book(data: BookingInput, user=Depends(patient_user)):
    return create_booking(user, data)


@router.get('/patient/appointments')
def patient_appointments(user=Depends(patient_user)):
    return list_appointments('patient_id', user['id'])


@router.get('/doctor/appointments')
def doctor_appointments(user=Depends(doctor_user)):
    return list_appointments('doctor_id', own_doctor(user)['id'])


@router.get('/admin/appointments')
def admin_appointments(user=Depends(admin_user)):
    return list_appointments()


@router.patch('/appointments/{id}')
def change_status(id: UUID, data: StatusInput, user=Depends(current_user)):
    return database().rpc('clinic_appointment_status', {'p_actor': user['id'], 'p_id': str(id), 'p_status': data.status}).execute().data
