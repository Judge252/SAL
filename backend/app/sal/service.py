import json
from uuid import uuid4
from typing import Literal
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException
from pydantic import BaseModel, Field
from google.genai import types
from google.genai.errors import APIError as GeminiError
import httpx
from app.database import database
from app.knowledge.service import gemini, search_knowledge
from app.config import settings
from app.sal.prompts import SYSTEM
from app.doctors.service import search_doctors
from app.sal.errors import stage, logger


class Navigation(BaseModel):
    answer: str = Field(max_length=4000)
    urgent: bool = False
    specialty_id: str | None = None
    city: str | None = None
    language: str | None = None
    consultation_type: Literal['clinic','video'] | None = None
    source_ids: list[str] = Field(default_factory=list, max_length=6)


def owned_conversation(user, conversation_id):
    rows = database().table('sal_conversations').select('*').eq('id',conversation_id).eq('patient_id',user['id']).execute().data
    if not rows: raise HTTPException(404,'Conversation not found')
    return rows[0]


def history(user, conversation_id):
    owned_conversation(user,conversation_id)
    return database().table('sal_messages').select('id,role,content,created_at').eq('conversation_id',conversation_id).order('created_at').limit(100).execute().data


def chat(user, message, locale, conversation_id=None):
    with stage('persistence', 'CONVERSATION_UNAVAILABLE', 'Your conversation could not be loaded or saved.'):
        return _chat(user, message, locale, conversation_id)


def _chat(user, message, locale, conversation_id=None):
    cutoff = (datetime.now(timezone.utc)-timedelta(minutes=1)).isoformat()
    sessions = database().table('sal_conversations').select('id').eq('patient_id',user['id']).execute().data
    ids = [s['id'] for s in sessions]
    if ids:
        recent = database().table('sal_messages').select('id',count='exact',head=True).in_('conversation_id',ids).eq('role','user').gte('created_at',cutoff).execute().count
        if recent >= 8: raise HTTPException(429,'Please wait before sending another message')
    if conversation_id:
        messages = history(user,conversation_id)
        if len(messages)>=98: raise HTTPException(409,'Start a new conversation to continue')
    else:
        conversation_id = str(uuid4())
        database().table('sal_conversations').insert({'id':conversation_id,'patient_id':user['id']}).execute()
        messages = []
    database().table('sal_messages').insert({'conversation_id':conversation_id,'role':'user','content':message}).execute()
    try:
        result = navigate(message, locale, messages)
    except HTTPException as error:
        detail = error.detail if isinstance(error.detail, dict) else {'message': error.detail}
        raise HTTPException(error.status_code, {**detail, 'conversation_id':conversation_id,
                            'message_saved':True}) from None
    try:
        with stage('save_reply', 'CONVERSATION_SAVE_FAILED', 'SAL replied, but the conversation could not be saved.'):
            saved = database().table('sal_messages').insert({'conversation_id':conversation_id,'role':'assistant','content':result.pop('answer')}).execute().data[0]
    except HTTPException as error:
        raise HTTPException(error.status_code, {**error.detail, 'conversation_id':conversation_id,
                            'message_saved':True}) from None
    return {'conversation_id':conversation_id,'message':saved, **result}


def generate_navigation(payload):
    config = types.GenerateContentConfig(
        system_instruction=SYSTEM, response_mime_type='application/json',
        response_json_schema=Navigation.model_json_schema(),
        automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
        temperature=0.2, max_output_tokens=2200,
        # Bound retries per model instead of multiplying the SDK's default five
        # attempts by a model fallback. Never retry auth/quota/schema failures.
        http_options=types.HttpOptions(timeout=30000, retry_options=types.HttpRetryOptions(
            attempts=2, initial_delay=1, max_delay=2,
            http_status_codes=[408,500,502,503,504])))
    primary = settings().gemini_model
    fallback = settings().gemini_fallback_model
    models = [primary] + ([fallback] if fallback and fallback != primary else [])
    with gemini() as client:
        for index, model in enumerate(models):
            try:
                result = client.models.generate_content(model=model,
                    contents=json.dumps(payload,ensure_ascii=False),config=config)
                return Navigation.model_validate_json(result.text)
            except (GeminiError, httpx.TransportError) as error:
                transient = isinstance(error, httpx.TransportError) or error.code in (408,500,502,503,504)
                if not transient or index == len(models)-1:
                    raise
                logger.warning('sal_model_fallback error_type=%s upstream_code=%s',
                               type(error).__name__, getattr(error,'code',None))
    raise RuntimeError('No generation model configured')


def navigate(message, locale, messages):
    # Both guest and account sessions use the same real Gemini/RAG pipeline.
    with stage('catalog', 'CATALOG_UNAVAILABLE', 'The care directory is temporarily unavailable.'):
        specialties = database().table('specialties').select('id,name_en').eq('active',True).execute().data
    with stage('retrieval', 'RAG_UNAVAILABLE', 'SAL could not access its knowledge service. Please try again.'):
        docs_exist = database().table('knowledge_documents').select('id').eq('active',True).eq('status','completed').limit(1).execute().data
        sources = search_knowledge(message,language=locale) if docs_exist else []
    with stage('generation', 'AI_UNAVAILABLE', 'The AI service is temporarily busy or unavailable. Please try again.'):
        payload = {'locale':locale,'specialties':specialties,'history':messages[-16:],
                   'message':message,'knowledge':sources}
        navigation = generate_navigation(payload)
    allowed_ids = {s['id'] for s in specialties}
    specialty = navigation.specialty_id if navigation.specialty_id in allowed_ids else None
    with stage('doctor_matching', 'CATALOG_UNAVAILABLE', 'The care directory is temporarily unavailable.'):
        doctors = [] if navigation.urgent else search_doctors(specialty,navigation.city,navigation.language,navigation.consultation_type,limit=5)
    cited = [s for s in sources if s['id'] in navigation.source_ids]
    return {'answer':navigation.answer,'urgent':navigation.urgent,
            'doctors':doctors,'sources':[{'id':s['id'],'title':s['title']} for s in cited],
            'match_context': {'specialty_id':specialty,'city':navigation.city,
                'language':navigation.language,'consultation_type':navigation.consultation_type}}


def guest_chat(message, locale, messages):
    result = navigate(message, locale, messages)
    return {'conversation_id':None, 'message':{'id':str(uuid4()),'role':'assistant',
        'content':result.pop('answer'),'created_at':datetime.now(timezone.utc).isoformat()}, **result}
