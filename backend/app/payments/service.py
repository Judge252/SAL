from abc import ABC, abstractmethod
from uuid import uuid4
from fastapi import HTTPException
from app.database import database
from app.config import settings


class PaymentProvider(ABC):
    @abstractmethod
    def create_payment(self, appointment): ...
    @abstractmethod
    def verify_payment(self, payment): ...
    @abstractmethod
    def refund_payment(self, payment): ...


class TestPaymentProvider(PaymentProvider):
    def create_payment(self, appointment):
        return {'provider':'test','transaction_id':'test_'+str(uuid4()),
                'amount':appointment['amount'],'currency':appointment['currency'],'status':'pending'}
    def verify_payment(self, payment):
        return payment['provider']=='test' and payment['transaction_id'].startswith('test_')
    def refund_payment(self, payment):
        return self.verify_payment(payment)


class PaymentService:
    def __init__(self, provider: PaymentProvider):
        self.provider = provider

    def create_payment(self, actor, appointment_id):
        rows = database().table('appointments').select('*').eq('id',appointment_id).eq('patient_id',actor['id']).execute().data
        if not rows: raise HTTPException(404,'Appointment not found')
        appointment = rows[0]
        if appointment['status']=='cancelled': raise HTTPException(409,'Appointment cancelled')
        data = self.provider.create_payment(appointment)
        return database().rpc('clinic_create_payment',{'p_actor':actor['id'],'p_appointment':appointment_id,'p_provider':data['provider'],'p_transaction':data['transaction_id']}).execute().data

    def verify_payment(self, actor, payment_id):
        rows = database().table('payments').select('*').eq('id',payment_id).execute().data
        if not rows: raise HTTPException(404,'Payment not found')
        if not self.provider.verify_payment(rows[0]): raise HTTPException(409,'Payment verification failed')
        return database().rpc('clinic_payment_status',{'p_actor':actor['id'],'p_id':payment_id,'p_status':'paid'}).execute().data

    def refund_payment(self, actor, payment_id):
        rows = database().table('payments').select('*').eq('id',payment_id).execute().data
        if not rows: raise HTTPException(404,'Payment not found')
        if not self.provider.refund_payment(rows[0]): raise HTTPException(409,'Refund failed')
        return database().rpc('clinic_payment_status',{'p_actor':actor['id'],'p_id':payment_id,'p_status':'refunded'}).execute().data


def payments():
    if settings().payment_provider!='test':
        raise HTTPException(503,'Online payments are not enabled')
    return PaymentService(TestPaymentProvider())
