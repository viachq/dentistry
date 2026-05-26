from datetime import date
from sqlalchemy import Date, Float, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base
from app.models.base_mixins import TimestampMixin


class Expense(TimestampMixin, Base):
    id: Mapped[int] = mapped_column(primary_key=True)
    category: Mapped[str] = mapped_column(String(80))
    amount: Mapped[float] = mapped_column(Float)
    expense_date: Mapped[date] = mapped_column(Date)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
