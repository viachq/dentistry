from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.patient_card import PatientCard, DentalVisit
from app.models.user import User, UserRole
from app.schemas.patient_card import PatientCardRead, PatientCardUpdate, DentalVisitCreate, DentalVisitRead


def get_or_create_patient_card(db: Session, patient_id: int) -> PatientCard:
    card = db.query(PatientCard).filter(PatientCard.patient_id == patient_id).first()
    if not card:
        card = PatientCard(patient_id=patient_id)
        db.add(card)
        db.commit()
        db.refresh(card)
    return card


def get_patient_card(db: Session, patient_id: int, current_user: User) -> PatientCardRead:
    if current_user.role == UserRole.PATIENT and current_user.id != patient_id:
        raise HTTPException(status_code=403, detail="Доступ заборонено")
    card = get_or_create_patient_card(db, patient_id)
    return PatientCardRead.model_validate(card)


def update_patient_card(
    db: Session, patient_id: int, payload: PatientCardUpdate, current_user: User
) -> PatientCardRead:
    if current_user.role == UserRole.PATIENT and current_user.id != patient_id:
        raise HTTPException(status_code=403, detail="Доступ заборонено")
    card = get_or_create_patient_card(db, patient_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(card, field, value)
    db.commit()
    db.refresh(card)
    return PatientCardRead.model_validate(card)


def get_dental_visits(db: Session, patient_id: int, current_user: User) -> list[DentalVisitRead]:
    if current_user.role == UserRole.PATIENT and current_user.id != patient_id:
        raise HTTPException(status_code=403, detail="Доступ заборонено")
    card = db.query(PatientCard).filter(PatientCard.patient_id == patient_id).first()
    if not card:
        return []
    visits = (
        db.query(DentalVisit)
        .filter(DentalVisit.patient_card_id == card.id)
        .order_by(DentalVisit.created_at.desc())
        .all()
    )
    return [_build_visit_read(v) for v in visits]


def create_dental_visit(
    db: Session, patient_id: int, payload: DentalVisitCreate, current_user: User
) -> DentalVisitRead:
    if current_user.role == UserRole.PATIENT:
        raise HTTPException(status_code=403, detail="Доступ заборонено")
    card = get_or_create_patient_card(db, patient_id)
    visit = DentalVisit(
        patient_card_id=card.id,
        appointment_id=payload.appointment_id,
        diagnosis=payload.diagnosis,
        treatment_performed=payload.treatment_performed,
        prescriptions=payload.prescriptions,
        next_visit_recommendation=payload.next_visit_recommendation,
        doctor_notes=payload.doctor_notes,
    )
    db.add(visit)
    db.commit()
    db.refresh(visit)
    return _build_visit_read(visit)


def update_dental_visit(
    db: Session, visit_id: int, payload: DentalVisitCreate, current_user: User
) -> DentalVisitRead:
    if current_user.role == UserRole.PATIENT:
        raise HTTPException(status_code=403, detail="Доступ заборонено")
    visit = db.query(DentalVisit).filter(DentalVisit.id == visit_id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Запис не знайдено")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(visit, field, value)
    db.commit()
    db.refresh(visit)
    return _build_visit_read(visit)


def _build_visit_read(visit: DentalVisit) -> DentalVisitRead:
    return DentalVisitRead(
        id=visit.id,
        patient_card_id=visit.patient_card_id,
        appointment_id=visit.appointment_id,
        diagnosis=visit.diagnosis,
        treatment_performed=visit.treatment_performed,
        prescriptions=visit.prescriptions,
        next_visit_recommendation=visit.next_visit_recommendation,
        doctor_notes=visit.doctor_notes,
        created_at=visit.created_at.isoformat() if visit.created_at else "",
    )
