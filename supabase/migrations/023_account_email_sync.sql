-- NextPass update 023: changing your sign-in email
-- Paste into Supabase -> SQL Editor -> New query -> Run. Safe to run more than once.
-- Account -> Your details lets anyone change their sign-in email (Supabase emails a link to
-- confirm it). College coaches and pro scouts show their email to families, so once the new
-- address is confirmed it is copied to their college or scout details too.

create or replace function public.sync_contact_email() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.email is distinct from old.email and new.email is not null then
    update public.college_coaches set email = lower(new.email) where id = new.id;
    update public.pro_scouts      set email = lower(new.email) where id = new.id;
  end if;
  return new;
end $$;

drop trigger if exists nextpass_sync_contact_email on auth.users;
create trigger nextpass_sync_contact_email after update of email on auth.users
  for each row execute function public.sync_contact_email();
