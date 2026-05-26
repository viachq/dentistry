from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models.notification import NotificationType


class NotificationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    type: NotificationType
    title: str
    message: str
    is_read: bool
    link: str | None
    created_at: datetime


class NotificationUnreadCount(BaseModel):
    count: int
