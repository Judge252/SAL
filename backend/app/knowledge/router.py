from uuid import UUID
from typing import Literal
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from app.auth.service import admin_user
from app.database import database, audit
from app.knowledge.service import ingest, MAX_BYTES
from app.schemas.common import Input

router = APIRouter(prefix='/admin/knowledge', tags=['Knowledge'])


class Activation(Input):
    active: bool


@router.get('')
def documents(user=Depends(admin_user)):
    return database().table('knowledge_documents').select('*').order('created_at',desc=True).limit(200).execute().data


@router.post('', status_code=201)
def upload(file: UploadFile = File(...), title: str = Form(...,min_length=2,max_length=180),
           language: Literal['ar','en','he'] = Form('ar'), document_type: str = Form('general',max_length=80),
           doctor_id: UUID | None = Form(None), specialty_id: UUID | None = Form(None), user=Depends(admin_user)):
    return ingest(user,file.filename or '',file.file.read(MAX_BYTES+1),title,
                  str(doctor_id) if doctor_id else None,str(specialty_id) if specialty_id else None,language,document_type)


@router.patch('/{id}')
def activate(id: UUID, data: Activation, user=Depends(admin_user)):
    rows = database().table('knowledge_documents').select('*').eq('id',str(id)).execute().data
    if not rows: raise HTTPException(404,'Document not found')
    if data.active and rows[0]['status']!='completed': raise HTTPException(409,'Index document before activating')
    database().table('knowledge_documents').update(data.model_dump()).eq('id',str(id)).execute()
    audit(user['id'],'activate' if data.active else 'deactivate','knowledge_documents',str(id))
    return {'active':data.active}


@router.post('/{id}/replace', status_code=201)
def replace(id: UUID, file: UploadFile = File(...), user=Depends(admin_user)):
    rows = database().table('knowledge_documents').select('*').eq('id',str(id)).execute().data
    if not rows: raise HTTPException(404,'Document not found')
    old = rows[0]
    new = ingest(user,file.filename or '',file.file.read(MAX_BYTES+1),old['title'],old['doctor_id'],old['specialty_id'],old['language'],old['document_type'])
    database().table('knowledge_documents').update({'active':False}).eq('id',str(id)).execute()
    return new


@router.delete('/{id}')
def delete(id: UUID, user=Depends(admin_user)):
    rows = database().table('knowledge_documents').select('*').eq('id',str(id)).execute().data
    if not rows: raise HTTPException(404,'Document not found')
    database().table('knowledge_documents').update({'active':False}).eq('id',str(id)).execute()
    database().storage.from_('knowledge-base').remove([rows[0]['file_path']])
    database().table('knowledge_chunks').delete().eq('document_id',str(id)).execute()
    database().table('knowledge_documents').delete().eq('id',str(id)).execute()
    audit(user['id'],'delete','knowledge_documents',str(id))
    return {'deleted':True}
