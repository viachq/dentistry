from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.api.deps.auth import require_role
from app.db.session import get_db
from app.models.service import Service
from app.models.user import User, UserRole
from app.schemas.service import ServiceCreate, ServiceUpdate, ServiceRead

router = APIRouter()


@router.get("", response_model=list[ServiceRead])
def list_services(db: Session = Depends(get_db)) -> list[ServiceRead]:
    services = db.query(Service).filter(Service.is_active == True).all()
    return [ServiceRead.model_validate(s) for s in services]


@router.get("/all", response_model=list[ServiceRead])
def list_all_services(
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN)),
) -> list[ServiceRead]:
    services = db.query(Service).all()
    return [ServiceRead.model_validate(s) for s in services]


@router.get("/{service_id}", response_model=ServiceRead)
def get_service(service_id: int, db: Session = Depends(get_db)) -> ServiceRead:
    from fastapi import HTTPException
    svc = db.query(Service).filter(Service.id == service_id).first()
    if not svc:
        raise HTTPException(status_code=404, detail="Послугу не знайдено")
    return ServiceRead.model_validate(svc)


@router.post("", response_model=ServiceRead, status_code=status.HTTP_201_CREATED)
def create_service(
    payload: ServiceCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN)),
) -> ServiceRead:
    svc = Service(**payload.model_dump())
    db.add(svc)
    db.commit()
    db.refresh(svc)
    return ServiceRead.model_validate(svc)


@router.patch("/{service_id}", response_model=ServiceRead)
def update_service(
    service_id: int,
    payload: ServiceUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN)),
) -> ServiceRead:
    from fastapi import HTTPException
    svc = db.query(Service).filter(Service.id == service_id).first()
    if not svc:
        raise HTTPException(status_code=404, detail="Послугу не знайдено")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(svc, field, value)
    db.commit()
    db.refresh(svc)
    return ServiceRead.model_validate(svc)


@router.delete("/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_service(
    service_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN)),
) -> None:
    from fastapi import HTTPException
    svc = db.query(Service).filter(Service.id == service_id).first()
    if not svc:
        raise HTTPException(status_code=404, detail="Послугу не знайдено")
    db.delete(svc)
    db.commit()
