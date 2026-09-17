-- ============================================================
-- 007_monthly_reports.sql — Monthly staff report drafts
-- ============================================================

create table if not exists public.monthly_reports (
  id               uuid primary key default gen_random_uuid(),
  therapist_id     uuid not null references public.therapists(id) on delete cascade,
  month            text not null,   -- format: "2025-08"
  clinical_learning text,
  google_reviews   int default 0,
  video_patients   int default 0,
  success_stories  text,
  remark           text,
  saved_at         timestamptz not null default now(),
  unique (therapist_id, month)
);

create index if not exists idx_reports_therapist on public.monthly_reports(therapist_id);
create index if not exists idx_reports_month     on public.monthly_reports(month);

-- RLS
alter table public.monthly_reports enable row level security;

create policy "reports_select_admin" on public.monthly_reports for select
  using (public.current_user_role() = 'admin');

create policy "reports_select_therapist" on public.monthly_reports for select
  using (therapist_id = public.current_therapist_id());

create policy "reports_upsert_admin" on public.monthly_reports for all
  using (public.current_user_role() = 'admin');
