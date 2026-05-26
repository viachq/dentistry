from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps.auth import require_role
from app.db.session import get_db
from app.models.contact_message import ContactMessage
from app.models.user import User, UserRole
from app.schemas.contact_message import ContactMessageCreate, ContactMessageRead

router = APIRouter()


@router.post("", response_model=ContactMessageRead, status_code=status.HTTP_201_CREATED)
def create_contact_message(
    payload: ContactMessageCreate,
    db: Session = Depends(get_db),
) -> ContactMessageRead:
    msg = ContactMessage(**payload.model_dump())
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


@router.get("", response_model=list[ContactMessageRead])
def list_contact_messages(
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN)),
) -> list[ContactMessageRead]:
    messages = (
        db.query(ContactMessage)
        .order_by(ContactMessage.created_at.desc())
        .all()
    )
    return messages


@router.patch("/{message_id}/read", response_model=ContactMessageRead)
def mark_message_read(
    message_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN)),
) -> ContactMessageRead:
    msg = db.query(ContactMessage).filter(ContactMessage.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    msg.is_read = True
    db.commit()
    db.refresh(msg)
    return msg
