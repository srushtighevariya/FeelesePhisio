"""
routers/doctors.py — Doctor CRUD (admin only for write operations).
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from auth import get_current_user, require_admin
from database import get_db

router = APIRouter(prefix="/api/doctors", tags=["doctors"])


@router.get("", response_model=List[schemas.DoctorOut])
def list_doctors(
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    return db.query(models.Doctor).filter(models.Doctor.status != "Archived").all()


@router.post("", response_model=schemas.DoctorOut, status_code=201)
def create_doctor(
    body: schemas.DoctorCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    if db.query(models.Doctor).filter_by(code=body.code).first():
        raise HTTPException(400, "Doctor code already exists")
    doctor = models.Doctor(**body.model_dump())
    db.add(doctor)
    db.commit()
    db.refresh(doctor)
    return doctor


@router.get("/{doctor_id}", response_model=schemas.DoctorOut)
def get_doctor(
    doctor_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    doctor = db.query(models.Doctor).filter_by(id=doctor_id).first()
    if not doctor:
        raise HTTPException(404, "Doctor not found")
    return doctor


@router.put("/{doctor_id}", response_model=schemas.DoctorOut)
def update_doctor(
    doctor_id: int,
    body: schemas.DoctorUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    doctor = db.query(models.Doctor).filter_by(id=doctor_id).first()
    if not doctor:
        raise HTTPException(404, "Doctor not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(doctor, k, v)
    db.commit()
    db.refresh(doctor)
    return doctor


@router.delete("/{doctor_id}", status_code=204)
def delete_doctor(
    doctor_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    doctor = db.query(models.Doctor).filter_by(id=doctor_id).first()
    if not doctor:
        raise HTTPException(404, "Doctor not found")
    # Soft-delete
    doctor.status = "Archived"
    db.commit()
