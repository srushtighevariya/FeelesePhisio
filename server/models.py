"""
models.py — SQLAlchemy ORM table definitions for Recovery Path.
"""
from datetime import date
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, Date, ForeignKey, Text
)
from sqlalchemy.orm import relationship
from database import Base


# ---------------------------------------------------------------------------
# Users (auth)
# ---------------------------------------------------------------------------
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False)          # "admin" | "therapist"
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=True)
    name = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)

    doctor = relationship("Doctor", back_populates="user", foreign_keys=[doctor_id])


# ---------------------------------------------------------------------------
# Doctors
# ---------------------------------------------------------------------------
class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True)
    name = Column(String, nullable=False)
    specialization = Column(String)
    phone = Column(String)
    email = Column(String)
    available_days = Column(String)
    status = Column(String, default="Active")    # "Active" | "On Leave"

    user = relationship("User", back_populates="doctor", foreign_keys="User.doctor_id")
    patients = relationship("Patient", back_populates="doctor")
    appointments = relationship("Appointment", back_populates="doctor")


# ---------------------------------------------------------------------------
# Patients
# ---------------------------------------------------------------------------
class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True)
    name = Column(String, nullable=False)
    age = Column(Integer)
    gender = Column(String)
    phone = Column(String)
    email = Column(String)
    address = Column(Text)
    emergency_contact = Column(String)
    occupation = Column(String)
    referred_by = Column(String)
    medical_history = Column(Text)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=True)
    registration_date = Column(String)  # ISO date string "YYYY-MM-DD"
    status = Column(String, default="New")  # "New" | "Ongoing" | "Discharged" | "Archived"

    doctor = relationship("Doctor", back_populates="patients")
    assessment = relationship("Assessment", uselist=False, back_populates="patient", cascade="all, delete-orphan")
    treatment_plan = relationship("TreatmentPlan", uselist=False, back_populates="patient", cascade="all, delete-orphan")
    sessions = relationship("Session", back_populates="patient", cascade="all, delete-orphan", order_by="Session.date")
    appointments = relationship("Appointment", back_populates="patient")


# ---------------------------------------------------------------------------
# Assessment (one-to-one with Patient)
# ---------------------------------------------------------------------------
class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), unique=True, nullable=False)
    main_complaint = Column(Text)
    body_part = Column(String)
    onset = Column(String)
    pain_level = Column(Integer, default=0)
    pain_type = Column(String)
    range_of_motion = Column(String)
    muscle_strength = Column(String)
    posture = Column(String)
    diagnosis = Column(Text)

    patient = relationship("Patient", back_populates="assessment")


# ---------------------------------------------------------------------------
# Treatment Plan (one-to-one with Patient)
# ---------------------------------------------------------------------------
class TreatmentPlan(Base):
    __tablename__ = "treatment_plans"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), unique=True, nullable=False)
    start_date = Column(String)
    end_date = Column(String)
    planned_sessions = Column(Integer, default=10)

    patient = relationship("Patient", back_populates="treatment_plan")
    items = relationship("TreatmentItem", back_populates="plan", cascade="all, delete-orphan")


class TreatmentItem(Base):
    __tablename__ = "treatment_items"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("treatment_plans.id"), nullable=False)
    treatment = Column(String, nullable=False)
    frequency = Column(String)
    duration = Column(String)

    plan = relationship("TreatmentPlan", back_populates="items")


# ---------------------------------------------------------------------------
# Sessions (therapy sessions, many-to-one with Patient)
# ---------------------------------------------------------------------------
class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    date = Column(String)    # "YYYY-MM-DD"
    pain_before = Column(Integer)
    pain_after = Column(Integer)
    treatment_given = Column(String)
    duration = Column(Integer)   # minutes
    notes = Column(Text)

    patient = relationship("Patient", back_populates="sessions")


# ---------------------------------------------------------------------------
# Appointments
# ---------------------------------------------------------------------------
class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    date = Column(String)    # "YYYY-MM-DD"
    time = Column(String)    # "HH:MM"
    treatment_type = Column(String)
    status = Column(String, default="Scheduled")
    # "Scheduled" | "Completed" | "Missed" | "Cancelled"
    notes = Column(Text)

    patient = relationship("Patient", back_populates="appointments")
    doctor = relationship("Doctor", back_populates="appointments")


# ---------------------------------------------------------------------------
# Exercise Library
# ---------------------------------------------------------------------------
class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    body_part = Column(String)
    category = Column(String)
    description = Column(Text)
    sets = Column(Integer, nullable=True)
    reps = Column(Integer, nullable=True)
    duration = Column(String, nullable=True)   # e.g. "30 sec"
    level = Column(String)
    is_active = Column(Boolean, default=True)
