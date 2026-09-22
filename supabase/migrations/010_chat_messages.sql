-- 010_chat_messages.sql
-- Real-time chat between admin and therapists, and therapist-to-therapist
-- sender_id / receiver_id are text to allow admin participation without a therapists row

create table if not exists public.chat_messages (
  id            uuid primary key default gen_random_uuid(),
  sender_id     text not null,
  receiver_id   text,
  room_id       text not null,
  message       text not null,
  is_read       boolean not null default false,
  admin_sender  boolean not null default false,
  created_at    timestamptz not null default now()
);

create index if not exists idx_chat_room on public.chat_messages(room_id, created_at);
create index if not exists idx_chat_receiver on public.chat_messages(receiver_id, is_read);

alter table public.chat_messages enable row level security;

create policy "Authenticated users can read chat messages"
  on public.chat_messages for select
  using (auth.uid() is not null);

create policy "Authenticated users can send messages"
  on public.chat_messages for insert
  with check (auth.uid() is not null);

create policy "Authenticated users can update read status"
  on public.chat_messages for update
  using (auth.uid() is not null)
  with check (auth.uid() is not null);
