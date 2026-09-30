from app.database import database


def create_booking(user, data):
    return database().rpc('clinic_book_appointment', {'p_patient': user['id'],
        'p_doctor': str(data.doctor_id), 'p_service': str(data.service_id),
        'p_slot': str(data.slot_id), 'p_request': str(data.request_id), 'p_notes': data.notes}).execute().data


def list_appointments(column=None, value=None):
    query = database().table('appointments').select('*,doctors(id,full_name),services(id,name_ar,name_en,name_he),availability_slots(date,start_time,end_time)')
    if column:
        query = query.eq(column, value)
    return query.order('created_at', desc=True).limit(200).execute().data
