-- ============================================================
-- 005_auto_therapist_trigger.sql
-- Auto-provisions a therapists row on new user signup when
-- the role is 'therapist'. The trigger fires after insert
-- into public.users (which the client creates after auth).
-- ============================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  if new.role = 'therapist' then
    insert into public.therapists (user_id, name, email)
    values (new.id, new.name, new.email)
    on conflict do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_user_created on public.users;

create trigger on_user_created
  after insert on public.users
  for each row execute procedure public.handle_new_user();
