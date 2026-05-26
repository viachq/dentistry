from pydantic import BaseModel, ConfigDict, Field


class ServiceBase(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    category: str | None = Field(default=None, max_length=80)
    description: str | None = Field(default=None, max_length=255)
    duration_minutes: int = Field(ge=0, le=480)
    price: float = Field(gt=0)
    is_active: bool = True


class ServiceCreate(ServiceBase):
    pass


class ServiceUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    category: str | None = Field(default=None, max_length=80)
    description: str | None = Field(default=None, max_length=255)
    duration_minutes: int | None = Field(default=None, ge=0, le=480)
    price: float | None = Field(default=None, gt=0)
    is_active: bool | None = None


class ServiceRead(ServiceBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
