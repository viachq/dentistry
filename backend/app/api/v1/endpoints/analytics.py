import calendar
from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps.auth import require_role
from app.db.session import get_db
from app.models.appointment import Appointment, AppointmentStatus
from app.models.expense import Expense
from app.models.payment import Payment, PaymentStatus
from app.models.user import User, UserRole

router = APIRouter()


def _month_boundaries(year: int, month: int) -> tuple[date, date]:
    """Return (first_day, last_day) for the given year/month."""
    last_day = calendar.monthrange(year, month)[1]
    return date(year, month, 1), date(year, month, last_day)


def _subtract_months(d: date, months: int) -> date:
    """Return a date that is `months` months before `d`, anchored to the 1st."""
    total_months = d.year * 12 + (d.month - 1) - months
    year = total_months // 12
    month = total_months % 12 + 1
    return date(year, month, 1)


@router.get("/monthly")
def get_monthly_analytics(
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN)),
) -> list[dict]:
    """Return revenue, expenses, and appointment count for the last 12 months."""
    today = date.today()
    results = []

    for i in range(11, -1, -1):
        anchor = _subtract_months(today, i)
        first_day, last_day = _month_boundaries(anchor.year, anchor.month)
        month_label = first_day.strftime("%Y-%m")

        # Revenue: sum of paid payments whose appointment starts within the month.
        # We join Payment → Appointment to filter by starts_at date.
        first_dt = datetime(first_day.year, first_day.month, first_day.day, tzinfo=timezone.utc)
        last_dt = datetime(last_day.year, last_day.month, last_day.day, 23, 59, 59, tzinfo=timezone.utc)

        revenue_row = (
            db.query(func.coalesce(func.sum(Payment.amount), 0.0))
            .join(Appointment, Appointment.id == Payment.appointment_id)
            .filter(
                Payment.status == PaymentStatus.PAID,
                Appointment.starts_at >= first_dt,
                Appointment.starts_at <= last_dt,
            )
            .scalar()
        )

        # Expenses: sum of expenses whose expense_date is within the month.
        expenses_row = (
            db.query(func.coalesce(func.sum(Expense.amount), 0.0))
            .filter(
                Expense.expense_date >= first_day,
                Expense.expense_date <= last_day,
            )
            .scalar()
        )

        # Appointment count (all non-cancelled statuses).
        appt_count = (
            db.query(func.count(Appointment.id))
            .filter(
                Appointment.starts_at >= first_dt,
                Appointment.starts_at <= last_dt,
                Appointment.status != AppointmentStatus.CANCELLED,
            )
            .scalar()
        )

        results.append(
            {
                "month": month_label,
                "revenue": float(revenue_row or 0.0),
                "expenses": float(expenses_row or 0.0),
                "appointments": int(appt_count or 0),
            }
        )

    return results
