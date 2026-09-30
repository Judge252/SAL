from types import SimpleNamespace as Obj
from unittest.mock import Mock
import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from google.genai.errors import ServerError, ClientError
from app.main import app
from app.config import settings
from app.sal import service
from app.sal.errors import stage


def database_stub(monkeypatch, docs=None):
    db = Mock()
    db.select.return_value = db
    db.eq.return_value = db
    db.limit.return_value = db
    table = ['']
    def select_table(name):
        table[0] = name
        return db
    db.table.side_effect = select_table
    db.execute.side_effect = lambda: Obj(data=(docs or []) if table[0] == 'knowledge_documents' else [])
    monkeypatch.setattr(service, 'database', lambda: db)
    return db


def model_client(monkeypatch, outcomes):
    client = Mock()
    client.__enter__ = Mock(return_value=client)
    client.__exit__ = Mock(return_value=False)
    client.models.generate_content.side_effect = outcomes
    monkeypatch.setattr(service, 'gemini', lambda: client)
    monkeypatch.setattr(service, 'settings', lambda: Obj(gemini_model='primary', gemini_fallback_model='fallback'))
    return client


def test_overload_uses_same_payload_and_schema_on_real_model_fallback(monkeypatch):
    client = model_client(monkeypatch, [ServerError(503, {'error':{'message':'busy'}}),
        Obj(text='{"answer":"Which city?"}')])
    assert service.generate_navigation({'message':'synthetic concern'}).answer == 'Which city?'
    calls = client.models.generate_content.call_args_list
    assert [c.kwargs['model'] for c in calls] == ['primary','fallback']
    assert calls[0].kwargs['contents'] == calls[1].kwargs['contents']
    assert calls[0].kwargs['config'] == calls[1].kwargs['config']
    assert calls[0].kwargs['config'].http_options.retry_options.attempts == 2


@pytest.mark.parametrize('status,code', [(403,'AI_CONFIGURATION'),(429,'AI_RATE_LIMITED')])
def test_non_transient_failures_do_not_trigger_fallback(monkeypatch,status,code):
    client = model_client(monkeypatch, [ClientError(status, {'error':{'message':'private upstream text'}})])
    with pytest.raises(HTTPException) as caught:
        with stage('generation','AI_UNAVAILABLE','Unavailable'):
            service.generate_navigation({})
    assert caught.value.detail['code'] == code
    assert client.models.generate_content.call_count == 1


def test_empty_kb_skips_embeddings_but_still_generates(monkeypatch):
    database_stub(monkeypatch)
    retrieval = Mock(side_effect=AssertionError('Empty KB should not need embeddings'))
    monkeypatch.setattr(service,'search_knowledge',retrieval)
    generation = Mock(return_value=service.Navigation(answer='Tell me more'))
    monkeypatch.setattr(service,'generate_navigation',generation)
    monkeypatch.setattr(service,'search_doctors',lambda *a,**k:[])
    result = service.guest_chat('synthetic concern','en',[])
    assert result['conversation_id'] is None
    assert result['sources'] == result['doctors'] == []
    assert generation.call_args.args[0]['knowledge'] == []


def test_zero_vector_matches_and_no_invented_sources_or_doctors(monkeypatch):
    database_stub(monkeypatch, [{'id':'active-document'}])
    monkeypatch.setattr(service,'search_knowledge',lambda *a,**k:[])
    monkeypatch.setattr(service,'generate_navigation',lambda payload:service.Navigation(
        answer='Tell me more', specialty_id='invented-id', source_ids=['invented-source']))
    doctors = Mock(return_value=[{'id':'database-record'}])
    monkeypatch.setattr(service,'search_doctors',doctors)
    result = service.navigate('synthetic concern','en',[])
    assert result['sources'] == []
    assert result['doctors'] == [{'id':'database-record'}]
    assert doctors.call_args.args[0] is None


def test_rag_failure_is_categorized_and_logs_no_content(monkeypatch,caplog):
    database_stub(monkeypatch, [{'id':'active-document'}])
    monkeypatch.setattr(service,'search_knowledge',Mock(side_effect=RuntimeError('private-medical-text secret-key')))
    with pytest.raises(HTTPException) as caught:
        service.navigate('private-medical-text','en',[])
    assert caught.value.detail['code'] == 'RAG_UNAVAILABLE'
    assert 'stage=retrieval' in caplog.text
    assert 'private-medical-text' not in caplog.text
    assert 'secret-key' not in caplog.text


def test_ai_failure_preserves_saved_conversation_context(monkeypatch):
    db = database_stub(monkeypatch)
    db.insert.return_value = db
    monkeypatch.setattr(service,'navigate',Mock(side_effect=HTTPException(503,
        {'code':'AI_UNAVAILABLE','message':'busy'})))
    with pytest.raises(HTTPException) as caught:
        service.chat({'id':'patient-id'},'synthetic concern','en')
    assert caught.value.detail['message_saved'] is True
    assert caught.value.detail['conversation_id']
    assert caught.value.detail['code'] == 'AI_UNAVAILABLE'


def test_cors_allows_only_configured_frontend():
    with TestClient(app) as client:
        for origin, expected in [(settings().app_origin,200),('https://untrusted.invalid',400)]:
            response = client.options('/sal/chat',headers={'Origin':origin,
                'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'content-type'})
            assert response.status_code == expected
        assert client.post('/sal/chat',headers={'Origin':'https://untrusted.invalid'},json={'message':'test'}).status_code == 403
