"""
seed.py — Populate the database with demo data matching App.jsx mock data.
Run once: python seed.py  (safe to re-run; skips existing records)
"""
import sys
import os
from datetime import date

# Make sure we can import project modules
sys.path.insert(0, os.path.dirname(__file__))

from database import engine, SessionLocal
import models
from auth import hash_password

today = date.today().isoformat()


def seed():
    # Create all tables
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # ------------------------------------------------------------------ #
        # Doctors                                                             #
        # ------------------------------------------------------------------ #
        doctors_data = [
            dict(id=1, code="DR001", name="Dr. Sara Iqbal", specialization="Sports Rehabilitation",
                 phone="+91 98765 10001", email="sara.iqbal@sunrisephysio.com",
                 available_days="Mon–Fri", status="Active"),
            dict(id=2, code="DR002", name="Dr. Ali Rahman", specialization="Orthopedic Physio",
                 phone="+91 98765 10002", email="ali.rahman@sunrisephysio.com",
                 available_days="Mon–Sat", status="Active"),
            dict(id=3, code="DR003", name="Dr. Neha Kapoor", specialization="Post-Surgical Rehab",
                 phone="+91 98765 10003", email="neha.kapoor@sunrisephysio.com",
                 available_days="Tue–Sat", status="Active"),
            dict(id=4, code="DR004", name="Dr. Vikram Shah", specialization="Geriatric Physio",
                 phone="+91 98765 10004", email="vikram.shah@sunrisephysio.com",
                 available_days="Mon, Wed, Fri", status="On Leave"),
        ]
        for d in doctors_data:
            if not db.query(models.Doctor).filter_by(code=d["code"]).first():
                db.add(models.Doctor(**d))
        db.flush()

        # ------------------------------------------------------------------ #
        # Users                                                               #
        # ------------------------------------------------------------------ #
        users_data = [
            dict(username="admin",   password="admin123", role="admin",     name="Priya Shah",    doctor_id=None),
            dict(username="dr.sara", password="sara123",  role="therapist", name="Dr. Sara Iqbal", doctor_id=1),
            dict(username="dr.ali",  password="ali123",   role="therapist", name="Dr. Ali Rahman", doctor_id=2),
        ]
        for u in users_data:
            if not db.query(models.User).filter_by(username=u["username"]).first():
                db.add(models.User(
                    username=u["username"],
                    hashed_password=hash_password(u["password"]),
                    role=u["role"],
                    name=u["name"],
                    doctor_id=u["doctor_id"],
                ))
        db.flush()

        # ------------------------------------------------------------------ #
        # Patients                                                            #
        # ------------------------------------------------------------------ #
        patients_data = [
            dict(id=12, code="PT0012", name="Ayesha Khan",    age=24, gender="Female",
                 phone="+91 98765 43210", email="ayesha.khan@mail.com",
                 address="B-14, Vastrapur, Ahmedabad",
                 emergency_contact="Imran Khan · +91 98700 11223",
                 occupation="Software Engineer",
                 referred_by="Dr. Neha Patel (Orthopedic)",
                 medical_history="No prior surgeries; mild scoliosis noted",
                 doctor_id=1, registration_date="2026-08-10", status="Ongoing"),

            dict(id=13, code="PT0013", name="Rahul Verma",    age=31, gender="Male",
                 phone="+91 98765 43211", email="rahul.verma@mail.com",
                 address="Satellite, Ahmedabad",
                 emergency_contact="Priya Verma · +91 98700 11224",
                 occupation="Accountant", referred_by="Self",
                 medical_history="Meniscus tear, non-surgical",
                 doctor_id=1, registration_date="2026-08-05", status="Ongoing"),

            dict(id=14, code="PT0014", name="Meera Nair",     age=45, gender="Female",
                 phone="+91 98765 43212", email="meera.nair@mail.com",
                 address="Bodakdev, Ahmedabad",
                 emergency_contact="Suresh Nair · +91 98700 11225",
                 occupation="Teacher", referred_by="Dr. Ali Rahman",
                 medical_history="Frozen shoulder, right side",
                 doctor_id=2, registration_date="2026-08-18", status="New"),

            dict(id=15, code="PT0015", name="Farhan Sheikh",  age=52, gender="Male",
                 phone="+91 98765 43213", email="farhan.sheikh@mail.com",
                 address="Navrangpura, Ahmedabad",
                 emergency_contact="Ayaan Sheikh · +91 98700 11226",
                 occupation="Business Owner", referred_by="Dr. Neha Patel",
                 medical_history="Post ACL-surgery rehabilitation",
                 doctor_id=1, registration_date="2026-07-28", status="Ongoing"),

            dict(id=9,  code="PT0009", name="Zoya Ahmed",     age=27, gender="Female",
                 phone="+91 98765 43214", email="zoya.ahmed@mail.com",
                 address="Maninagar, Ahmedabad",
                 emergency_contact="Kabir Ahmed · +91 98700 11227",
                 occupation="Athlete (Amateur)", referred_by="Self",
                 medical_history="Hamstring strain",
                 doctor_id=2, registration_date="2026-06-20", status="Discharged"),
        ]
        for p in patients_data:
            if not db.query(models.Patient).filter_by(code=p["code"]).first():
                db.add(models.Patient(**p))
        db.flush()

        # ------------------------------------------------------------------ #
        # Assessments                                                         #
        # ------------------------------------------------------------------ #
        assessments_data = [
            dict(patient_id=12, main_complaint="Chronic lower back pain", body_part="Lumbar Spine",
                 onset="Started ~3 weeks ago", pain_level=8,
                 pain_type="Dull, occasional sharp on bending",
                 range_of_motion="Restricted forward flexion (60%)",
                 muscle_strength="Core strength 3/5",
                 posture="Forward-leaning, slight pelvic tilt",
                 diagnosis="Mechanical Lower Back Pain (Non-specific)"),

            dict(patient_id=13, main_complaint="Right knee pain on flexion", body_part="Right Knee",
                 onset="6 weeks ago, gym injury", pain_level=6,
                 pain_type="Sharp on stairs, dull otherwise",
                 range_of_motion="Flexion limited to 90°",
                 muscle_strength="Quadriceps 3/5", posture="Normal gait",
                 diagnosis="Meniscus strain, conservative management"),

            dict(patient_id=14, main_complaint="Right shoulder stiffness and pain",
                 body_part="Right Shoulder", onset="2 months, gradual", pain_level=7,
                 pain_type="Dull ache, sharp on overhead reach",
                 range_of_motion="Abduction limited to 70°",
                 muscle_strength="Deltoid 3/5",
                 posture="Slight right shoulder elevation",
                 diagnosis="Adhesive Capsulitis (Frozen Shoulder Phase 1)"),

            dict(patient_id=15, main_complaint="Post-surgical knee weakness",
                 body_part="Left Knee", onset="Surgery 6 weeks ago", pain_level=4,
                 pain_type="Dull, worse with weight-bearing",
                 range_of_motion="Flexion 100°, improving",
                 muscle_strength="Quadriceps 2/5", posture="Guarded gait, mild limp",
                 diagnosis="Post-ACL Reconstruction Rehabilitation (Phase 2)"),

            dict(patient_id=9, main_complaint="Left hamstring tightness and pain",
                 body_part="Left Hamstring", onset="Sports injury, sprinting", pain_level=6,
                 pain_type="Sharp on stretch, dull at rest",
                 range_of_motion="Straight leg raise 60°",
                 muscle_strength="Hamstring 3/5", posture="Normal",
                 diagnosis="Grade I Hamstring Strain — Fully Recovered"),
        ]
        for a in assessments_data:
            if not db.query(models.Assessment).filter_by(patient_id=a["patient_id"]).first():
                db.add(models.Assessment(**a))
        db.flush()

        # ------------------------------------------------------------------ #
        # Treatment Plans + Items                                             #
        # ------------------------------------------------------------------ #
        plans_data = [
            dict(patient_id=12, start_date="2026-08-15", end_date="2026-10-10",
                 planned_sessions=10,
                 items=[
                     ("Stretching exercises", "3× weekly", "15 min"),
                     ("Core Strength training", "2× weekly", "20 min"),
                     ("Manual therapy", "2× weekly", "15 min"),
                     ("Heat therapy", "2× weekly", "10 min"),
                 ]),
            dict(patient_id=13, start_date="2026-08-06", end_date="2026-09-20",
                 planned_sessions=10,
                 items=[
                     ("Quadriceps strengthening", "3× weekly", "20 min"),
                     ("Knee Mobilization", "1× weekly", "15 min"),
                 ]),
            dict(patient_id=14, start_date="2026-08-19", end_date="2026-11-01",
                 planned_sessions=8,
                 items=[
                     ("Capsular stretching", "3× weekly", "15 min"),
                     ("Scapular stabilization", "2× weekly", "20 min"),
                 ]),
            dict(patient_id=15, start_date="2026-07-29", end_date="2026-10-15",
                 planned_sessions=10,
                 items=[
                     ("Closed kinetic chain strength", "3× weekly", "25 min"),
                     ("Cryotherapy", "2× weekly", "10 min"),
                 ]),
            dict(patient_id=9, start_date="2026-06-21", end_date="2026-08-01",
                 planned_sessions=10,
                 items=[
                     ("Eccentric hamstring curls", "4× weekly", "15 min"),
                     ("Dynamic mobility", "3× weekly", "20 min"),
                 ]),
        ]
        for p in plans_data:
            if not db.query(models.TreatmentPlan).filter_by(patient_id=p["patient_id"]).first():
                plan = models.TreatmentPlan(
                    patient_id=p["patient_id"],
                    start_date=p["start_date"],
                    end_date=p["end_date"],
                    planned_sessions=p["planned_sessions"],
                )
                db.add(plan)
                db.flush()
                for treatment, frequency, duration in p["items"]:
                    db.add(models.TreatmentItem(
                        plan_id=plan.id,
                        treatment=treatment,
                        frequency=frequency,
                        duration=duration,
                    ))
        db.flush()

        # ------------------------------------------------------------------ #
        # Sessions                                                            #
        # ------------------------------------------------------------------ #
        sessions_data = [
            # PT0012 Ayesha
            dict(patient_id=12, date="2026-08-14", pain_before=8, pain_after=6,
                 treatment_given="Manual therapy + Heat pack", duration=40,
                 notes="Mild soreness post-session, advised ice at home."),
            dict(patient_id=12, date="2026-08-17", pain_before=6, pain_after=4,
                 treatment_given="Lumbar Mobilization + Stretching", duration=40,
                 notes="Good response, ROM improving steadily."),
            dict(patient_id=12, date="2026-08-20", pain_before=5, pain_after=3,
                 treatment_given="Core activation + McKenzie extension", duration=45,
                 notes="Patient reported improved comfort while sitting at desk."),
            # PT0013 Rahul
            dict(patient_id=13, date="2026-08-08", pain_before=6, pain_after=5,
                 treatment_given="Knee Mobilization + Ice", duration=35, notes="Baseline session."),
            dict(patient_id=13, date="2026-08-13", pain_before=5, pain_after=4,
                 treatment_given="Isometrics + Quad Sets", duration=30,
                 notes="Tolerating resistance work well."),
            dict(patient_id=13, date="2026-08-19", pain_before=4, pain_after=3,
                 treatment_given="Step downs + hamstring stretch", duration=30,
                 notes="Improved stair climbing tolerance."),
            # PT0014 Meera
            dict(patient_id=14, date="2026-08-19", pain_before=7, pain_after=6,
                 treatment_given="Gentle pendulum + heat", duration=30,
                 notes="First session, gentle mobilization."),
            # PT0015 Farhan
            dict(patient_id=15, date="2026-08-01", pain_before=6, pain_after=5,
                 treatment_given="Gentle ROM + Cryotherapy", duration=35,
                 notes="Early stage rehab."),
            dict(patient_id=15, date="2026-08-08", pain_before=5, pain_after=4,
                 treatment_given="Mini squats + balance board", duration=35,
                 notes="Progressing well."),
            dict(patient_id=15, date="2026-08-15", pain_before=4, pain_after=3,
                 treatment_given="Leg press + gait training", duration=40,
                 notes="Weight-bearing improving steadily."),
            # PT0009 Zoya
            dict(patient_id=9, date="2026-06-22", pain_before=6, pain_after=5,
                 treatment_given="Stretching & soft tissue work", duration=30, notes="Baseline."),
            dict(patient_id=9, date="2026-07-05", pain_before=4, pain_after=2,
                 treatment_given="Strength training + agility drills", duration=30,
                 notes="Good progress."),
            dict(patient_id=9, date="2026-07-30", pain_before=1, pain_after=0,
                 treatment_given="Final discharge test & plyometrics", duration=20,
                 notes="Full recovery, pain 0/10, discharged."),
        ]
        # Only seed sessions if none exist yet (avoid duplicates on re-run)
        if db.query(models.Session).count() == 0:
            for s in sessions_data:
                db.add(models.Session(**s))
        db.flush()

        # ------------------------------------------------------------------ #
        # Appointments                                                        #
        # ------------------------------------------------------------------ #
        appointments_data = [
            dict(patient_id=12, doctor_id=1, date=today, time="09:00",
                 treatment_type="Manual Therapy", status="Completed",
                 notes="Patient reported better lumbar mobility."),
            dict(patient_id=13, doctor_id=1, date=today, time="10:30",
                 treatment_type="Strength Training", status="Scheduled",
                 notes="Focus on quad isometrics."),
            dict(patient_id=14, doctor_id=2, date=today, time="11:45",
                 treatment_type="Stretching & Mobilization", status="Scheduled",
                 notes="Shoulder abduction progress check."),
            dict(patient_id=15, doctor_id=1, date=today, time="14:00",
                 treatment_type="Cryotherapy & Gait", status="Missed",
                 notes="Follow up for rescheduling."),
        ]
        if db.query(models.Appointment).count() == 0:
            for a in appointments_data:
                db.add(models.Appointment(**a))
        db.flush()

        # ------------------------------------------------------------------ #
        # Exercise Library                                                    #
        # ------------------------------------------------------------------ #
        exercises_data = [
            dict(name="Knee Extension", body_part="Knee / Quads", category="Strength",
                 description="Seated, extend knee fully and hold 3 seconds.",
                 sets=3, reps=12, duration=None, level="Beginner"),
            dict(name="Straight Leg Raises", body_part="Hip / Core", category="Stability",
                 description="Lying flat, raise leg to 45° keeping it straight.",
                 sets=3, reps=10, duration=None, level="Beginner"),
            dict(name="Hamstring Active Stretch", body_part="Hamstring", category="Mobility",
                 description="Seated forward fold, gentle stretch only.",
                 sets=3, reps=None, duration="30 sec", level="All Levels"),
            dict(name="Scapular Wall Slides", body_part="Shoulder", category="Mobility",
                 description="Slow controlled slides up wall keeping forearms flush.",
                 sets=2, reps=15, duration=None, level="Intermediate"),
            dict(name="Cervical Retraction (Chin Tucks)", body_part="Neck / Cervical",
                 category="Posture",
                 description="Gently retract head back without tilting down.",
                 sets=4, reps=10, duration="5 sec hold", level="Beginner"),
            dict(name="Bird Dog Core Exercise", body_part="Core / Lumbar", category="Strength",
                 description="Opposite arm/leg extension on all-fours.",
                 sets=3, reps=10, duration=None, level="Intermediate"),
        ]
        if db.query(models.Exercise).count() == 0:
            for e in exercises_data:
                db.add(models.Exercise(**e))

        db.commit()
        print("[OK] Database seeded successfully!")

    except Exception as exc:
        db.rollback()
        print(f"[ERROR] Seed failed: {exc}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
