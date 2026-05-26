from fastapi import APIRouter, Depends, File, UploadFile, status
from sqlalchemy.orm import Session
from app.api.deps.auth import get_current_user, get_optional_user, require_role
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.doctor import (
    DoctorCreate, DoctorUpdate, DoctorRead,
    DoctorScheduleExceptionCreate, DoctorScheduleExceptionRead,
)
from app.services import doctors as doctor_service

router = APIRouter()


@router.get("", response_model=list[DoctorRead])
def list_doctors(
    include_inactive: bool = False,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
) -> list[DoctorRead]:
    if include_inactive and (not current_user or current_user.role != UserRole.ADMIN):
        include_inactive = False
    return doctor_service.get_all_doctors(db, include_inactive=include_inactive)


@router.get("/{doctor_id}", response_model=DoctorRead)
def get_doctor(doctor_id: int, db: Session = Depends(get_db)) -> DoctorRead:
    return doctor_service.get_doctor_by_id(db, doctor_id)


@router.post("", response_model=DoctorRead, status_code=status.HTTP_201_CREATED)
def create_doctor(
    payload: DoctorCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN)),
) -> DoctorRead:
    return doctor_service.create_doctor(db, payload)


@router.patch("/{doctor_id}", response_model=DoctorRead)
def update_doctor(
    doctor_id: int,
    payload: DoctorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DoctorRead:
    # Admin or doctor themselves
    if current_user.role == UserRole.DOCTOR:
        profile = current_user.doctor_profile
        if not profile or profile.id != doctor_id:
            from fastapi import HTTPException
            raise HTTPException(status_code=403, detail="Доступ заборонено")
    elif current_user.role != UserRole.ADMIN:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Доступ заборонено")
    return doctor_service.update_doctor(db, doctor_id, payload)


@router.post("/{doctor_id}/photo", response_model=DoctorRead)
def upload_photo(
    doctor_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN, UserRole.DOCTOR)),
) -> DoctorRead:
    return doctor_service.upload_doctor_photo(db, doctor_id, file)


@router.post("/{doctor_id}/schedule-exceptions", response_model=DoctorScheduleExceptionRead)
def add_schedule_exception(
    doctor_id: int,
    payload: DoctorScheduleExceptionCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN, UserRole.DOCTOR)),
) -> DoctorScheduleExceptionRead:
    exc = doctor_service.add_schedule_exception(db, doctor_id, payload)
    return DoctorScheduleExceptionRead.model_validate(exc)


@router.delete("/{doctor_id}/schedule-exceptions/{exception_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_schedule_exception(
    doctor_id: int,
    exception_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN, UserRole.DOCTOR)),
) -> None:
    doctor_service.delete_schedule_exception(db, doctor_id, exception_id)
