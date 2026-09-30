from pathlib import Path
from uuid import uuid4
from typing import Literal
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Query
from app.auth.service import current_user
from app.database import database
from app.knowledge.service import MAX_BYTES, extract_text

router = APIRouter(prefix='/files',tags=['Private files'])
Bucket = Literal['avatars','doctor-documents','patient-files']


def allowed(bucket, user):
    if bucket=='doctor-documents' and user['role'] not in ('doctor','admin','super_admin'):
        raise HTTPException(403,'Doctor account required')
    if bucket=='patient-files' and user['role']!='patient':
        raise HTTPException(403,'Patient account required')


@router.get('/{bucket}')
def listing(bucket: Bucket,user=Depends(current_user)):
    allowed(bucket,user)
    return database().storage.from_(bucket).list(user['id'],{'limit':100,'sortBy':{'column':'created_at','order':'desc'}})


@router.post('/{bucket}',status_code=201)
def upload(bucket: Bucket,file: UploadFile=File(...),user=Depends(current_user)):
    allowed(bucket,user)
    content = file.file.read(MAX_BYTES+1)
    filename = Path(file.filename or '').name
    suffix = Path(filename).suffix.lower()
    if not content or len(content)>MAX_BYTES: raise HTTPException(422,'Maximum file size is 8 MB')
    if bucket=='avatars':
        from PIL import Image
        from io import BytesIO
        try:
            with Image.open(BytesIO(content)) as img:
                if img.format not in ('PNG','JPEG') or img.width*img.height>16000000: raise ValueError()
                img.verify()
        except Exception:
            raise HTTPException(422,'Use a PNG or JPEG image under 16 megapixels') from None
        mime = 'image/png' if content.startswith(b'\x89PNG') else 'image/jpeg'
        suffix = '.png' if mime=='image/png' else '.jpg'
    else:
        extract_text(filename,content)
        mime = {'.pdf':'application/pdf','.docx':'application/vnd.openxmlformats-officedocument.wordprocessingml.document','.txt':'text/plain'}[suffix]
    # Client filenames cannot affect object paths. The authenticated owner is fixed.
    path = f'{user["id"]}/{uuid4()}{suffix}'
    database().storage.from_(bucket).upload(path,content,file_options={'content-type':mime,'upsert':'false'})
    return {'path':path,'filename':filename}


@router.get('/{bucket}/download')
def download(bucket: Bucket,path: str = Query(max_length=250),user=Depends(current_user)):
    allowed(bucket,user)
    if not path.startswith(user['id']+'/') or '..' in path or '\\' in path or path.count('/')!=1:
        raise HTTPException(403,'File is not owned by this account')
    return database().storage.from_(bucket).create_signed_url(path,60)
