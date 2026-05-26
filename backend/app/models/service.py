from sqlalchemy import Boolean, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from app.models.base_mixins import TimestampMixin


class Service(TimestampMixin, Base):
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True)
    category: Mapped[str | None] = mapped_column(String(80), nullable=True)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)
    duration_minutes: Mapped[int] = mapped_column(Integer)
    price: Mapped[float] = mapped_column(Float)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    doctors = relationship("DoctorService", back_populates="service", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="service")


class DoctorService(TimestampMixin, Base):
    __tablename__ = "doctorservice"

    id: Mapped[int] = mapped_column(primary_key=True)
    doctor_id: Mapped[int] = mapped_column(ForeignKey("doctorprofile.id"))
    service_id: Mapped[int] = mapped_column(ForeignKey("service.id"))
    custom_price: Mapped[float | None] = mapped_column(Float, nullable=True)

    doctor = relationship("DoctorProfile", back_populates="services")
    service = relationship("Service", back_populates="doctors")
