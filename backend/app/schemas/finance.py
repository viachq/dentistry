from pydantic import BaseModel


class AdminFinanceSummary(BaseModel):
    total_revenue: float
    total_expenses: float
    net_profit: float
    total_paid_appointments: int
    total_completed_appointments: int
    outstanding_payments: float
    doctor_payouts: float


class DoctorFinanceSummary(BaseModel):
    doctor_id: int
    doctor_name: str
    completed_appointments: int
    paid_appointments: int
    gross_revenue: float
    payout_amount: float
