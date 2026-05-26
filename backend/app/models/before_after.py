from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.base_mixins import TimestampMixin


class BeforeAfterCase(TimestampMixin, Base):
    __tablename__ = "before_after_case"

    id: Mapped[int] = mapped_column(primary_key=True)
    doctor_id: Mapped[int] = mapped_column(
        ForeignKey("doctorprofile.id", ondelete="CASCADE")
    )
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    before_image_url: Mapped[str] = mapped_column(String(500))
    after_image_url: Mapped[str] = mapped_column(String(500))
    is_published: Mapped[bool] = mapped_column(default=True)
