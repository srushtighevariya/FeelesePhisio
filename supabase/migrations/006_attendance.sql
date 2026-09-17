-- ============================================================
-- 006_attendance.sql — Therapist attendance records
-- ============================================================

create table if not exists public.attendance (
  id           uuid primary key default gen_random_uuid(),
  therapist_id uuid not null references public.therapists(id) on delete cascade,
  date         date not null,
  check_in     time,
  check_out    time,
  status       text not null default 'Absent'
               check (status in ('Present','Half-Day','Leave','Absent')),
  hours_worked numeric(4,2),
  notes        text,
  created_at   timestamptz not null default now(),
  unique (therapist_id, date)
);

create index if not exists idx_attendance_date      on public.attendance(date);
create index if not exists idx_attendance_therapist on public.attendance(therapist_id);

-- RLS
alter table public.attendance enable row level security;

create policy "attendance_select_admin" on public.attendance for select
  using (public.current_user_role() = 'admin');

create policy "attendance_select_therapist" on public.attendance for select
  using (therapist_id = public.current_therapist_id());

create policy "attendance_insert_admin" on public.attendance for insert
  with check (public.current_user_role() = 'admin');

create policy "attendance_update_admin" on public.attendance for update
  using (public.current_user_role() = 'admin');
