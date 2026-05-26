from datetime import datetime
from enum import StrEnum
from sqlalchemy import DateTime, Enum, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from app.models.base_mixins import TimestampMixin


class AppointmentStatus(StrEnum):
    NEW = "new"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"


class Appointment(TimestampMixin, Base):
    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("user.id"))
    doctor_id: Mapped[int] = mapped_column(ForeignKey("doctorprofile.id"))
    service_id: Mapped[int] = mapped_column(ForeignKey("service.id"))
    promo_code_id: Mapped[int | None] = mapped_column(ForeignKey("promocode.id"), nullable=True)
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    ends_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    discount_amount: Mapped[float] = mapped_column(Float, default=0)
    status: Mapped[AppointmentStatus] = mapped_column(
        Enum(AppointmentStatus, values_callable=lambda enum_cls: [item.value for item in enum_cls]),
        default=AppointmentStatus.NEW,
    )
    notes: Mapped[str | None] = mapped_column(String(255), nullable=True)

    patient = relationship("User", foreign_keys=[patient_id], back_populates="patient_appointments")
    doctor = relationship("DoctorProfile", back_populates="appointments")
    service = relationship("Service", back_populates="appointments")
    promo_code = relationship("PromoCode")
    payment = relationship("Payment", back_populates="appointment", uselist=False)
    review = relationship("Review", back_populates="appointment", uselist=False)
    dental_visit = relationship("DentalVisit", back_populates="appointment", uselist=False)
