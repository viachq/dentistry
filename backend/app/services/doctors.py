from pathlib import Path
from sqlalchemy.orm import Session
from fastapi import HTTPException, UploadFile, status
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.doctor_profile import DoctorProfile
from app.models.service import DoctorService, Service
from app.models.schedule import WorkSchedule
from app.models.schedule_exception import ScheduleException
from app.models.user import User, UserRole
from app.schemas.doctor import DoctorCreate, DoctorUpdate, DoctorRead, DoctorServiceRead, DoctorScheduleRead, DoctorScheduleExceptionRead
from app.schemas.service import ServiceRead


def _build_doctor_read(profile: DoctorProfile) -> DoctorRead:
    photo_url = None
    if profile.photo_path:
        photo_url = f"{settings.backend_public_url}/uploads/{profile.photo_path}"
    return DoctorRead(
        id=profile.id,
        user_id=profile.user_id,
        full_name=profile.user.full_name,
        phone=profile.user.phone,
        email=profile.user.email,
        birth_date=profile.birth_date,
        title=profile.title,
        rating=profile.rating,
        photo_url=photo_url,
        bio=profile.bio,
        education=profile.education,
        achievements=profile.achievements,
        experience_years=profile.experience_years,
        commission_percent=profile.commission_percent,
        fixed_payout=profile.fixed_payout,
        is_active=profile.user.is_active,
        services=[
            DoctorServiceRead(
                service=ServiceRead.model_validate(ds.service),
                custom_price=ds.custom_price,
            )
            for ds in profile.services
        ],
        schedules=[DoctorScheduleRead.model_validate(s) for s in profile.schedules],
        schedule_exceptions=[DoctorScheduleExceptionRead.model_validate(e) for e in profile.schedule_exceptions],
    )


def get_all_doctors(db: Session, include_inactive: bool = False) -> list[DoctorRead]:
    query = db.query(DoctorProfile).join(DoctorProfile.user)
    if not include_inactive:
        query = query.filter(User.is_active == True)
    profiles = query.all()
    return [_build_doctor_read(p) for p in profiles]


def get_doctor_by_id(db: Session, doctor_id: int) -> DoctorRead:
    profile = db.query(DoctorProfile).filter(DoctorProfile.id == doctor_id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Лікаря не знайдено")
    return _build_doctor_read(profile)


def create_doctor(db: Session, payload: DoctorCreate) -> DoctorRead:
    existing = db.query(User).filter(User.username == payload.username).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already exists")

    user = User(
        username=payload.username,
        hashed_password=get_password_hash(payload.password),
        full_name=payload.full_name,
        phone=payload.phone,
        email=payload.email,
        role=UserRole.DOCTOR,
        is_active=payload.is_active,
    )
    db.add(user)
    db.flush()

    profile = DoctorProfile(
        user_id=user.id,
        birth_date=payload.birth_date,
        title=payload.title,
        bio=payload.bio,
        education=payload.education,
        achievements=payload.achievements,
        experience_years=payload.experience_years,
        commission_percent=payload.commission_percent,
        fixed_payout=payload.fixed_payout,
    )
    db.add(profile)
    db.flush()

    for svc_assign in payload.services:
        svc = db.query(Service).filter(Service.id == svc_assign.service_id).first()
        if svc:
            db.add(DoctorService(doctor_id=profile.id, service_id=svc.id, custom_price=svc_assign.custom_price))

    for sched in payload.schedules:
        db.add(WorkSchedule(
            doctor_id=profile.id,
            weekday=sched.weekday,
            start_time=sched.start_time,
            end_time=sched.end_time,
            break_start=sched.break_start,
            break_end=sched.break_end,
        ))

    db.commit()
    db.refresh(profile)
    return _build_doctor_read(profile)


def update_doctor(db: Session, doctor_id: int, payload: DoctorUpdate) -> DoctorRead:
    profile = db.query(DoctorProfile).filter(DoctorProfile.id == doctor_id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Лікаря не знайдено")

    user = profile.user
    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.phone is not None:
        user.phone = payload.phone
    if payload.email is not None:
        user.email = payload.email
    if payload.is_active is not None:
        user.is_active = payload.is_active

    if payload.birth_date is not None:
        profile.birth_date = payload.birth_date
    if payload.title is not None:
        profile.title = payload.title
    if payload.bio is not None:
        profile.bio = payload.bio
    if payload.education is not None:
        profile.education = payload.education
    if payload.achievements is not None:
        profile.achievements = payload.achievements
    if payload.experience_years is not None:
        profile.experience_years = payload.experience_years
    if payload.commission_percent is not None:
        profile.commission_percent = payload.commission_percent
    if payload.fixed_payout is not None:
        profile.fixed_payout = payload.fixed_payout

    if payload.services is not None:
        for ds in profile.services:
            db.delete(ds)
        db.flush()
        for svc_assign in payload.services:
            svc = db.query(Service).filter(Service.id == svc_assign.service_id).first()
            if svc:
                db.add(DoctorService(doctor_id=profile.id, service_id=svc.id, custom_price=svc_assign.custom_price))

    if payload.schedules is not None:
        for s in profile.schedules:
            db.delete(s)
        db.flush()
        for sched in payload.schedules:
            db.add(WorkSchedule(
                doctor_id=profile.id,
                weekday=sched.weekday,
                start_time=sched.start_time,
                end_time=sched.end_time,
                break_start=sched.break_start,
                break_end=sched.break_end,
            ))

    db.commit()
    db.refresh(profile)
    return _build_doctor_read(profile)


def upload_doctor_photo(db: Session, doctor_id: int, file: UploadFile) -> DoctorRead:
    profile = db.query(DoctorProfile).filter(DoctorProfile.id == doctor_id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Лікаря не знайдено")

    uploads_dir = Path(settings.upload_dir) / "doctors"
    uploads_dir.mkdir(parents=True, exist_ok=True)

    suffix = Path(file.filename or "photo.jpg").suffix.lower()
    filename = f"doctor_{doctor_id}{suffix}"
    dest = uploads_dir / filename

    with dest.open("wb") as f:
        f.write(file.file.read())

    profile.photo_path = f"doctors/{filename}"
    db.commit()
    db.refresh(profile)
    return _build_doctor_read(profile)


def add_schedule_exception(db: Session, doctor_id: int, payload) -> ScheduleException:
    profile = db.query(DoctorProfile).filter(DoctorProfile.id == doctor_id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Лікаря не знайдено")
    exc = ScheduleException(
        doctor_id=doctor_id,
        exception_date=payload.exception_date,
        is_day_off=payload.is_day_off,
        start_time=payload.start_time,
        end_time=payload.end_time,
        reason=payload.reason,
    )
    db.add(exc)
    db.commit()
    db.refresh(exc)
    return exc


def delete_schedule_exception(db: Session, doctor_id: int, exception_id: int) -> None:
    exc = db.query(ScheduleException).filter(
        ScheduleException.id == exception_id,
        ScheduleException.doctor_id == doctor_id,
    ).first()
    if not exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Виняток не знайдено")
    db.delete(exc)
    db.commit()
