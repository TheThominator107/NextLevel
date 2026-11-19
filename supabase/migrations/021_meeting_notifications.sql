-- NextPass update 021: meeting notifications
-- Paste into Supabase -> SQL Editor -> New query -> Run. Safe to run more than once.
-- Records who last changed each meeting, so the other side gets the notification
-- ("Coach scheduled your meeting") and nobody is notified about their own change.

alter table public.meetings add column if not exists updated_by uuid references auth.users(id) on delete set null;

create or replace function public.meetings_touch() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.updated_by := coalesce(auth.uid(), new.updated_by, new.created_by);
  return new;
end $$;

drop trigger if exists meetings_touch on public.meetings;
create trigger meetings_touch before insert or update on public.meetings
  for each row execute function public.meetings_touch();

-- Done. You should see "Success. No rows returned".
