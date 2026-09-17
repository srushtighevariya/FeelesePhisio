"""
routers/reports.py — Generate a structured report for a patient.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

import models
import schemas
from auth import get_current_user
from database import get_db

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/{patient_id}", response_model=schemas.ReportOut)
def get_patient_report(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # Scope: therapist can only access their own patients
    q = (
        db.query(models.Patient)
        .options(
            joinedload(models.Patient.assessment),
            joinedload(models.Patient.treatment_plan).joinedload(models.TreatmentPlan.items),
            joinedload(models.Patient.sessions),
        )
        .filter(models.Patient.id == patient_id, models.Patient.status != "Archived")
    )
    if current_user.role == "therapist" and current_user.doctor_id:
        q = q.filter(models.Patient.doctor_id == current_user.doctor_id)

    patient = q.first()
    if not patient:
        raise HTTPException(404, "Patient not found")

    sessions = patient.sessions or []
    total = len(sessions)
    avg_before = round(sum(s.pain_before for s in sessions if s.pain_before is not None) / total, 1) if total else None
    avg_after = round(sum(s.pain_after for s in sessions if s.pain_after is not None) / total, 1) if total else None

    improvement = None
    if avg_before is not None and avg_after is not None and avg_before > 0:
        improvement = round(((avg_before - avg_after) / avg_before) * 100, 1)

    last_date = max((s.date for s in sessions if s.date), default=None)

    return schemas.ReportOut(
        patient=patient,
        total_sessions=total,
        avg_pain_before=avg_before,
        avg_pain_after=avg_after,
        improvement_pct=improvement,
        last_session_date=last_date,
    )


@router.get("", response_model=list)
def list_reportable_patients(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Return a slim list of patients that have at least one session."""
    q = db.query(models.Patient).filter(models.Patient.status != "Archived")
    if current_user.role == "therapist" and current_user.doctor_id:
        q = q.filter(models.Patient.doctor_id == current_user.doctor_id)

    patients = q.all()
    result = []
    for p in patients:
        session_count = db.query(models.Session).filter_by(patient_id=p.id).count()
        result.append({
            "id": p.id,
            "code": p.code,
            "name": p.name,
            "status": p.status,
            "session_count": session_count,
        })
    return result
