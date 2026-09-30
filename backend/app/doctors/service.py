from datetime import datetime
from zoneinfo import ZoneInfo
from fastapi import HTTPException
from app.database import database
from app.config import settings

PUBLIC_SELECT = 'id,full_name,bio,experience_years,languages,consultation_fee,profile_image,specialty_id,status,specialties(*),doctor_locations(*),doctor_services(services(*))'


def get_availability(doctor_id):
    now = datetime.now(ZoneInfo(settings().clinic_timezone))
    rows = database().table('availability_slots').select('*').eq('doctor_id', doctor_id).eq('is_booked', False).gte('date', now.date().isoformat()).order('date').order('start_time').limit(250).execute().data
    return [r for r in rows if datetime.fromisoformat(r['date']+'T'+r['start_time']).replace(tzinfo=now.tzinfo) > now]


def search_doctors(specialty=None, city=None, language=None, consultation_type=None, q='', limit=100):
    query = database().table('doctors').select(PUBLIC_SELECT).eq('status', 'approved')
    if specialty:
        query = query.eq('specialty_id', specialty)
    if language:
        query = query.contains('languages', [language])
    # Parameters never become PostgREST filter syntax. Bounded substring matching
    # also includes multilingual specialty labels and clinic names.
    rows = query.order('full_name').limit(500).execute().data
    output = []
    for row in rows:
        if not (row.get('specialties') or {}).get('active'):
            continue
        row['services'] = [s['services'] for s in row.pop('doctor_services') if s.get('services') and s['services']['active']]
        if city and not any(l.get('city', '').casefold() == city.casefold() for l in row['doctor_locations']):
            continue
        if consultation_type and not any(s.get('consultation_type') == consultation_type for s in row['services']):
            continue
        names = ' '.join(str(v or '') for k,v in (row['specialties'] or {}).items() if k.startswith('name_'))
        if q and q.casefold() not in (row['full_name']+' '+names).casefold():
            continue
        output.append(row)
    return output[:limit]


def doctor_detail(id):
    rows = database().table('doctors').select(PUBLIC_SELECT).eq('id', id).eq('status', 'approved').execute().data
    if not rows or not (rows[0].get('specialties') or {}).get('active'):
        raise HTTPException(404, 'Doctor not found')
    row = rows[0]
    row['services'] = [s['services'] for s in row.pop('doctor_services') if s.get('services') and s['services']['active']]
    row['availability'] = get_availability(id)
    return row


def own_doctor(user):
    rows = database().table('doctors').select('*').eq('profile_id', user['id']).execute().data
    if not rows:
        raise HTTPException(404, 'Your doctor profile has not been linked by an administrator')
    return rows[0]
