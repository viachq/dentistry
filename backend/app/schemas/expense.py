from datetime import date
from pydantic import BaseModel, ConfigDict, Field


class ExpenseCreate(BaseModel):
    category: str = Field(min_length=2, max_length=80)
    amount: float = Field(gt=0)
    expense_date: date
    description: str | None = None


class ExpenseRead(ExpenseCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
