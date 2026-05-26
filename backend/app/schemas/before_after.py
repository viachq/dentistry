from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class BeforeAfterCreate(BaseModel):
    title: str = Field(max_length=255)
    description: str | None = None
    before_image_url: str = Field(max_length=500)
    after_image_url: str = Field(max_length=500)
    doctor_id: int


class BeforeAfterRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    doctor_id: int
    title: str
    description: str | None
    before_image_url: str
    after_image_url: str
    is_published: bool
    created_at: datetime
