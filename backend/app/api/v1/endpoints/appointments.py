from datetime import date
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.api.deps.auth import get_current_user, require_role
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.appointment import (
    AppointmentCreate, AppointmentRead, AvailableSlotsResponse,
    AppointmentStatusUpdate, AppointmentPatientReschedule,
)
from app.services import appointments as appt_service

router = APIRouter()


@router.get("/available-slots", response_model=AvailableSlotsResponse)
def get_available_slots(
    doctor_id: int,
    service_id: int,
    date: date,
    db: Session = Depends(get_db),
) -> AvailableSlotsResponse:
    return appt_service.get_available_slots(db, doctor_id, service_id, date)


@router.get("", response_model=list[AppointmentRead])
def list_appointments(
    doctor_id: int | None = None,
    patient_id: int | None = None,
    status: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[AppointmentRead]:
    return appt_service.get_appointments(db, current_user, doctor_id, patient_id, status)


@router.get("/patient/me", response_model=list[AppointmentRead])
def get_my_patient_appointments(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.PATIENT)),
) -> list[AppointmentRead]:
    return appt_service.get_patient_appointments(db, current_user)


@router.get("/{appointment_id}", response_model=AppointmentRead)
def get_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AppointmentRead:
    return appt_service.get_appointment_by_id(db, appointment_id, current_user)


@router.post("", response_model=AppointmentRead, status_code=status.HTTP_201_CREATED)
def create_appointment(
    payload: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AppointmentRead:
    return appt_service.create_appointment(db, payload, current_user)


@router.patch("/{appointment_id}/status", response_model=AppointmentRead)
def update_appointment_status(
    appointment_id: int,
    payload: AppointmentStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AppointmentRead:
    return appt_service.update_appointment_status(db, appointment_id, payload, current_user)


@router.patch("/{appointment_id}/reschedule", response_model=AppointmentRead)
def reschedule_appointment(
    appointment_id: int,
    payload: AppointmentPatientReschedule,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AppointmentRead:
    return appt_service.reschedule_appointment(db, appointment_id, payload, current_user)
