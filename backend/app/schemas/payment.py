from pydantic import BaseModel, ConfigDict, Field
from app.models.payment import PaymentMethod, PaymentStatus


class PaymentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    appointment_id: int
    amount: float
    method: PaymentMethod
    status: PaymentStatus
    provider_reference: str | None


class PaymentUpdate(BaseModel):
    method: PaymentMethod | None = None
    status: PaymentStatus | None = None
    provider_reference: str | None = Field(default=None, max_length=120)
