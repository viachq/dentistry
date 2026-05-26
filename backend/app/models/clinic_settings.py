from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base
from app.models.base_mixins import TimestampMixin


class ClinicSettings(TimestampMixin, Base):
    __tablename__ = "clinicsettings"

    id: Mapped[int] = mapped_column(primary_key=True)
    brand_name: Mapped[str] = mapped_column(String(120), default="DentaCare")
    tagline: Mapped[str | None] = mapped_column(String(255), nullable=True)
    address: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    instagram_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    telegram_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    facebook_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    youtube_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    tiktok_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    working_hours_note: Mapped[str | None] = mapped_column(String(255), nullable=True)
    about_text: Mapped[str | None] = mapped_column(Text, nullable=True)
