from pydantic import BaseModel, ConfigDict, Field


class ExpenseCategoryCreate(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    is_active: bool = True


class ExpenseCategoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=80)
    is_active: bool | None = None


class ExpenseCategoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    is_active: bool
