from fastapi import HTTPException
from app.database import database, audit


def list_active(table):
    return database().table(table).select('*').eq('active', True).order('name_en').execute().data


def save(table, values, actor, row_id=None):
    query = database().table(table)
    result = (query.update(values).eq('id', row_id) if row_id else query.insert(values)).execute().data
    if not result:
        raise HTTPException(404, 'Record not found')
    audit(actor['id'], 'update' if row_id else 'create', table, result[0]['id'])
    return result[0]
