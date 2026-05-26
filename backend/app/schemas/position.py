from pydantic import BaseModel, ConfigDict, Field


class PositionBase(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    is_active: bool = True


class PositionCreate(PositionBase):
    pass


class PositionUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=80)
    is_active: bool | None = None


class PositionRead(PositionBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
