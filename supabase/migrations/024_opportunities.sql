-- NextPass update 024: recruiting opportunities
-- Paste into Supabase -> SQL Editor -> New query -> Run. Safe to run more than once.
-- Club coaches and college coaches list tryouts, combines, showcases, ID camps and other
-- opportunities. Every signed-in family, player and coach sees them under Recruiting.
-- The host shown on a listing is always the lister's own club or college, set by the database.

create table if not exists public.opportunities (
  id          uuid primary key default gen_random_uuid(),
  created_by  uuid not null default auth.uid() references auth.users(id) on delete cascade,
  club_id     uuid references public.clubs(id) on delete cascade,     -- null for a college coach
  host        text not null default '' check (char_length(host) <= 160),
  kind        text not null check (kind in ('tryout','combine','showcase','id_camp','camp','other')),
  title       text not null check (char_length(title) between 1 and 100),
  starts_on   date not null,
  ends_on     date,
  time_note   text not null default '' check (char_length(time_note) <= 60),
  location    text not null check (char_length(location) between 1 and 160),
  ages        text not null default '' check (char_length(ages) <= 60),
  gender      text not null default 'Any' check (gender in ('Boys','Girls','Any')),
  cost        text not null default '' check (char_length(cost) <= 40),
  link        text not null default '' check (char_length(link) <= 300 and (link = '' or link ~* '^https?://[^ ]+$')),
  contact     text not null default '' check (char_length(contact) <= 120),
  details     text not null default '' check (char_length(details) <= 1500),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint opportunities_dates check (ends_on is null or ends_on >= starts_on)
);
create index if not exists opportunities_starts on public.opportunities (starts_on);

-- the host comes from who is listing: a club coach's club, or a college coach's school
create or replace function public.opportunities_fill() returns trigger
language plpgsql security definer set search_path = public as $$
declare cc record;
begin
  if tg_op = 'UPDATE' then new.created_by := old.created_by; new.created_at := old.created_at; end if;
  select * into cc from public.college_coaches where id = new.created_by;
  if found then
    new.club_id := null;
    new.host := trim(cc.school || case when coalesce(cc.program, '') <> '' then ' · ' || cc.program else '' end);
  else
    new.club_id := (select club_id from public.members where id = new.created_by and role in ('admin','coach'));
    new.host := coalesce((select name from public.clubs where id = new.club_id), '');
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists opportunities_fill on public.opportunities;
create trigger opportunities_fill before insert or update on public.opportunities
  for each row execute function public.opportunities_fill();

-- may the signed-in person list opportunities? (club coaches and college coaches)
create or replace function public.can_list_opportunities() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.members where id = auth.uid() and role in ('admin','coach') and club_id is not null)
      or exists (select 1 from public.college_coaches where id = auth.uid())
$$;

alter table public.opportunities enable row level security;
drop policy if exists opps_read on public.opportunities;
create policy opps_read on public.opportunities for select to authenticated using (true);
drop policy if exists opps_insert on public.opportunities;
create policy opps_insert on public.opportunities for insert to authenticated
  with check (created_by = auth.uid() and can_list_opportunities() and host <> '');
drop policy if exists opps_update on public.opportunities;
create policy opps_update on public.opportunities for update to authenticated
  using (created_by = auth.uid()) with check (created_by = auth.uid() and can_list_opportunities() and host <> '');
drop policy if exists opps_delete on public.opportunities;
create policy opps_delete on public.opportunities for delete to authenticated
  using (created_by = auth.uid() or (club_id is not null and club_id = my_club() and is_admin()));

grant select, insert, update, delete on public.opportunities to authenticated;

do $$ begin
  begin alter publication supabase_realtime add table public.opportunities; exception when duplicate_object then null; when undefined_object then null; end;
end $$;
