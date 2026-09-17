"""
schemas.py — Pydantic v2 request/response models for Recovery Path API.
"""
from __future__ import annotations
from typing import Optional, List
from pydantic import BaseModel, EmailStr


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------
class LoginRequest(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    name: str
    doctor_id: Optional[int] = None


class UserOut(BaseModel):
    id: int
    username: str
    role: str
    name: str
    doctor_id: Optional[int] = None

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Doctors
# ---------------------------------------------------------------------------
class DoctorBase(BaseModel):
    code: str
    name: str
    specialization: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    available_days: Optional[str] = None
    status: Optional[str] = "Active"


class DoctorCreate(DoctorBase):
    pass


class DoctorUpdate(BaseModel):
    name: Optional[str] = None
    specialization: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    available_days: Optional[str] = None
    status: Optional[str] = None


class DoctorOut(DoctorBase):
    id: int

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Assessment
# ---------------------------------------------------------------------------
class AssessmentBase(BaseModel):
    main_complaint: Optional[str] = None
    body_part: Optional[str] = None
    onset: Optional[str] = None
    pain_level: Optional[int] = 0
    pain_type: Optional[str] = None
    range_of_motion: Optional[str] = None
    muscle_strength: Optional[str] = None
    posture: Optional[str] = None
    diagnosis: Optional[str] = None


class AssessmentCreate(AssessmentBase):
    pass


class AssessmentOut(AssessmentBase):
    id: int
    patient_id: int

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Treatment Plan
# ---------------------------------------------------------------------------
class TreatmentItemBase(BaseModel):
    treatment: str
    frequency: Optional[str] = None
    duration: Optional[str] = None


class TreatmentItemOut(TreatmentItemBase):
    id: int

    model_config = {"from_attributes": True}


class TreatmentPlanBase(BaseModel):
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    planned_sessions: Optional[int] = 10
    items: Optional[List[TreatmentItemBase]] = []


class TreatmentPlanCreate(TreatmentPlanBase):
    pass


class TreatmentPlanOut(BaseModel):
    id: int
    patient_id: int
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    planned_sessions: Optional[int] = None
    items: List[TreatmentItemOut] = []

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Sessions
# ---------------------------------------------------------------------------
class SessionBase(BaseModel):
    date: str
    pain_before: Optional[int] = None
    pain_after: Optional[int] = None
    treatment_given: Optional[str] = None
    duration: Optional[int] = None
    notes: Optional[str] = None


class SessionCreate(SessionBase):
    pass


class SessionOut(SessionBase):
    id: int
    patient_id: int

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Patients
# ---------------------------------------------------------------------------
class PatientBase(BaseModel):
    code: Optional[str] = None
    name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    occupation: Optional[str] = None
    referred_by: Optional[str] = None
    medical_history: Optional[str] = None
    doctor_id: Optional[int] = None
    registration_date: Optional[str] = None
    status: Optional[str] = "New"


class PatientCreate(PatientBase):
    pass


class PatientUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    occupation: Optional[str] = None
    referred_by: Optional[str] = None
    medical_history: Optional[str] = None
    doctor_id: Optional[int] = None
    status: Optional[str] = None


class PatientOut(PatientBase):
    id: int
    assessment: Optional[AssessmentOut] = None
    treatment_plan: Optional[TreatmentPlanOut] = None
    sessions: List[SessionOut] = []

    model_config = {"from_attributes": True}


class PatientListItem(PatientBase):
    """Lighter version for list views — no nested sessions."""
    id: int
    assessment: Optional[AssessmentOut] = None
    treatment_plan: Optional[TreatmentPlanOut] = None

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Appointments
# ---------------------------------------------------------------------------
class AppointmentBase(BaseModel):
    patient_id: int
    doctor_id: int
    date: str
    time: str
    treatment_type: Optional[str] = None
    status: Optional[str] = "Scheduled"
    notes: Optional[str] = None


class AppointmentCreate(AppointmentBase):
    pass


class AppointmentUpdate(BaseModel):
    date: Optional[str] = None
    time: Optional[str] = None
    treatment_type: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    doctor_id: Optional[int] = None


class AppointmentOut(AppointmentBase):
    id: int

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Exercises
# ---------------------------------------------------------------------------
class ExerciseBase(BaseModel):
    name: str
    body_part: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    sets: Optional[int] = None
    reps: Optional[int] = None
    duration: Optional[str] = None
    level: Optional[str] = None


class ExerciseCreate(ExerciseBase):
    pass


class ExerciseUpdate(BaseModel):
    name: Optional[str] = None
    body_part: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    sets: Optional[int] = None
    reps: Optional[int] = None
    duration: Optional[str] = None
    level: Optional[str] = None


class ExerciseOut(ExerciseBase):
    id: int

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Reports
# ---------------------------------------------------------------------------
class ReportOut(BaseModel):
    patient: PatientOut
    total_sessions: int
    avg_pain_before: Optional[float] = None
    avg_pain_after: Optional[float] = None
    improvement_pct: Optional[float] = None
    last_session_date: Optional[str] = None
