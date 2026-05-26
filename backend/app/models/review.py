from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from app.models.base_mixins import TimestampMixin


class Review(TimestampMixin, Base):
    id: Mapped[int] = mapped_column(primary_key=True)
    appointment_id: Mapped[int] = mapped_column(ForeignKey("appointment.id"), unique=True)
    doctor_id: Mapped[int] = mapped_column(ForeignKey("doctorprofile.id"))
    patient_id: Mapped[int] = mapped_column(ForeignKey("user.id"))
    rating: Mapped[int] = mapped_column(Integer)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    moderation_status: Mapped[str] = mapped_column(String(30), default="pending")

    appointment = relationship("Appointment", back_populates="review")
    doctor = relationship("DoctorProfile")
    patient = relationship("User")
