"""
routers/exercises.py — Exercise Library CRUD.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

import models
import schemas
from auth import get_current_user
from database import get_db

router = APIRouter(prefix="/api/exercise-library", tags=["exercises"])


@router.get("", response_model=List[schemas.ExerciseOut])
def list_exercises(
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    q = db.query(models.Exercise).filter(models.Exercise.is_active == True)
    if category:
        q = q.filter(models.Exercise.category == category)
    return q.order_by(models.Exercise.name).all()


@router.post("", response_model=schemas.ExerciseOut, status_code=201)
def create_exercise(
    body: schemas.ExerciseCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    exercise = models.Exercise(**body.model_dump())
    db.add(exercise)
    db.commit()
    db.refresh(exercise)
    return exercise


@router.get("/{exercise_id}", response_model=schemas.ExerciseOut)
def get_exercise(
    exercise_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    exercise = db.query(models.Exercise).filter_by(id=exercise_id, is_active=True).first()
    if not exercise:
        raise HTTPException(404, "Exercise not found")
    return exercise


@router.put("/{exercise_id}", response_model=schemas.ExerciseOut)
def update_exercise(
    exercise_id: int,
    body: schemas.ExerciseUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    exercise = db.query(models.Exercise).filter_by(id=exercise_id, is_active=True).first()
    if not exercise:
        raise HTTPException(404, "Exercise not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(exercise, k, v)
    db.commit()
    db.refresh(exercise)
    return exercise


@router.delete("/{exercise_id}", status_code=204)
def delete_exercise(
    exercise_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    exercise = db.query(models.Exercise).filter_by(id=exercise_id, is_active=True).first()
    if not exercise:
        raise HTTPException(404, "Exercise not found")
    exercise.is_active = False   # soft-delete
    db.commit()
