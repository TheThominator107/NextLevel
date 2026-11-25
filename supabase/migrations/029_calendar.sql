-- NextPass update 029: the calendar
-- Paste into Supabase -> SQL Editor -> New query -> Run. Safe to run more than once.
-- 1. Team sessions get a start time, a place and a "show on the team calendar" switch.
-- 2. Families see their team's calendar sessions (date, time, place, length and focus only;
--    never the coach's notes or drill plan) through team_calendar().
-- 3. Families schedule at-home sessions for their player. The family and the coaches of
--    the player's club can see them; only the family can add, change or delete them.

-- ---------- 1. team sessions: time, place, on the calendar ---------------------
alter table public.team_sessions add column if not exists start_time  time;
alter table public.team_sessions add column if not exists location    text not null default '';
alter table public.team_sessions add column if not exists on_calendar boolean not null default true;
do $$ begin
  alter table public.team_sessions add constraint team_sessions_location_len check (char_length(location) <= 120);
exception when duplicate_object then null; end $$;

-- ---------- 2. the team calendar for families (and staff) ----------------------
create or replace function public.team_calendar() returns json
language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(json_build_object(
           'id', s.id, 'team_id', s.team_id, 'title', s.title, 'session_date', s.session_date,
           'start_time', s.start_time, 'minutes', s.minutes, 'location', s.location, 'focus', s.focus)
         order by s.session_date, s.start_time), '[]'::json)
  from team_sessions s
  where s.on_calendar and s.session_date is not null and s.team_id is not null
    and s.session_date >= current_date - 90
    and (
      (is_staff() and s.club_id = my_club())
      or exists (select 1 from players p join family_links f on f.player_id = p.id
                 where f.member_id = auth.uid() and p.team_id = s.team_id and p.club_id = s.club_id)
    )
$$;
grant execute on function public.team_calendar() to authenticated;

-- ---------- 3. at-home sessions ------------------------------------------------
create table if not exists public.home_sessions (
  id          uuid primary key default gen_random_uuid(),
  player_id   uuid not null references public.players(id) on delete cascade,
  starts_at   timestamptz not null,
  minutes     int not null default 30 check (minutes between 5 and 180),
  drill_ids   text[] not null default '{}' check (cardinality(drill_ids) <= 10),
  note        text not null default '' check (char_length(note) <= 500),
  done        boolean not null default false,
  created_by  uuid references auth.users(id) on delete set null default auth.uid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists home_sessions_player_idx on public.home_sessions (player_id, starts_at);

alter table public.home_sessions enable row level security;

drop policy if exists home_sessions_read on public.home_sessions;
create policy home_sessions_read on public.home_sessions for select to authenticated
  using (can_see_player(player_id));

drop policy if exists home_sessions_insert on public.home_sessions;
create policy home_sessions_insert on public.home_sessions for insert to authenticated
  with check (is_my_player(player_id));

drop policy if exists home_sessions_update on public.home_sessions;
create policy home_sessions_update on public.home_sessions for update to authenticated
  using (is_my_player(player_id)) with check (is_my_player(player_id));

drop policy if exists home_sessions_delete on public.home_sessions;
create policy home_sessions_delete on public.home_sessions for delete to authenticated
  using (is_my_player(player_id));

do $$ begin
  begin alter publication supabase_realtime add table public.home_sessions; exception when duplicate_object then null; end;
end $$;

-- Done. You should see "Success. No rows returned".
