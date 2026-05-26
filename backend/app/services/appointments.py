from datetime import date, datetime, timedelta, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.appointment import Appointment, AppointmentStatus
from app.models.doctor_profile import DoctorProfile
from app.models.payment import Payment, PaymentMethod, PaymentStatus
from app.models.promo_code import PromoCode, PromoCodeType
from app.models.schedule import WorkSchedule
from app.models.schedule_exception import ScheduleException
from app.models.service import Service, DoctorService
from app.models.user import User, UserRole
from app.schemas.appointment import (
    AppointmentCreate, AppointmentRead, AvailableSlot, AvailableSlotsResponse,
    AppointmentStatusUpdate, AppointmentPatientReschedule,
)


def _build_appointment_read(appt: Appointment) -> AppointmentRead:
    payment = appt.payment
    promo_code_str = appt.promo_code.code if appt.promo_code else None
    service_price = appt.service.price if appt.service else 0
    # Check for doctor custom price
    if appt.doctor and appt.service:
        ds = next(
            (ds for ds in appt.doctor.services if ds.service_id == appt.service_id),
            None
        )
        if ds and ds.custom_price:
            service_price = ds.custom_price
    final_amount = service_price - appt.discount_amount

    return AppointmentRead(
        id=appt.id,
        patient_id=appt.patient_id,
        doctor_id=appt.doctor_id,
        service_id=appt.service_id,
        starts_at=appt.starts_at,
        ends_at=appt.ends_at,
        status=appt.status,
        notes=appt.notes,
        promo_code=promo_code_str,
        discount_amount=appt.discount_amount,
        final_amount=max(0, final_amount),
        payment_id=payment.id if payment else None,
        payment_method=payment.method if payment else None,
        payment_status=payment.status if payment else None,
        patient_name=appt.patient.full_name,
        doctor_name=appt.doctor.user.full_name,
        service_name=appt.service.name,
    )


def _get_service_price(db: Session, doctor_id: int, service_id: int) -> float:
    ds = db.query(DoctorService).filter(
        DoctorService.doctor_id == doctor_id,
        DoctorService.service_id == service_id,
    ).first()
    if ds and ds.custom_price:
        return ds.custom_price
    svc = db.query(Service).filter(Service.id == service_id).first()
    return svc.price if svc else 0.0


def get_available_slots(
    db: Session, doctor_id: int, service_id: int, target_date: date
) -> AvailableSlotsResponse:
    profile = db.query(DoctorProfile).filter(DoctorProfile.id == doctor_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Лікаря не знайдено")

    service = db.query(Service).filter(Service.id == service_id, Service.is_active == True).first()
    if not service:
        raise HTTPException(status_code=404, detail="Послугу не знайдено")

    weekday = target_date.weekday()

    # Check for schedule exception
    exc = db.query(ScheduleException).filter(
        ScheduleException.doctor_id == doctor_id,
        ScheduleException.exception_date == target_date,
    ).first()

    if exc and exc.is_day_off:
        return AvailableSlotsResponse(doctor_id=doctor_id, service_id=service_id, date=target_date, slots=[])

    if exc and exc.start_time and exc.end_time:
        work_start = datetime.combine(target_date, exc.start_time, tzinfo=timezone.utc)
        work_end = datetime.combine(target_date, exc.end_time, tzinfo=timezone.utc)
        break_start = None
        break_end = None
    else:
        schedule = db.query(WorkSchedule).filter(
            WorkSchedule.doctor_id == doctor_id,
            WorkSchedule.weekday == weekday,
        ).first()
        if not schedule:
            return AvailableSlotsResponse(doctor_id=doctor_id, service_id=service_id, date=target_date, slots=[])
        work_start = datetime.combine(target_date, schedule.start_time, tzinfo=timezone.utc)
        work_end = datetime.combine(target_date, schedule.end_time, tzinfo=timezone.utc)
        break_start = datetime.combine(target_date, schedule.break_start, tzinfo=timezone.utc) if schedule.break_start else None
        break_end = datetime.combine(target_date, schedule.break_end, tzinfo=timezone.utc) if schedule.break_end else None

    duration = timedelta(minutes=service.duration_minutes)

    # Get existing appointments for that day
    day_start = datetime.combine(target_date, datetime.min.time(), tzinfo=timezone.utc)
    day_end = day_start + timedelta(days=1)
    existing = db.query(Appointment).filter(
        Appointment.doctor_id == doctor_id,
        Appointment.starts_at >= day_start,
        Appointment.starts_at < day_end,
        Appointment.status.notin_([AppointmentStatus.CANCELLED]),
    ).all()
    booked_ranges = [(a.starts_at, a.ends_at) for a in existing]

    slots: list[AvailableSlot] = []
    slot_start = work_start
    while slot_start + duration <= work_end:
        slot_end = slot_start + duration

        # Skip break
        if break_start and break_end:
            if slot_start < break_end and slot_end > break_start:
                slot_start = break_end
                continue

        # Check overlap with booked
        overlap = any(
            slot_start < b_end and slot_end > b_start
            for b_start, b_end in booked_ranges
        )
        if not overlap:
            slots.append(AvailableSlot(starts_at=slot_start, ends_at=slot_end))

        slot_start += timedelta(minutes=15)

    return AvailableSlotsResponse(doctor_id=doctor_id, service_id=service_id, date=target_date, slots=slots)


def create_appointment(db: Session, payload: AppointmentCreate, current_user: User) -> AppointmentRead:
    # Determine patient
    if payload.patient_id and current_user.role in (UserRole.ADMIN, UserRole.DOCTOR):
        patient = db.query(User).filter(User.id == payload.patient_id).first()
        if not patient:
            raise HTTPException(status_code=404, detail="Пацієнта не знайдено")
    else:
        patient = current_user

    profile = db.query(DoctorProfile).filter(DoctorProfile.id == payload.doctor_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Лікаря не знайдено")

    service = db.query(Service).filter(Service.id == payload.service_id, Service.is_active == True).first()
    if not service:
        raise HTTPException(status_code=404, detail="Послугу не знайдено")

    ends_at = payload.starts_at + timedelta(minutes=service.duration_minutes)

    # Check for conflicts
    conflict = db.query(Appointment).filter(
        Appointment.doctor_id == payload.doctor_id,
        Appointment.status.notin_([AppointmentStatus.CANCELLED]),
        Appointment.starts_at < ends_at,
        Appointment.ends_at > payload.starts_at,
    ).first()
    if conflict:
        raise HTTPException(status_code=409, detail="Цей час вже зайнятий")

    # Promo code
    promo = None
    discount_amount = 0.0
    if payload.promo_code:
        promo = db.query(PromoCode).filter(
            PromoCode.code == payload.promo_code,
            PromoCode.is_active == True,
        ).first()
        if not promo:
            raise HTTPException(status_code=400, detail="Промокод не знайдено або неактивний")
        from datetime import date as date_cls
        if promo.expires_at and promo.expires_at < date_cls.today():
            raise HTTPException(status_code=400, detail="Промокод прострочений")
        service_price = _get_service_price(db, payload.doctor_id, payload.service_id)
        if promo.discount_type == PromoCodeType.PERCENT:
            discount_amount = round(service_price * promo.discount_value / 100, 2)
        else:
            discount_amount = min(promo.discount_value, service_price)

    service_price = _get_service_price(db, payload.doctor_id, payload.service_id)
    final_amount = max(0, service_price - discount_amount)

    appt = Appointment(
        patient_id=patient.id,
        doctor_id=payload.doctor_id,
        service_id=payload.service_id,
        promo_code_id=promo.id if promo else None,
        starts_at=payload.starts_at,
        ends_at=ends_at,
        discount_amount=discount_amount,
        status=AppointmentStatus.NEW,
        notes=payload.notes,
    )
    db.add(appt)
    db.flush()

    payment = Payment(
        appointment_id=appt.id,
        amount=final_amount,
        method=payload.payment_method,
        status=PaymentStatus.PENDING,
    )
    db.add(payment)
    db.commit()
    db.refresh(appt)
    return _build_appointment_read(appt)


def get_appointments(
    db: Session,
    current_user: User,
    doctor_id: int | None = None,
    patient_id: int | None = None,
    status_filter: str | None = None,
) -> list[AppointmentRead]:
    query = db.query(Appointment)

    if current_user.role == UserRole.PATIENT:
        query = query.filter(Appointment.patient_id == current_user.id)
    elif current_user.role == UserRole.DOCTOR:
        dp = db.query(DoctorProfile).filter(DoctorProfile.user_id == current_user.id).first()
        if dp:
            query = query.filter(Appointment.doctor_id == dp.id)
        else:
            return []
    else:
        # Admin
        if doctor_id:
            query = query.filter(Appointment.doctor_id == doctor_id)
        if patient_id:
            query = query.filter(Appointment.patient_id == patient_id)

    if status_filter:
        query = query.filter(Appointment.status == status_filter)

    appts = query.order_by(Appointment.starts_at.desc()).all()
    return [_build_appointment_read(a) for a in appts]


def get_appointment_by_id(db: Session, appointment_id: int, current_user: User) -> AppointmentRead:
    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Запис не знайдено")
    if current_user.role == UserRole.PATIENT and appt.patient_id != current_user.id:
        raise HTTPException(status_code=403, detail="Доступ заборонено")
    if current_user.role == UserRole.DOCTOR:
        dp = db.query(DoctorProfile).filter(DoctorProfile.user_id == current_user.id).first()
        if not dp or appt.doctor_id != dp.id:
            raise HTTPException(status_code=403, detail="Доступ заборонено")
    return _build_appointment_read(appt)


def update_appointment_status(
    db: Session, appointment_id: int, payload: AppointmentStatusUpdate, current_user: User
) -> AppointmentRead:
    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Запис не знайдено")

    if current_user.role == UserRole.PATIENT:
        if appt.patient_id != current_user.id:
            raise HTTPException(status_code=403, detail="Доступ заборонено")
        if payload.status != AppointmentStatus.CANCELLED:
            raise HTTPException(status_code=403, detail="Пацієнт може лише скасувати запис")

    appt.status = payload.status

    # Auto-mark payment as paid when completed
    if payload.status == AppointmentStatus.COMPLETED and appt.payment:
        if appt.payment.status == PaymentStatus.PENDING:
            appt.payment.status = PaymentStatus.PAID

    db.commit()
    db.refresh(appt)
    return _build_appointment_read(appt)


def reschedule_appointment(
    db: Session, appointment_id: int, payload: AppointmentPatientReschedule, current_user: User
) -> AppointmentRead:
    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Запис не знайдено")
    if current_user.role == UserRole.PATIENT and appt.patient_id != current_user.id:
        raise HTTPException(status_code=403, detail="Доступ заборонено")

    service = appt.service
    ends_at = payload.starts_at + timedelta(minutes=service.duration_minutes)

    conflict = db.query(Appointment).filter(
        Appointment.doctor_id == appt.doctor_id,
        Appointment.id != appt.id,
        Appointment.status.notin_([AppointmentStatus.CANCELLED]),
        Appointment.starts_at < ends_at,
        Appointment.ends_at > payload.starts_at,
    ).first()
    if conflict:
        raise HTTPException(status_code=409, detail="Цей час вже зайнятий")

    appt.starts_at = payload.starts_at
    appt.ends_at = ends_at
    appt.status = AppointmentStatus.NEW
    db.commit()
    db.refresh(appt)
    return _build_appointment_read(appt)


def get_patient_appointments(db: Session, current_user: User) -> list[AppointmentRead]:
    appts = db.query(Appointment).filter(
        Appointment.patient_id == current_user.id
    ).order_by(Appointment.starts_at.desc()).all()
    return [_build_appointment_read(a) for a in appts]
