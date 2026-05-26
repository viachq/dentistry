from datetime import date
from pydantic import BaseModel, ConfigDict, Field


class PatientCardUpdate(BaseModel):
    birth_date: date | None = None
    blood_type: str | None = Field(default=None, max_length=5)
    allergies: str | None = None
    chronic_conditions: str | None = None
    general_notes: str | None = None


class PatientCardRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    patient_id: int
    birth_date: date | None
    blood_type: str | None
    allergies: str | None
    chronic_conditions: str | None
    general_notes: str | None


class DentalVisitCreate(BaseModel):
    appointment_id: int | None = None
    diagnosis: str | None = None
    treatment_performed: str | None = None
    prescriptions: str | None = None
    next_visit_recommendation: str | None = None
    doctor_notes: str | None = None


class DentalVisitRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    patient_card_id: int
    appointment_id: int | None
    diagnosis: str | None
    treatment_performed: str | None
    prescriptions: str | None
    next_visit_recommendation: str | None
    doctor_notes: str | None
    created_at: str
