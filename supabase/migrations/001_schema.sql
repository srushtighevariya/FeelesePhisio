-- ============================================================
-- 001_schema.sql
-- Core tables: users, therapists, patients, appointments,
--              sessions, assessments, treatment_plans, exercises
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ── users (mirrors auth.users with role) ──────────────────
create table if not exists public.users (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  name       text not null,
  role       text not null check (role in ('admin','therapist')) default 'therapist',
  created_at timestamptz not null default now()
);

-- ── therapists ────────────────────────────────────────────
create table if not exists public.therapists (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references public.users(id) on delete set null,
  name          text not null,
  specialty     text,
  phone         text,
  email         text,
  patient_count int not null default 0,
  created_at    timestamptz not null default now()
);

-- ── patients ──────────────────────────────────────────────
create table if not exists public.patients (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  age          int,
  gender       text,
  phone        text,
  email        text,
  diagnosis    text,
  status       text not null default 'Active' check (status in ('Active','Ongoing','Completed','Discharged','New')),
  therapist_id uuid references public.therapists(id) on delete set null,
  address      text,
  emergency_contact text,
  referred_by  text,
  created_at   timestamptz not null default now()
);

-- ── appointments ──────────────────────────────────────────
create table if not exists public.appointments (
  id           uuid primary key default gen_random_uuid(),
  patient_id   uuid not null references public.patients(id) on delete cascade,
  therapist_id uuid not null references public.therapists(id) on delete cascade,
  date         date not null,
  time         time,
  type         text,
  status       text not null default 'Scheduled' check (status in ('Scheduled','Completed','Missed','Cancelled')),
  notes        text,
  created_at   timestamptz not null default now()
);

-- ── sessions ──────────────────────────────────────────────
create table if not exists public.sessions (
  id           uuid primary key default gen_random_uuid(),
  patient_id   uuid not null references public.patients(id) on delete cascade,
  therapist_id uuid not null references public.therapists(id) on delete cascade,
  date         date not null default current_date,
  type         text,
  pain_before  smallint check (pain_before between 0 and 10),
  pain_after   smallint check (pain_after  between 0 and 10),
  notes        text,
  created_at   timestamptz not null default now()
);

-- ── assessments ───────────────────────────────────────────
create table if not exists public.assessments (
  id                uuid primary key default gen_random_uuid(),
  patient_id        uuid not null unique references public.patients(id) on delete cascade,
  chief_complaint   text,
  history           text,
  diagnosis         text,
  contraindications text,
  goals             text,
  updated_at        timestamptz not null default now()
);

-- ── treatment_plans ───────────────────────────────────────
create table if not exists public.treatment_plans (
  id         uuid primary key default gen_random_uuid(),
  patient_id uuid not null unique references public.patients(id) on delete cascade,
  start_date date,
  end_date   date,
  items      jsonb not null default '[]',
  updated_at timestamptz not null default now()
);

-- ── exercises ─────────────────────────────────────────────
create table if not exists public.exercises (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  category     text,
  body_part    text,
  sets         int,
  reps         int,
  duration_min int,
  level        text check (level in ('Beginner','Intermediate','Advanced')),
  description  text,
  created_at   timestamptz not null default now()
);
