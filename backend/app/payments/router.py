from uuid import UUID
from fastapi import APIRouter, Depends
from app.auth.service import patient_user, admin_user
from app.payments.service import payments
from app.schemas.common import Input

router = APIRouter(prefix='/payments',tags=['Payments'])

class PaymentInput(Input):
    appointment_id: UUID

@router.post('',status_code=201)
def create(data: PaymentInput,user=Depends(patient_user)):
    return payments().create_payment(user,str(data.appointment_id))

@router.post('/{id}/verify')
def verify(id: UUID,user=Depends(admin_user)):
    # No patient-facing operation can mark a charge paid. Test mode is explicit.
    return payments().verify_payment(user,str(id))

@router.post('/{id}/refund')
def refund(id: UUID,user=Depends(admin_user)):
    return payments().refund_payment(user,str(id))
