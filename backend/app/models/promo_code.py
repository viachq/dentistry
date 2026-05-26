from datetime import date
from enum import StrEnum
from sqlalchemy import Boolean, Date, Enum, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base
from app.models.base_mixins import TimestampMixin


class PromoCodeType(StrEnum):
    PERCENT = "percent"
    FIXED = "fixed"


class PromoCode(TimestampMixin, Base):
    __tablename__ = "promocode"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(40), unique=True, index=True)
    discount_type: Mapped[PromoCodeType] = mapped_column(
        Enum(PromoCodeType, values_callable=lambda enum_cls: [item.value for item in enum_cls])
    )
    discount_value: Mapped[float] = mapped_column(Float)
    expires_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    usage_limit: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
