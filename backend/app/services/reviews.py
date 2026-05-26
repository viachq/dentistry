from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.appointment import Appointment, AppointmentStatus
from app.models.doctor_profile import DoctorProfile
from app.models.review import Review
from app.models.user import User, UserRole
from app.schemas.review import ReviewCreate, ReviewModerationUpdate, ReviewRead


def _build_review_read(review: Review) -> ReviewRead:
    return ReviewRead(
        id=review.id,
        appointment_id=review.appointment_id,
        doctor_id=review.doctor_id,
        patient_id=review.patient_id,
        rating=review.rating,
        comment=review.comment,
        moderation_status=review.moderation_status,
        patient_name=review.patient.full_name,
        doctor_name=review.appointment.doctor.user.full_name,
        service_name=review.appointment.service.name,
        appointment_starts_at=review.appointment.starts_at,
        created_at=review.created_at,
    )


def create_review(db: Session, payload: ReviewCreate, current_user: User) -> ReviewRead:
    appt = db.query(Appointment).filter(Appointment.id == payload.appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Запис не знайдено")
    if appt.patient_id != current_user.id:
        raise HTTPException(status_code=403, detail="Доступ заборонено")
    if appt.status != AppointmentStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Можна залишити відгук лише після завершеного візиту")

    existing = db.query(Review).filter(Review.appointment_id == payload.appointment_id).first()
    if existing:
        raise HTTPException(status_code=409, detail="Відгук вже залишено")

    review = Review(
        appointment_id=appt.id,
        doctor_id=appt.doctor_id,
        patient_id=current_user.id,
        rating=payload.rating,
        comment=payload.comment,
        moderation_status="pending",
    )
    db.add(review)
    db.flush()

    # Update doctor rating
    _recalculate_doctor_rating(db, appt.doctor_id)
    db.commit()
    db.refresh(review)
    return _build_review_read(review)


def _recalculate_doctor_rating(db: Session, doctor_id: int) -> None:
    reviews = db.query(Review).filter(
        Review.doctor_id == doctor_id,
        Review.moderation_status == "approved",
    ).all()
    if reviews:
        avg = sum(r.rating for r in reviews) / len(reviews)
    else:
        avg = 0.0
    profile = db.query(DoctorProfile).filter(DoctorProfile.id == doctor_id).first()
    if profile:
        profile.rating = round(avg, 2)


def get_reviews(
    db: Session,
    doctor_id: int | None = None,
    moderation_status: str | None = None,
    current_user: User | None = None,
) -> list[ReviewRead]:
    query = db.query(Review)
    if doctor_id:
        query = query.filter(Review.doctor_id == doctor_id)
    if moderation_status:
        query = query.filter(Review.moderation_status == moderation_status)
    if not current_user or current_user.role == UserRole.PATIENT:
        query = query.filter(Review.moderation_status == "approved")
    reviews = query.order_by(Review.created_at.desc()).all()
    return [_build_review_read(r) for r in reviews]


def moderate_review(db: Session, review_id: int, payload: ReviewModerationUpdate) -> ReviewRead:
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Відгук не знайдено")
    review.moderation_status = payload.moderation_status
    _recalculate_doctor_rating(db, review.doctor_id)
    db.commit()
    db.refresh(review)
    return _build_review_read(review)


def get_my_reviews(db: Session, current_user: User) -> list[ReviewRead]:
    reviews = db.query(Review).filter(Review.patient_id == current_user.id).all()
    return [_build_review_read(r) for r in reviews]
