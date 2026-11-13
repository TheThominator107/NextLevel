-- NextPlay update 006: private coach / player / parent chat + meeting room
-- Paste into Supabase -> SQL Editor -> New query -> Run. Safe to run more than once.
-- Who can see a player's private chat and meetings: the club's coaches and that player's own family accounts
-- (parents and the player's own login). Nobody else - not other families, not other clubs.

create table if not exists public.meetings (
  id              uuid primary key default gen_random_uuid(),
  club_id         uuid not null references public.clubs(id) on delete cascade,
  player_id       uuid not null references public.players(id) on delete cascade,
  topic           text not null check (char_length(topic) between 1 and 120),
  review_id       uuid references public.reviews(id) on delete set null,
  details         text not null default '' check (char_length(details) <= 2000),
  preferred_times text not null default '' check (char_length(preferred_times) <= 300),
  status          text not null default 'requested' check (status in ('requested','scheduled','done','cancelled')),
  scheduled_at    timestamptz,
  location        text not null default '' check (char_length(location) <= 300),
  notes           text not null default '' check (char_length(notes) <= 4000),
  created_by      uuid references auth.users(id) on delete set null,
  created_by_name text not null default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.private_messages (
  id          uuid primary key default gen_random_uuid(),
  club_id     uuid not null references public.clubs(id) on delete cascade,
  player_id   uuid not null references public.players(id) on delete cascade,
  meeting_id  uuid references public.meetings(id) on delete cascade,
  author_id   uuid references auth.users(id) on delete set null,
  author_name text not null default '',
  role        text not null default '',
  text        text not null check (char_length(text) between 1 and 2000),
  created_at  timestamptz not null default now()
);

create index if not exists meetings_player_idx on public.meetings (player_id);
create index if not exists meetings_club_idx on public.meetings (club_id);
create index if not exists pm_player_idx on public.private_messages (player_id, created_at desc);
create index if not exists pm_club_idx on public.private_messages (club_id, created_at desc);
create index if not exists pm_meeting_idx on public.private_messages (meeting_id);

create or replace function public.meeting_matches(mid uuid, pid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from meetings where id = mid and player_id = pid)
$$;

alter table public.meetings enable row level security;
alter table public.private_messages enable row level security;

-- meetings: coaches + this player's family can see, create and update; only the creator or a coach can delete
drop policy if exists meetings_read on public.meetings;
create policy meetings_read on public.meetings for select to authenticated using (can_see_player(player_id));
drop policy if exists meetings_insert on public.meetings;
create policy meetings_insert on public.meetings for insert to authenticated
  with check (can_see_player(player_id) and club_id = my_club() and created_by = auth.uid());
drop policy if exists meetings_update on public.meetings;
create policy meetings_update on public.meetings for update to authenticated
  using (can_see_player(player_id)) with check (can_see_player(player_id) and club_id = my_club());
drop policy if exists meetings_delete on public.meetings;
create policy meetings_delete on public.meetings for delete to authenticated
  using (can_see_player(player_id) and (created_by = auth.uid() or is_staff()));

-- private messages: same people; you post as yourself; a meeting message must belong to that player's meeting
drop policy if exists pm_read on public.private_messages;
create policy pm_read on public.private_messages for select to authenticated using (can_see_player(player_id));
drop policy if exists pm_insert on public.private_messages;
create policy pm_insert on public.private_messages for insert to authenticated
  with check (
    author_id = auth.uid() and club_id = my_club() and can_see_player(player_id)
    and (meeting_id is null or meeting_matches(meeting_id, player_id))
  );
drop policy if exists pm_delete on public.private_messages;
create policy pm_delete on public.private_messages for delete to authenticated
  using (can_see_player(player_id) and (author_id = auth.uid() or is_admin()));

-- live updates
do $$ begin
  begin alter publication supabase_realtime add table public.meetings; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.private_messages; exception when duplicate_object then null; end;
end $$;

-- Done. You should see "Success. No rows returned".
