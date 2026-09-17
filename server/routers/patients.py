"""
routers/patients.py — Patient CRUD + nested resources (assessment, treatment plan, sessions).
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from datetime import date as date_type

import models
import schemas
from auth import get_current_user
from database import get_db

router = APIRouter(prefix="/api/patients", tags=["patients"])


def _base_query(db: Session, current_user: models.User):
    """Base query, scoped by role."""
    q = (
        db.query(models.Patient)
        .filter(models.Patient.status != "Archived")
        .options(
            joinedload(models.Patient.assessment),
            joinedload(models.Patient.treatment_plan).joinedload(models.TreatmentPlan.items),
            joinedload(models.Patient.sessions),
        )
    )
    if current_user.role == "therapist" and current_user.doctor_id:
        q = q.filter(models.Patient.doctor_id == current_user.doctor_id)
    return q


def _next_code(db: Session) -> str:
    """Auto-generate next PT code."""
    last = db.query(models.Patient).order_by(models.Patient.id.desc()).first()
    next_id = (last.id + 1) if last else 1
    return f"PT{next_id:04d}"


# ---------------------------------------------------------------------------
# Patient CRUD
# ---------------------------------------------------------------------------
@router.get("", response_model=List[schemas.PatientListItem])
def list_patients(
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    q = _base_query(db, current_user)
    if search:
        like = f"%{search}%"
        q = q.filter(
            models.Patient.name.ilike(like) | models.Patient.code.ilike(like)
        )
    if status:
        q = q.filter(models.Patient.status == status)
    return q.order_by(models.Patient.registration_date.desc()).all()


@router.post("", response_model=schemas.PatientOut, status_code=201)
def create_patient(
    body: schemas.PatientCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    data = body.model_dump()
    if not data.get("code"):
        data["code"] = _next_code(db)
    if not data.get("registration_date"):
        data["registration_date"] = date_type.today().isoformat()
    patient = models.Patient(**data)
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient


@router.get("/{patient_id}", response_model=schemas.PatientOut)
def get_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    patient = _base_query(db, current_user).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(404, "Patient not found")
    return patient


@router.put("/{patient_id}", response_model=schemas.PatientOut)
def update_patient(
    patient_id: int,
    body: schemas.PatientUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    patient = _base_query(db, current_user).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(404, "Patient not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(patient, k, v)
    db.commit()
    db.refresh(patient)
    return patient


@router.delete("/{patient_id}", status_code=204)
def delete_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    patient = _base_query(db, current_user).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(404, "Patient not found")
    patient.status = "Archived"  # soft-delete
    db.commit()


# ---------------------------------------------------------------------------
# Assessment (nested resource)
# ---------------------------------------------------------------------------
@router.get("/{patient_id}/assessment", response_model=schemas.AssessmentOut)
def get_assessment(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    patient = _base_query(db, current_user).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(404, "Patient not found")
    if not patient.assessment:
        raise HTTPException(404, "No assessment recorded yet")
    return patient.assessment


@router.post("/{patient_id}/assessment", response_model=schemas.AssessmentOut)
def upsert_assessment(
    patient_id: int,
    body: schemas.AssessmentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    patient = _base_query(db, current_user).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(404, "Patient not found")

    existing = db.query(models.Assessment).filter_by(patient_id=patient_id).first()
    if existing:
        for k, v in body.model_dump(exclude_unset=True).items():
            setattr(existing, k, v)
        db.commit()
        db.refresh(existing)
        return existing

    assessment = models.Assessment(patient_id=patient_id, **body.model_dump())
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    return assessment


# ---------------------------------------------------------------------------
# Treatment Plan (nested resource)
# ---------------------------------------------------------------------------
@router.get("/{patient_id}/treatment-plan", response_model=schemas.TreatmentPlanOut)
def get_treatment_plan(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    patient = _base_query(db, current_user).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(404, "Patient not found")
    if not patient.treatment_plan:
        raise HTTPException(404, "No treatment plan yet")
    return patient.treatment_plan


@router.post("/{patient_id}/treatment-plan", response_model=schemas.TreatmentPlanOut)
def upsert_treatment_plan(
    patient_id: int,
    body: schemas.TreatmentPlanCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    patient = _base_query(db, current_user).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(404, "Patient not found")

    existing = db.query(models.TreatmentPlan).filter_by(patient_id=patient_id).first()
    if existing:
        # Update scalars
        for k in ("start_date", "end_date", "planned_sessions"):
            val = getattr(body, k, None)
            if val is not None:
                setattr(existing, k, val)
        # Replace items
        db.query(models.TreatmentItem).filter_by(plan_id=existing.id).delete()
        for item in body.items or []:
            db.add(models.TreatmentItem(plan_id=existing.id, **item.model_dump()))
        db.commit()
        db.refresh(existing)
        return existing

    plan = models.TreatmentPlan(
        patient_id=patient_id,
        start_date=body.start_date,
        end_date=body.end_date,
        planned_sessions=body.planned_sessions,
    )
    db.add(plan)
    db.flush()
    for item in body.items or []:
        db.add(models.TreatmentItem(plan_id=plan.id, **item.model_dump()))
    db.commit()
    db.refresh(plan)
    return plan


# ---------------------------------------------------------------------------
# Sessions (nested resource)
# ---------------------------------------------------------------------------
@router.get("/{patient_id}/sessions", response_model=List[schemas.SessionOut])
def list_sessions(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    patient = _base_query(db, current_user).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(404, "Patient not found")
    return (
        db.query(models.Session)
        .filter_by(patient_id=patient_id)
        .order_by(models.Session.date)
        .all()
    )


@router.post("/{patient_id}/sessions", response_model=schemas.SessionOut, status_code=201)
def add_session(
    patient_id: int,
    body: schemas.SessionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    patient = _base_query(db, current_user).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(404, "Patient not found")
    session = models.Session(patient_id=patient_id, **body.model_dump())
    db.add(session)
    db.commit()
    db.refresh(session)
    return session
