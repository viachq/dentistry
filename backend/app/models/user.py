from enum import StrEnum
from sqlalchemy import Boolean, Enum, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from app.models.base_mixins import TimestampMixin


class UserRole(StrEnum):
    PATIENT = "patient"
    DOCTOR = "doctor"
    ADMIN = "admin"


class User(TimestampMixin, Base):
    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[str] = mapped_column(String(120))
    phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, values_callable=lambda enum_cls: [item.value for item in enum_cls]),
        index=True,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    doctor_profile = relationship("DoctorProfile", back_populates="user", uselist=False)
    patient_appointments = relationship("Appointment", foreign_keys="Appointment.patient_id")
