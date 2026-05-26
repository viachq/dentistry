from datetime import date
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field

PromoCodeTypeValue = Literal["percent", "fixed"]


class PromoCodeBase(BaseModel):
    code: str = Field(min_length=3, max_length=40)
    discount_type: PromoCodeTypeValue
    discount_value: float = Field(gt=0)
    expires_at: date | None = None
    usage_limit: int | None = Field(default=None, ge=1)
    is_active: bool = True


class PromoCodeCreate(PromoCodeBase):
    pass


class PromoCodeUpdate(BaseModel):
    code: str | None = Field(default=None, min_length=3, max_length=40)
    discount_type: PromoCodeTypeValue | None = None
    discount_value: float | None = Field(default=None, gt=0)
    expires_at: date | None = None
    usage_limit: int | None = Field(default=None, ge=1)
    is_active: bool | None = None


class PromoCodeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    code: str
    discount_type: PromoCodeTypeValue
    discount_value: float
    expires_at: date | None
    usage_limit: int | None
    is_active: bool
    used_count: int


class PromoCodeValidationRead(BaseModel):
    valid: bool
    code: str
    discount_type: PromoCodeTypeValue | None = None
    discount_value: float | None = None
    discount_amount: float = 0
    final_amount: float = 0
    message: str | None = None
