from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps.auth import require_role
from app.db.session import get_db
from app.models.before_after import BeforeAfterCase
from app.models.user import User, UserRole
from app.schemas.before_after import BeforeAfterCreate, BeforeAfterRead

router = APIRouter()


@router.get("", response_model=list[BeforeAfterRead])
def list_before_after_cases(
    doctor_id: int | None = None,
    db: Session = Depends(get_db),
) -> list[BeforeAfterRead]:
    q = db.query(BeforeAfterCase).filter(BeforeAfterCase.is_published.is_(True))
    if doctor_id is not None:
        q = q.filter(BeforeAfterCase.doctor_id == doctor_id)
    return q.order_by(BeforeAfterCase.created_at.desc()).all()


@router.post("", response_model=BeforeAfterRead, status_code=status.HTTP_201_CREATED)
def create_before_after_case(
    payload: BeforeAfterCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN, UserRole.DOCTOR)),
) -> BeforeAfterRead:
    case = BeforeAfterCase(**payload.model_dump())
    db.add(case)
    db.commit()
    db.refresh(case)
    return case


@router.delete("/{case_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_before_after_case(
    case_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN, UserRole.DOCTOR)),
) -> None:
    case = db.query(BeforeAfterCase).filter(BeforeAfterCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    db.delete(case)
    db.commit()
