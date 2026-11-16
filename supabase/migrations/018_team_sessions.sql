-- NextPlay update 018: team training sessions
-- Paste into Supabase -> SQL Editor -> New query -> Run. Safe to run more than once.
-- Coaches build training sessions for a team from the team drill library.
-- Only coaches and admins in the club can see or change them.

create table if not exists public.team_sessions (
  id           uuid primary key default gen_random_uuid(),
  club_id      uuid not null references public.clubs(id) on delete cascade,
  team_id      uuid references public.teams(id) on delete set null,
  title        text not null check (char_length(title) between 1 and 100),
  session_date date,
  minutes      int not null default 75 check (minutes between 0 and 300),
  focus        text[] not null default '{}',
  blocks       jsonb not null default '[]'::jsonb check (jsonb_typeof(blocks) = 'array' and jsonb_array_length(blocks) <= 30),
  notes        text not null default '' check (char_length(notes) <= 4000),
  created_by   uuid references auth.users(id) on delete set null default auth.uid(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists team_sessions_club_idx on public.team_sessions (club_id);
create index if not exists team_sessions_team_idx on public.team_sessions (team_id);

alter table public.team_sessions enable row level security;

drop policy if exists team_sessions_read on public.team_sessions;
create policy team_sessions_read on public.team_sessions for select to authenticated
  using (club_id = my_club() and is_staff());

drop policy if exists team_sessions_insert on public.team_sessions;
create policy team_sessions_insert on public.team_sessions for insert to authenticated
  with check (club_id = my_club() and is_staff()
    and (team_id is null or exists (select 1 from public.teams t where t.id = team_id and t.club_id = my_club())));

drop policy if exists team_sessions_update on public.team_sessions;
create policy team_sessions_update on public.team_sessions for update to authenticated
  using (club_id = my_club() and is_staff())
  with check (club_id = my_club() and is_staff()
    and (team_id is null or exists (select 1 from public.teams t where t.id = team_id and t.club_id = my_club())));

drop policy if exists team_sessions_delete on public.team_sessions;
create policy team_sessions_delete on public.team_sessions for delete to authenticated
  using (club_id = my_club() and is_staff() and (created_by = auth.uid() or is_admin()));

do $$ begin
  begin alter publication supabase_realtime add table public.team_sessions; exception when duplicate_object then null; end;
end $$;

-- Done. You should see "Success. No rows returned".
