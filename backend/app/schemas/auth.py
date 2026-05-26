import re
from pydantic import BaseModel, ConfigDict, field_validator
from app.models.user import UserRole

_PHONE_RE = re.compile(r"^\+?\d[\d\s\-()]{6,18}\d$")


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    username: str
    password: str


class PatientRegisterRequest(BaseModel):
    username: str
    password: str
    full_name: str
    phone: str | None = None

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str | None) -> str | None:
        if not v:
            return v
        if not _PHONE_RE.match(v):
            raise ValueError("Невірний формат телефону. Приклад: +380501234567")
        return v


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    username: str
    full_name: str
    role: UserRole
    is_active: bool
