from datetime import date
from enum import StrEnum
from sqlalchemy import Boolean, Date, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from app.models.base_mixins import TimestampMixin


class BloodType(StrEnum):
    O_POS = "O+"
    O_NEG = "O-"
    A_POS = "A+"
    A_NEG = "A-"
    B_POS = "B+"
    B_NEG = "B-"
    AB_POS = "AB+"
    AB_NEG = "AB-"


class PatientCard(TimestampMixin, Base):
    __tablename__ = "patientcard"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("user.id"), unique=True)
    birth_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    blood_type: Mapped[str | None] = mapped_column(String(5), nullable=True)
    allergies: Mapped[str | None] = mapped_column(Text, nullable=True)
    chronic_conditions: Mapped[str | None] = mapped_column(Text, nullable=True)
    general_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    patient = relationship("User")
    dental_visits = relationship("DentalVisit", back_populates="patient_card", cascade="all, delete-orphan")


class DentalVisit(TimestampMixin, Base):
    __tablename__ = "dentalvisit"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_card_id: Mapped[int] = mapped_column(ForeignKey("patientcard.id"))
    appointment_id: Mapped[int | None] = mapped_column(ForeignKey("appointment.id"), unique=True, nullable=True)
    diagnosis: Mapped[str | None] = mapped_column(Text, nullable=True)
    treatment_performed: Mapped[str | None] = mapped_column(Text, nullable=True)
    prescriptions: Mapped[str | None] = mapped_column(Text, nullable=True)
    next_visit_recommendation: Mapped[str | None] = mapped_column(Text, nullable=True)
    doctor_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    patient_card = relationship("PatientCard", back_populates="dental_visits")
    appointment = relationship("Appointment", back_populates="dental_visit")
