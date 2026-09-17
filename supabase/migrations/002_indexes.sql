-- ============================================================
-- 002_indexes.sql — Performance indexes
-- ============================================================

create index if not exists idx_patients_therapist    on public.patients(therapist_id);
create index if not exists idx_patients_status        on public.patients(status);
create index if not exists idx_appointments_date      on public.appointments(date);
create index if not exists idx_appointments_therapist on public.appointments(therapist_id);
create index if not exists idx_appointments_patient   on public.appointments(patient_id);
create index if not exists idx_appointments_status    on public.appointments(status);
create index if not exists idx_sessions_patient       on public.sessions(patient_id);
create index if not exists idx_sessions_therapist     on public.sessions(therapist_id);
create index if not exists idx_sessions_date          on public.sessions(date);
create index if not exists idx_exercises_category     on public.exercises(category);
create index if not exists idx_exercises_body_part    on public.exercises(body_part);
