from enum import StrEnum
from sqlalchemy import Enum, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from app.models.base_mixins import TimestampMixin


class PaymentMethod(StrEnum):
    ONLINE = "online"
    OFFLINE = "offline"


class PaymentStatus(StrEnum):
    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"
    REFUNDED = "refunded"


class Payment(TimestampMixin, Base):
    id: Mapped[int] = mapped_column(primary_key=True)
    appointment_id: Mapped[int] = mapped_column(ForeignKey("appointment.id"), unique=True)
    amount: Mapped[float] = mapped_column(Float)
    method: Mapped[PaymentMethod] = mapped_column(
        Enum(PaymentMethod, values_callable=lambda enum_cls: [item.value for item in enum_cls])
    )
    status: Mapped[PaymentStatus] = mapped_column(
        Enum(PaymentStatus, values_callable=lambda enum_cls: [item.value for item in enum_cls]),
        default=PaymentStatus.PENDING,
    )
    provider_reference: Mapped[str | None] = mapped_column(String(120), nullable=True)

    appointment = relationship("Appointment", back_populates="payment")
