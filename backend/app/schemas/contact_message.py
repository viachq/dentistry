from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ContactMessageCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=6, max_length=32)
    email: str | None = Field(default=None, max_length=255)
    message: str = Field(min_length=10)


class ContactMessageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    phone: str
    email: str | None
    message: str
    is_read: bool
    created_at: datetime
