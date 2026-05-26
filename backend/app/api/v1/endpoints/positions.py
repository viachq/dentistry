from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.api.deps.auth import require_role
from app.db.session import get_db
from app.models.position import Position
from app.models.user import User, UserRole
from app.schemas.position import PositionCreate, PositionUpdate, PositionRead

router = APIRouter()


@router.get("", response_model=list[PositionRead])
def list_positions(db: Session = Depends(get_db)) -> list[PositionRead]:
    positions = db.query(Position).filter(Position.is_active == True).all()
    return [PositionRead.model_validate(p) for p in positions]


@router.post("", response_model=PositionRead, status_code=status.HTTP_201_CREATED)
def create_position(
    payload: PositionCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN)),
) -> PositionRead:
    pos = Position(**payload.model_dump())
    db.add(pos)
    db.commit()
    db.refresh(pos)
    return PositionRead.model_validate(pos)


@router.patch("/{position_id}", response_model=PositionRead)
def update_position(
    position_id: int,
    payload: PositionUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN)),
) -> PositionRead:
    from fastapi import HTTPException
    pos = db.query(Position).filter(Position.id == position_id).first()
    if not pos:
        raise HTTPException(status_code=404, detail="Посаду не знайдено")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(pos, field, value)
    db.commit()
    db.refresh(pos)
    return PositionRead.model_validate(pos)


@router.delete("/{position_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_position(
    position_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN)),
) -> None:
    from fastapi import HTTPException
    pos = db.query(Position).filter(Position.id == position_id).first()
    if not pos:
        raise HTTPException(status_code=404, detail="Посаду не знайдено")
    db.delete(pos)
    db.commit()
