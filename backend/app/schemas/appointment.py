from datetime import date, datetime, time, timedelta
from pydantic import BaseModel, ConfigDict, Field, computed_field
from app.models.appointment import AppointmentStatus
from app.models.payment import PaymentMethod, PaymentStatus


class AppointmentCreate(BaseModel):
    doctor_id: int
    service_id: int
    starts_at: datetime
    notes: str | None = Field(default=None, max_length=255)
    promo_code: str | None = Field(default=None, max_length=40)
    payment_method: PaymentMethod = PaymentMethod.OFFLINE
    patient_id: int | None = None


class AppointmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    patient_id: int
    doctor_id: int
    service_id: int
    starts_at: datetime
    ends_at: datetime
    status: AppointmentStatus
    notes: str | None
    promo_code: str | None
    discount_amount: float
    final_amount: float
    payment_id: int | None
    payment_method: PaymentMethod | None
    payment_status: PaymentStatus | None
    patient_name: str
    doctor_name: str
    service_name: str


class AvailableSlot(BaseModel):
    starts_at: datetime
    ends_at: datetime


class AvailableSlotsResponse(BaseModel):
    doctor_id: int
    service_id: int
    date: date
    slots: list[AvailableSlot]


class AppointmentStatusUpdate(BaseModel):
    status: AppointmentStatus


class AppointmentPatientReschedule(BaseModel):
    starts_at: datetime
