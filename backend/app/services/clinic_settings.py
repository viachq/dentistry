from sqlalchemy.orm import Session
from app.models.clinic_settings import ClinicSettings
from app.schemas.clinic_settings import ClinicSettingsRead, ClinicSettingsUpdate


def get_clinic_settings(db: Session) -> ClinicSettingsRead:
    settings = db.query(ClinicSettings).first()
    if not settings:
        settings = ClinicSettings(brand_name="DentaCare")
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return ClinicSettingsRead.model_validate(settings)


def update_clinic_settings(db: Session, payload: ClinicSettingsUpdate) -> ClinicSettingsRead:
    settings = db.query(ClinicSettings).first()
    if not settings:
        settings = ClinicSettings()
        db.add(settings)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(settings, field, value)

    db.commit()
    db.refresh(settings)
    return ClinicSettingsRead.model_validate(settings)
