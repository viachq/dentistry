from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.api.deps.auth import get_current_user, require_role
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.patient_note import PatientNote
from app.schemas.auth import UserRead
from app.schemas.patient_card import PatientCardRead, PatientCardUpdate, DentalVisitCreate, DentalVisitRead
from app.services import patient_cards as card_service

router = APIRouter()


@router.get("", response_model=list[UserRead])
def list_patients(
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN, UserRole.DOCTOR)),
) -> list[UserRead]:
    patients = db.query(User).filter(User.role == UserRole.PATIENT).all()
    return [UserRead.model_validate(p) for p in patients]


@router.get("/me/card", response_model=PatientCardRead)
def get_my_card(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.PATIENT)),
) -> PatientCardRead:
    return card_service.get_patient_card(db, current_user.id, current_user)


@router.patch("/me/card", response_model=PatientCardRead)
def update_my_card(
    payload: PatientCardUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.PATIENT)),
) -> PatientCardRead:
    return card_service.update_patient_card(db, current_user.id, payload, current_user)


@router.get("/{patient_id}", response_model=UserRead)
def get_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN, UserRole.DOCTOR)),
) -> UserRead:
    from fastapi import HTTPException
    patient = db.query(User).filter(User.id == patient_id, User.role == UserRole.PATIENT).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Пацієнта не знайдено")
    return UserRead.model_validate(patient)


@router.get("/{patient_id}/card", response_model=PatientCardRead)
def get_patient_card(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PatientCardRead:
    return card_service.get_patient_card(db, patient_id, current_user)


@router.patch("/{patient_id}/card", response_model=PatientCardRead)
def update_patient_card(
    patient_id: int,
    payload: PatientCardUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.DOCTOR)),
) -> PatientCardRead:
    return card_service.update_patient_card(db, patient_id, payload, current_user)


@router.get("/{patient_id}/visits", response_model=list[DentalVisitRead])
def get_patient_visits(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[DentalVisitRead]:
    return card_service.get_dental_visits(db, patient_id, current_user)


@router.post("/{patient_id}/visits", response_model=DentalVisitRead, status_code=status.HTTP_201_CREATED)
def create_dental_visit(
    patient_id: int,
    payload: DentalVisitCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.DOCTOR)),
) -> DentalVisitRead:
    return card_service.create_dental_visit(db, patient_id, payload, current_user)


@router.patch("/{patient_id}/visits/{visit_id}", response_model=DentalVisitRead)
def update_dental_visit(
    patient_id: int,
    visit_id: int,
    payload: DentalVisitCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.DOCTOR)),
) -> DentalVisitRead:
    return card_service.update_dental_visit(db, visit_id, payload, current_user)


# Patient notes
@router.get("/{patient_id}/notes")
def get_patient_notes(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.DOCTOR)),
):
    notes = db.query(PatientNote).filter(PatientNote.patient_id == patient_id).all()
    return [{"id": n.id, "doctor_id": n.doctor_id, "patient_id": n.patient_id, "text": n.text} for n in notes]


@router.post("/{patient_id}/notes", status_code=status.HTTP_201_CREATED)
def create_patient_note(
    patient_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.DOCTOR)),
):
    from fastapi import HTTPException
    from app.models.doctor_profile import DoctorProfile
    dp = db.query(DoctorProfile).filter(DoctorProfile.user_id == current_user.id).first()
    if not dp and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Доступ заборонено")
    doctor_id = dp.id if dp else 0
    note = PatientNote(doctor_id=doctor_id, patient_id=patient_id, text=payload.get("text", ""))
    db.add(note)
    db.commit()
    db.refresh(note)
    return {"id": note.id, "doctor_id": note.doctor_id, "patient_id": note.patient_id, "text": note.text}
