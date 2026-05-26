from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.api.deps.auth import get_current_user, get_optional_user, require_role
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.review import ReviewCreate, ReviewModerationUpdate, ReviewRead
from app.services import reviews as review_service

router = APIRouter()


@router.get("", response_model=list[ReviewRead])
def list_reviews(
    doctor_id: int | None = None,
    moderation_status: str | None = None,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
) -> list[ReviewRead]:
    return review_service.get_reviews(db, doctor_id, moderation_status, current_user)


@router.get("/my", response_model=list[ReviewRead])
def get_my_reviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.PATIENT)),
) -> list[ReviewRead]:
    return review_service.get_my_reviews(db, current_user)


@router.post("", response_model=ReviewRead, status_code=status.HTTP_201_CREATED)
def create_review(
    payload: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.PATIENT)),
) -> ReviewRead:
    return review_service.create_review(db, payload, current_user)


@router.patch("/{review_id}/moderate", response_model=ReviewRead)
def moderate_review(
    review_id: int,
    payload: ReviewModerationUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN)),
) -> ReviewRead:
    return review_service.moderate_review(db, review_id, payload)
