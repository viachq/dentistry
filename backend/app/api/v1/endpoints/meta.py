from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.appointment import AppointmentStatus
from app.models.payment import PaymentMethod, PaymentStatus

router = APIRouter()


@router.get("/appointment-statuses")
def get_appointment_statuses() -> list[str]:
    return [s.value for s in AppointmentStatus]


@router.get("/payment-methods")
def get_payment_methods() -> list[str]:
    return [m.value for m in PaymentMethod]


@router.get("/payment-statuses")
def get_payment_statuses() -> list[str]:
    return [s.value for s in PaymentStatus]
