from datetime import date, time
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.service import ServiceRead


class DoctorScheduleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    weekday: int
    start_time: time
    end_time: time
    break_start: time | None
    break_end: time | None


class DoctorScheduleUpsert(BaseModel):
    weekday: int = Field(ge=0, le=6)
    start_time: time
    end_time: time
    break_start: time | None = None
    break_end: time | None = None


class DoctorScheduleExceptionCreate(BaseModel):
    exception_date: date
    is_day_off: bool = False
    start_time: time | None = None
    end_time: time | None = None
    reason: str | None = Field(default=None, max_length=255)


class DoctorScheduleExceptionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    exception_date: date
    is_day_off: bool
    start_time: time | None
    end_time: time | None
    reason: str | None


class DoctorServiceAssign(BaseModel):
    service_id: int
    custom_price: float | None = Field(default=None, gt=0)


class DoctorProfileBase(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    phone: str | None = Field(default=None, max_length=32)
    email: str | None = Field(default=None, max_length=255)
    birth_date: date | None = None
    title: str = Field(default="Dentist", min_length=2, max_length=80)
    bio: str | None = None
    education: str | None = None
    achievements: str | None = None
    experience_years: int | None = Field(default=None, ge=0, le=60)
    commission_percent: float | None = Field(default=None, ge=0, le=100)
    fixed_payout: float | None = Field(default=None, ge=0)
    is_active: bool = True


class DoctorCreate(DoctorProfileBase):
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=8, max_length=128)
    services: list[DoctorServiceAssign] = Field(default_factory=list)
    schedules: list[DoctorScheduleUpsert] = Field(default_factory=list)


class DoctorUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=120)
    phone: str | None = Field(default=None, max_length=32)
    email: str | None = Field(default=None, max_length=255)
    birth_date: date | None = None
    title: str | None = Field(default=None, min_length=2, max_length=80)
    bio: str | None = None
    education: str | None = None
    achievements: str | None = None
    experience_years: int | None = Field(default=None, ge=0, le=60)
    commission_percent: float | None = Field(default=None, ge=0, le=100)
    fixed_payout: float | None = Field(default=None, ge=0)
    is_active: bool | None = None
    services: list[DoctorServiceAssign] | None = None
    schedules: list[DoctorScheduleUpsert] | None = None


class DoctorServiceRead(BaseModel):
    service: ServiceRead
    custom_price: float | None


class DoctorRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    full_name: str
    phone: str | None
    email: str | None
    birth_date: date | None
    title: str
    rating: float
    photo_url: str | None
    bio: str | None
    education: str | None
    achievements: str | None
    experience_years: int | None
    commission_percent: float | None
    fixed_payout: float | None
    is_active: bool
    services: list[DoctorServiceRead]
    schedules: list[DoctorScheduleRead]
    schedule_exceptions: list[DoctorScheduleExceptionRead]
