from datetime import datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field

ReviewModerationStatus = Literal["pending", "approved", "rejected"]


class ReviewCreate(BaseModel):
    appointment_id: int
    rating: int = Field(ge=1, le=5)
    comment: str | None = Field(default=None, max_length=1000)


class ReviewModerationUpdate(BaseModel):
    moderation_status: ReviewModerationStatus


class ReviewRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    appointment_id: int
    doctor_id: int
    patient_id: int
    rating: int
    comment: str | None
    moderation_status: ReviewModerationStatus
    patient_name: str
    doctor_name: str
    service_name: str
    appointment_starts_at: datetime
    created_at: datetime
