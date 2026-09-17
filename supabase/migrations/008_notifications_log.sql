-- ============================================================
-- 008_notifications_log.sql — Notification send log
-- ============================================================

create table if not exists public.notification_log (
  id           uuid primary key default gen_random_uuid(),
  type         text not null,   -- 'WhatsApp' | 'SMS' | 'Reminder'
  patient_id   uuid references public.patients(id) on delete set null,
  therapist_id uuid references public.therapists(id) on delete set null,
  message      text,
  sent_at      timestamptz not null default now()
);

create index if not exists idx_notif_sent_at on public.notification_log(sent_at desc);

-- RLS — admin only
alter table public.notification_log enable row level security;

create policy "notif_select_admin" on public.notification_log for select
  using (public.current_user_role() = 'admin');

create policy "notif_insert_admin" on public.notification_log for insert
  with check (public.current_user_role() = 'admin');
