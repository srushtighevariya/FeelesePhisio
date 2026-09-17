-- ============================================================
-- 003_rls.sql — Row Level Security policies
-- ============================================================

-- Helper: get the current user's role
create or replace function public.current_user_role()
returns text language sql stable security definer as $$
  select role from public.users where id = auth.uid();
$$;

-- Helper: get the current user's therapist id
create or replace function public.current_therapist_id()
returns uuid language sql stable security definer as $$
  select id from public.therapists where user_id = auth.uid();
$$;

-- ── users ─────────────────────────────────────────────────
alter table public.users enable row level security;
create policy "users_select_own" on public.users for select using (id = auth.uid());
create policy "users_select_admin" on public.users for select using (public.current_user_role() = 'admin');
create policy "users_update_own" on public.users for update using (id = auth.uid());

-- ── therapists ────────────────────────────────────────────
alter table public.therapists enable row level security;
create policy "therapists_select_all_auth" on public.therapists for select using (auth.uid() is not null);
create policy "therapists_insert_admin"    on public.therapists for insert with check (public.current_user_role() = 'admin');
create policy "therapists_update_admin"    on public.therapists for update using (public.current_user_role() = 'admin');
create policy "therapists_delete_admin"    on public.therapists for delete using (public.current_user_role() = 'admin');

-- ── patients ──────────────────────────────────────────────
alter table public.patients enable row level security;
create policy "patients_select_admin" on public.patients for select
  using (public.current_user_role() = 'admin');
create policy "patients_select_therapist" on public.patients for select
  using (therapist_id = public.current_therapist_id());
create policy "patients_insert" on public.patients for insert
  with check (auth.uid() is not null);
create policy "patients_update_admin" on public.patients for update
  using (public.current_user_role() = 'admin');
create policy "patients_update_therapist" on public.patients for update
  using (therapist_id = public.current_therapist_id());

-- ── appointments ──────────────────────────────────────────
alter table public.appointments enable row level security;
create policy "appts_select_admin" on public.appointments for select
  using (public.current_user_role() = 'admin');
create policy "appts_select_therapist" on public.appointments for select
  using (therapist_id = public.current_therapist_id());
create policy "appts_insert" on public.appointments for insert
  with check (auth.uid() is not null);
create policy "appts_update" on public.appointments for update
  using (public.current_user_role() = 'admin' or therapist_id = public.current_therapist_id());

-- ── sessions ──────────────────────────────────────────────
alter table public.sessions enable row level security;
create policy "sessions_select_admin" on public.sessions for select
  using (public.current_user_role() = 'admin');
create policy "sessions_select_therapist" on public.sessions for select
  using (therapist_id = public.current_therapist_id());
create policy "sessions_insert" on public.sessions for insert
  with check (auth.uid() is not null);

-- ── assessments & plans ───────────────────────────────────
alter table public.assessments enable row level security;
create policy "assess_select" on public.assessments for select using (auth.uid() is not null);
create policy "assess_upsert" on public.assessments for all using (auth.uid() is not null);

alter table public.treatment_plans enable row level security;
create policy "plans_select" on public.treatment_plans for select using (auth.uid() is not null);
create policy "plans_upsert" on public.treatment_plans for all using (auth.uid() is not null);

-- ── exercises ─────────────────────────────────────────────
alter table public.exercises enable row level security;
create policy "exercises_select" on public.exercises for select using (auth.uid() is not null);
create policy "exercises_insert" on public.exercises for insert with check (auth.uid() is not null);
