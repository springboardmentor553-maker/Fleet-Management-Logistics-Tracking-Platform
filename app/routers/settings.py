from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.utils.dependencies import get_db

from app.schemas.settings import (
    SettingsResponse,
    SettingsUpdate,
)

from app.services.settings_service import (
    get_settings,
    update_settings,
)

router = APIRouter(

    prefix="/settings",

    tags=["Settings"]

)


@router.get(

    "/",

    response_model=SettingsResponse

)

def fetch_settings(

    db: Session = Depends(get_db)

):

    return get_settings(db)


@router.put(

    "/",

    response_model=SettingsResponse

)

def save_settings(

    data: SettingsUpdate,

    db: Session = Depends(get_db)

):

    return update_settings(

        data,

        db,

    )