from fastapi import APIRouter

from app.services.service import list_active


router = APIRouter(
    prefix="/specialties",
    tags=["Specialties"]
)


@router.get("")
def get_specialties():

    return list_active('specialties')
