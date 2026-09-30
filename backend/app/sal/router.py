from uuid import UUID
from typing import Literal
from pydantic import Field
from fastapi import APIRouter, Depends, Request, HTTPException
from app.auth.service import patient_user, current_user, ACCESS, REFRESH
from app.schemas.common import Input
from app.database import database
from app.sal.service import chat, history, guest_chat
from app.sal.guest_limits import check_guest_budget
from app.appointments.schemas import BookingInput
from app.appointments.service import create_booking

router = APIRouter(prefix='/sal',tags=['SAL'])


class GuestTurn(Input):
    role: Literal['user','assistant']
    content: str = Field(min_length=1,max_length=4000)


class Message(Input):
    message: str = Field(min_length=1,max_length=4000)
    locale: Literal['ar','en','he'] = 'ar'
    conversation_id: UUID | None = None
    history: list[GuestTurn] = Field(default_factory=list, max_length=16)


@router.post('/chat')
def send(data: Message, request: Request):
    if not request.cookies.get(ACCESS) and not request.cookies.get(REFRESH):
        if data.conversation_id:
            raise HTTPException(401, 'Sign in to continue a saved conversation')
        check_guest_budget()
        return guest_chat(data.message, data.locale, [m.model_dump() for m in data.history])
    user = current_user(request)
    if user['role'] != 'patient':
        raise HTTPException(403, 'Care conversations require a patient account')
    return chat(user,data.message,data.locale,str(data.conversation_id) if data.conversation_id else None)


@router.get('/conversations')
def conversations(user=Depends(patient_user)):
    return database().table('sal_conversations').select('*').eq('patient_id',user['id']).order('created_at',desc=True).limit(100).execute().data


@router.get('/conversations/{id}')
def messages(id: UUID,user=Depends(patient_user)):
    return history(user,str(id))


@router.post('/booking',status_code=201)
def confirmed_booking(data: BookingInput,user=Depends(patient_user)):
    # SAL cannot invoke writes through model output. Same explicit confirmation
    # and transactional validation as the regular patient booking endpoint.
    return create_booking(user,data)
