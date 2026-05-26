from enum import StrEnum
from sqlalchemy import Boolean, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from app.models.base_mixins import TimestampMixin


class NotificationType(StrEnum):
    NEW_APPOINTMENT = "new_appointment"
    APPOINTMENT_CONFIRMED = "appointment_confirmed"
    APPOINTMENT_COMPLETED = "appointment_completed"
    APPOINTMENT_CANCELLED = "appointment_cancelled"
    APPOINTMENT_NO_SHOW = "appointment_no_show"


class Notification(TimestampMixin, Base):
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id"), index=True)
    type: Mapped[NotificationType] = mapped_column(
        Enum(NotificationType, values_callable=lambda enum_cls: [item.value for item in enum_cls])
    )
    title: Mapped[str] = mapped_column(String(200))
    message: Mapped[str] = mapped_column(Text)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    link: Mapped[str | None] = mapped_column(String(255), nullable=True)

    user = relationship("User")
