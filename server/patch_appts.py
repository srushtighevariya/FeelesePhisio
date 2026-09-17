"""
patch_appts.py — Add more realistic appointments (today + tomorrow) for demo.
Run: python patch_appts.py
"""
import sys, os
from datetime import date, timedelta

sys.path.insert(0, os.path.dirname(__file__))
from database import engine, SessionLocal
import models

today = date.today().isoformat()
tomorrow = (date.today() + timedelta(days=1)).isoformat()

def patch():
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        existing_count = db.query(models.Appointment).count()
        
        # Only add if there are 4 or fewer (original seed)
        if existing_count <= 4:
            extra = [
                # More today
                dict(patient_id=9,  doctor_id=2, date=today,     time="15:30",
                     treatment_type="Hydrotherapy",         status="Scheduled",
                     notes="Pool session, 30 min."),
                dict(patient_id=15, doctor_id=1, date=today,     time="16:00",
                     treatment_type="Manual Therapy",        status="Scheduled",
                     notes="Follow-up after missed session."),
                # Tomorrow appointments
                dict(patient_id=12, doctor_id=1, date=tomorrow,  time="09:30",
                     treatment_type="Strength Training",     status="Scheduled",
                     notes="Continue isometrics program."),
                dict(patient_id=13, doctor_id=1, date=tomorrow,  time="11:00",
                     treatment_type="Gait Training",         status="Scheduled",
                     notes="Check walking pattern."),
                dict(patient_id=14, doctor_id=2, date=tomorrow,  time="10:00",
                     treatment_type="Stretching & Mobilization", status="Scheduled",
                     notes="Shoulder ROM progress check."),
                dict(patient_id=9,  doctor_id=2, date=tomorrow,  time="14:30",
                     treatment_type="Electrotherapy",        status="Scheduled",
                     notes="TENS for pain relief."),
            ]
            for a in extra:
                db.add(models.Appointment(**a))
            db.commit()
            print(f"[OK] Added {len(extra)} appointments. Total now: {db.query(models.Appointment).count()}")
        else:
            print(f"[SKIP] Appointments already have {existing_count} rows — skipping patch.")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    patch()
