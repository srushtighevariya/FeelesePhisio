"""
routers/appointments.py — Appointment CRUD with role-scoping.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

import models
import schemas
from auth import get_current_user
from database import get_db

router = APIRouter(prefix="/api/appointments", tags=["appointments"])


def _scoped_query(db, current_user):
    q = db.query(models.Appointment)
    if current_user.role == "therapist" and current_user.doctor_id:
        q = q.filter(models.Appointment.doctor_id == current_user.doctor_id)
    return q


@router.get("", response_model=List[schemas.AppointmentOut])
def list_appointments(
    date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    q = _scoped_query(db, current_user)
    if date:
        q = q.filter(models.Appointment.date == date)
    return q.order_by(models.Appointment.date, models.Appointment.time).all()


@router.post("", response_model=schemas.AppointmentOut, status_code=201)
def create_appointment(
    body: schemas.AppointmentCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    appt = models.Appointment(**body.model_dump())
    db.add(appt)
    db.commit()
    db.refresh(appt)
    return appt


@router.get("/{appt_id}", response_model=schemas.AppointmentOut)
def get_appointment(
    appt_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    appt = _scoped_query(db, current_user).filter(models.Appointment.id == appt_id).first()
    if not appt:
        raise HTTPException(404, "Appointment not found")
    return appt


@router.put("/{appt_id}", response_model=schemas.AppointmentOut)
def update_appointment(
    appt_id: int,
    body: schemas.AppointmentUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    appt = _scoped_query(db, current_user).filter(models.Appointment.id == appt_id).first()
    if not appt:
        raise HTTPException(404, "Appointment not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(appt, k, v)
    db.commit()
    db.refresh(appt)
    return appt


@router.delete("/{appt_id}", status_code=204)
def delete_appointment(
    appt_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    appt = _scoped_query(db, current_user).filter(models.Appointment.id == appt_id).first()
    if not appt:
        raise HTTPException(404, "Appointment not found")
    db.delete(appt)
    db.commit()
