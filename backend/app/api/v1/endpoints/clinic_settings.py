from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps.auth import require_role
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.clinic_settings import ClinicSettingsRead, ClinicSettingsUpdate
from app.services import clinic_settings as settings_service

router = APIRouter()


@router.get("", response_model=ClinicSettingsRead)
def get_clinic_settings(db: Session = Depends(get_db)) -> ClinicSettingsRead:
    return settings_service.get_clinic_settings(db)


@router.put("", response_model=ClinicSettingsRead)
def update_clinic_settings(
    payload: ClinicSettingsUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN)),
) -> ClinicSettingsRead:
    return settings_service.update_clinic_settings(db, payload)
