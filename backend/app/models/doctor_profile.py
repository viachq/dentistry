from datetime import date
from sqlalchemy import Date, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from app.models.base_mixins import TimestampMixin


class DoctorProfile(TimestampMixin, Base):
    __tablename__ = "doctorprofile"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id"), unique=True)
    birth_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    title: Mapped[str] = mapped_column(String(80), default="Dentist")
    rating: Mapped[float] = mapped_column(Float, default=0)
    photo_path: Mapped[str | None] = mapped_column(String(255), nullable=True)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    education: Mapped[str | None] = mapped_column(Text, nullable=True)
    achievements: Mapped[str | None] = mapped_column(Text, nullable=True)
    experience_years: Mapped[int | None] = mapped_column(Integer, nullable=True)
    commission_percent: Mapped[float | None] = mapped_column(Float, nullable=True)
    fixed_payout: Mapped[float | None] = mapped_column(Float, nullable=True)

    user = relationship("User", back_populates="doctor_profile")
    services = relationship("DoctorService", back_populates="doctor", cascade="all, delete-orphan")
    schedules = relationship("WorkSchedule", back_populates="doctor", cascade="all, delete-orphan")
    schedule_exceptions = relationship("ScheduleException", back_populates="doctor", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="doctor")
