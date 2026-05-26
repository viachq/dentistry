from sqlalchemy import ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from app.models.base_mixins import TimestampMixin


class PatientNote(TimestampMixin, Base):
    __tablename__ = "patientnote"

    id: Mapped[int] = mapped_column(primary_key=True)
    doctor_id: Mapped[int] = mapped_column(ForeignKey("doctorprofile.id"))
    patient_id: Mapped[int] = mapped_column(ForeignKey("user.id"))
    text: Mapped[str] = mapped_column(Text, default="")

    doctor = relationship("DoctorProfile")
    patient = relationship("User")
