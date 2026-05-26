from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.appointment import Appointment
from app.models.promo_code import PromoCode
from app.models.service import Service, DoctorService
from app.schemas.promo_code import PromoCodeCreate, PromoCodeUpdate, PromoCodeRead, PromoCodeValidationRead
from datetime import date as date_cls


def _build_promo_read(promo: PromoCode, db: Session) -> PromoCodeRead:
    used_count = db.query(Appointment).filter(Appointment.promo_code_id == promo.id).count()
    return PromoCodeRead(
        id=promo.id,
        code=promo.code,
        discount_type=promo.discount_type,
        discount_value=promo.discount_value,
        expires_at=promo.expires_at,
        usage_limit=promo.usage_limit,
        is_active=promo.is_active,
        used_count=used_count,
    )


def get_all_promo_codes(db: Session) -> list[PromoCodeRead]:
    promos = db.query(PromoCode).all()
    return [_build_promo_read(p, db) for p in promos]


def create_promo_code(db: Session, payload: PromoCodeCreate) -> PromoCodeRead:
    existing = db.query(PromoCode).filter(PromoCode.code == payload.code).first()
    if existing:
        raise HTTPException(status_code=409, detail="Промокод вже існує")
    promo = PromoCode(
        code=payload.code,
        discount_type=payload.discount_type,
        discount_value=payload.discount_value,
        expires_at=payload.expires_at,
        usage_limit=payload.usage_limit,
        is_active=payload.is_active,
    )
    db.add(promo)
    db.commit()
    db.refresh(promo)
    return _build_promo_read(promo, db)


def update_promo_code(db: Session, promo_id: int, payload: PromoCodeUpdate) -> PromoCodeRead:
    promo = db.query(PromoCode).filter(PromoCode.id == promo_id).first()
    if not promo:
        raise HTTPException(status_code=404, detail="Промокод не знайдено")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(promo, field, value)
    db.commit()
    db.refresh(promo)
    return _build_promo_read(promo, db)


def delete_promo_code(db: Session, promo_id: int) -> None:
    promo = db.query(PromoCode).filter(PromoCode.id == promo_id).first()
    if not promo:
        raise HTTPException(status_code=404, detail="Промокод не знайдено")
    db.delete(promo)
    db.commit()


def validate_promo_code(
    db: Session, code: str, doctor_id: int, service_id: int
) -> PromoCodeValidationRead:
    promo = db.query(PromoCode).filter(
        PromoCode.code == code,
        PromoCode.is_active == True,
    ).first()
    if not promo:
        return PromoCodeValidationRead(valid=False, code=code, message="Промокод не знайдено")
    if promo.expires_at and promo.expires_at < date_cls.today():
        return PromoCodeValidationRead(valid=False, code=code, message="Промокод прострочений")
    if promo.usage_limit:
        used = db.query(Appointment).filter(Appointment.promo_code_id == promo.id).count()
        if used >= promo.usage_limit:
            return PromoCodeValidationRead(valid=False, code=code, message="Ліміт промокоду вичерпано")

    # Get price
    ds = db.query(DoctorService).filter(
        DoctorService.doctor_id == doctor_id,
        DoctorService.service_id == service_id,
    ).first()
    if ds and ds.custom_price:
        price = ds.custom_price
    else:
        svc = db.query(Service).filter(Service.id == service_id).first()
        price = svc.price if svc else 0.0

    if promo.discount_type == "percent":
        discount_amount = round(price * promo.discount_value / 100, 2)
    else:
        discount_amount = min(promo.discount_value, price)

    final_amount = max(0, price - discount_amount)
    return PromoCodeValidationRead(
        valid=True,
        code=code,
        discount_type=promo.discount_type,
        discount_value=promo.discount_value,
        discount_amount=discount_amount,
        final_amount=final_amount,
    )
