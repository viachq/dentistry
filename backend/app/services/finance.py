from datetime import date
from sqlalchemy.orm import Session
from app.models.appointment import Appointment, AppointmentStatus
from app.models.doctor_profile import DoctorProfile
from app.models.expense import Expense
from app.models.payment import Payment, PaymentStatus
from app.models.user import User
from app.schemas.expense import ExpenseCreate, ExpenseRead
from app.schemas.finance import AdminFinanceSummary, DoctorFinanceSummary


def get_admin_finance_summary(
    db: Session,
    date_from: date | None = None,
    date_to: date | None = None,
) -> AdminFinanceSummary:
    payment_query = db.query(Payment).join(Appointment)
    expense_query = db.query(Expense)

    if date_from:
        payment_query = payment_query.filter(Appointment.starts_at >= date_from)
        expense_query = expense_query.filter(Expense.expense_date >= date_from)
    if date_to:
        payment_query = payment_query.filter(Appointment.starts_at <= date_to)
        expense_query = expense_query.filter(Expense.expense_date <= date_to)

    paid_payments = payment_query.filter(Payment.status == PaymentStatus.PAID).all()
    total_revenue = sum(p.amount for p in paid_payments)
    total_paid_appointments = len(paid_payments)

    completed_appts = (
        db.query(Appointment)
        .filter(Appointment.status == AppointmentStatus.COMPLETED)
    )
    if date_from:
        completed_appts = completed_appts.filter(Appointment.starts_at >= date_from)
    if date_to:
        completed_appts = completed_appts.filter(Appointment.starts_at <= date_to)
    total_completed_appointments = completed_appts.count()

    pending_payments = payment_query.filter(Payment.status == PaymentStatus.PENDING).all()
    outstanding_payments = sum(p.amount for p in pending_payments)

    expenses = expense_query.all()
    total_expenses = sum(e.amount for e in expenses)

    # Doctor payouts
    doctor_payouts = _calculate_all_doctor_payouts(db, date_from, date_to)
    net_profit = total_revenue - total_expenses - doctor_payouts

    return AdminFinanceSummary(
        total_revenue=round(total_revenue, 2),
        total_expenses=round(total_expenses, 2),
        net_profit=round(net_profit, 2),
        total_paid_appointments=total_paid_appointments,
        total_completed_appointments=total_completed_appointments,
        outstanding_payments=round(outstanding_payments, 2),
        doctor_payouts=round(doctor_payouts, 2),
    )


def _calculate_all_doctor_payouts(
    db: Session,
    date_from: date | None,
    date_to: date | None,
) -> float:
    profiles = db.query(DoctorProfile).all()
    total = 0.0
    for profile in profiles:
        summary = _get_doctor_finance(db, profile, date_from, date_to)
        total += summary.payout_amount
    return total


def get_all_doctor_finance(
    db: Session,
    date_from: date | None = None,
    date_to: date | None = None,
) -> list[DoctorFinanceSummary]:
    profiles = db.query(DoctorProfile).all()
    return [_get_doctor_finance(db, p, date_from, date_to) for p in profiles]


def _get_doctor_finance(
    db: Session,
    profile: DoctorProfile,
    date_from: date | None,
    date_to: date | None,
) -> DoctorFinanceSummary:
    appt_query = db.query(Appointment).filter(Appointment.doctor_id == profile.id)
    if date_from:
        appt_query = appt_query.filter(Appointment.starts_at >= date_from)
    if date_to:
        appt_query = appt_query.filter(Appointment.starts_at <= date_to)

    completed = appt_query.filter(Appointment.status == AppointmentStatus.COMPLETED).all()
    paid_ids = [
        a.id for a in completed
        if a.payment and a.payment.status == PaymentStatus.PAID
    ]
    gross_revenue = sum(
        a.payment.amount for a in completed
        if a.payment and a.payment.status == PaymentStatus.PAID
    )

    # Calculate payout
    if profile.fixed_payout is not None:
        payout_amount = profile.fixed_payout * len(paid_ids)
    elif profile.commission_percent is not None:
        payout_amount = gross_revenue * profile.commission_percent / 100
    else:
        payout_amount = 0.0

    return DoctorFinanceSummary(
        doctor_id=profile.id,
        doctor_name=profile.user.full_name,
        completed_appointments=len(completed),
        paid_appointments=len(paid_ids),
        gross_revenue=round(gross_revenue, 2),
        payout_amount=round(payout_amount, 2),
    )


def get_doctor_own_finance(db: Session, current_user: User) -> DoctorFinanceSummary:
    profile = db.query(DoctorProfile).filter(DoctorProfile.user_id == current_user.id).first()
    if not profile:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Профіль лікаря не знайдено")
    return _get_doctor_finance(db, profile, None, None)


# Expenses CRUD
def create_expense(db: Session, payload: ExpenseCreate) -> ExpenseRead:
    expense = Expense(
        category=payload.category,
        amount=payload.amount,
        expense_date=payload.expense_date,
        description=payload.description,
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return ExpenseRead.model_validate(expense)


def get_expenses(
    db: Session,
    date_from: date | None = None,
    date_to: date | None = None,
) -> list[ExpenseRead]:
    query = db.query(Expense)
    if date_from:
        query = query.filter(Expense.expense_date >= date_from)
    if date_to:
        query = query.filter(Expense.expense_date <= date_to)
    expenses = query.order_by(Expense.expense_date.desc()).all()
    return [ExpenseRead.model_validate(e) for e in expenses]


def delete_expense(db: Session, expense_id: int) -> None:
    from fastapi import HTTPException
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Витрату не знайдено")
    db.delete(expense)
    db.commit()
