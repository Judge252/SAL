import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from fastapi.testclient import TestClient
from app.main import app
from app.auth.service import current_user
from app.config import settings

client = TestClient(app)
origin = {'origin': settings().app_origin}


def test_health_and_private_routes():
    assert client.get('/health').status_code == 200
    for url in ['/auth/me', '/patient/appointments', '/doctor/appointments', '/admin/doctors', '/admin/services']:
        assert client.get(url).status_code == 401


def test_csrf_rejects_other_origin():
    assert client.post('/auth/logout', headers={'origin':'https://attacker.invalid'}).status_code == 403


def test_patient_cannot_administer():
    app.dependency_overrides[current_user] = lambda: {'id':'00000000-0000-0000-0000-000000000001', 'role':'patient'}
    try:
        for url in ['/admin/doctors','/admin/services','/admin/appointments','/doctor/profile']:
            assert client.get(url).status_code == 403
    finally:
        app.dependency_overrides.clear()


def test_role_injection_and_password_redaction():
    secret = 'should-never-echo'
    response = client.post('/auth/register', headers=origin, json={
        'email':'person@example.com','password':secret,'full_name':'Test Person','role':'super_admin'})
    assert response.status_code == 422
    assert secret not in response.text


def test_slot_validation():
    from app.doctors.schemas import SlotInput
    import pytest
    with pytest.raises(ValueError):
        SlotInput(date='2030-01-01',start_time='11:00',end_time='10:00')
