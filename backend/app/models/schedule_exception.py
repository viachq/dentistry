from datetime import date, time
from sqlalchemy import Boolean, Date, ForeignKey, String, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from app.models.base_mixins import TimestampMixin


class ScheduleException(TimestampMixin, Base):
    id: Mapped[int] = mapped_column(primary_key=True)
    doctor_id: Mapped[int] = mapped_column(ForeignKey("doctorprofile.id"))
    exception_date: Mapped[date] = mapped_column(Date, index=True)
    is_day_off: Mapped[bool] = mapped_column(Boolean, default=False)
    start_time: Mapped[time | None] = mapped_column(Time, nullable=True)
    end_time: Mapped[time | None] = mapped_column(Time, nullable=True)
    reason: Mapped[str | None] = mapped_column(String(255), nullable=True)

    doctor = relationship("DoctorProfile", back_populates="schedule_exceptions")
