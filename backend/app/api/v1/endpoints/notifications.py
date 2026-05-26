from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.notification import NotificationRead, NotificationUnreadCount
from app.services import notifications as notif_service

router = APIRouter()


@router.get("", response_model=list[NotificationRead])
def get_my_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[NotificationRead]:
    return notif_service.get_my_notifications(db, current_user)


@router.get("/unread-count", response_model=NotificationUnreadCount)
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> NotificationUnreadCount:
    return notif_service.get_unread_count(db, current_user)


@router.post("/mark-all-read", status_code=204)
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    notif_service.mark_all_read(db, current_user)


@router.patch("/{notification_id}/read", response_model=NotificationRead)
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> NotificationRead:
    return notif_service.mark_notification_read(db, notification_id, current_user)
