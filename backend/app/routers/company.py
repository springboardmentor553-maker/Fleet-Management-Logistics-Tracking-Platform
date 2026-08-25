from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app import schemas
from app.utils.dependencies import require_role
import shutil, uuid, os

router = APIRouter(prefix="/company", tags=["Company"])


def get_or_create_settings(db: Session):
    settings_row = db.query(models.CompanySettings).first()
    if not settings_row:
        settings_row = models.CompanySettings(company_name="FleetFlow")
        db.add(settings_row)
        db.commit()
        db.refresh(settings_row)
    return settings_row


@router.get("/", response_model=schemas.CompanySettingsResponse)
def get_company_settings(db: Session = Depends(get_db)):
    return get_or_create_settings(db)


@router.put("/", response_model=schemas.CompanySettingsResponse)
def update_company_settings(payload: schemas.CompanySettingsUpdate, db: Session = Depends(get_db), current_user=Depends(require_role("admin"))):
    settings_row = get_or_create_settings(db)
    settings_row.company_name = payload.company_name
    db.commit()
    db.refresh(settings_row)
    return settings_row


@router.post("/logo", response_model=schemas.CompanySettingsResponse)
def upload_company_logo(file: UploadFile = File(...), db: Session = Depends(get_db), current_user=Depends(require_role("admin"))):
    allowed_types = ["image/jpeg", "image/png", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only JPG, PNG, or WEBP images allowed")

    os.makedirs("uploads/company", exist_ok=True)
    ext = file.filename.split(".")[-1]
    filename = f"logo_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = f"uploads/company/{filename}"

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    settings_row = get_or_create_settings(db)
    settings_row.logo_url = f"/uploads/company/{filename}"
    db.commit()
    db.refresh(settings_row)
    return settings_row