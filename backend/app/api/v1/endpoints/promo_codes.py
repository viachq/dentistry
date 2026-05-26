from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.api.deps.auth import require_role
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.promo_code import PromoCodeCreate, PromoCodeUpdate, PromoCodeRead, PromoCodeValidationRead
from app.services import promo_codes as promo_service

router = APIRouter()


@router.get("", response_model=list[PromoCodeRead])
def list_promo_codes(
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN)),
) -> list[PromoCodeRead]:
    return promo_service.get_all_promo_codes(db)


@router.post("", response_model=PromoCodeRead, status_code=status.HTTP_201_CREATED)
def create_promo_code(
    payload: PromoCodeCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN)),
) -> PromoCodeRead:
    return promo_service.create_promo_code(db, payload)


@router.patch("/{promo_id}", response_model=PromoCodeRead)
def update_promo_code(
    promo_id: int,
    payload: PromoCodeUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN)),
) -> PromoCodeRead:
    return promo_service.update_promo_code(db, promo_id, payload)


@router.delete("/{promo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_promo_code(
    promo_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN)),
) -> None:
    promo_service.delete_promo_code(db, promo_id)


@router.get("/validate", response_model=PromoCodeValidationRead)
def validate_promo_code(
    code: str,
    doctor_id: int,
    service_id: int,
    db: Session = Depends(get_db),
) -> PromoCodeValidationRead:
    return promo_service.validate_promo_code(db, code, doctor_id, service_id)
