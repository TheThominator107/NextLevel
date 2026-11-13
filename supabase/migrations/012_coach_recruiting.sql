-- NextPlay update 012: coach recruiting (find players, shortlist, invite to a team)
-- Paste into Supabase -> SQL Editor -> New query -> Run. Safe to run more than once.
-- Needs updates 009, 010 and 011 first.
--
--  * Coaches and club admins can search Recruitment Profiles, but only those the family has made Public
--    AND chosen to show in coach search (recruit.searchable). Nothing else about a player is searchable.
--  * Each club keeps a shared shortlist with a status, season, team and notes. Only that club's staff see it.
--  * A coach can invite a listed player to one of the club's teams. The family sees the invitation and can
--    accept (the player joins the team) or decline. Families can turn search off at any time; the player
--    then disappears from search and from shortlists' details.

-- ---------- tables ----------------------------------------------------------

create table if not exists public.recruit_shortlist (
  id            uuid primary key default gen_random_uuid(),
  club_id       uuid not null references public.clubs(id) on delete cascade,
  player_id     uuid not null references public.players(id) on delete cascade,
  team_id       uuid references public.teams(id) on delete set null,
  season        text not null default '' check (char_length(season) <= 40),
  status        text not null default 'watching' check (status in ('watching','contacted','trial','offered','signed','passed')),
  note          text not null default '' check (char_length(note) <= 1000),
  added_by      uuid references auth.users(id) on delete set null,
  added_by_name text not null default '',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (club_id, player_id)
);
create index if not exists shortlist_club_idx on public.recruit_shortlist (club_id);

create table if not exists public.club_invites (
  id           uuid primary key default gen_random_uuid(),
  club_id      uuid not null references public.clubs(id) on delete cascade,
  team_id      uuid references public.teams(id) on delete set null,
  player_id    uuid not null references public.players(id) on delete cascade,
  club_name    text not null default '',
  team_name    text not null default '',
  player_name  text not null default '',
  season       text not null default '' check (char_length(season) <= 40),
  message      text not null default '' check (char_length(message) <= 1000),
  status       text not null default 'pending' check (status in ('pending','accepted','declined','withdrawn')),
  sent_by      uuid references auth.users(id) on delete set null,
  sent_by_name text not null default '',
  created_at   timestamptz not null default now(),
  decided_at   timestamptz
);
create index if not exists invites_club_idx on public.club_invites (club_id, status);
create index if not exists invites_player_idx on public.club_invites (player_id, status);

-- ---------- helpers ---------------------------------------------------------

-- public, created and opted in to coach search
create or replace function public.is_discoverable(pid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from player_profiles where player_id = pid and visibility = 'public'
                 and coalesce(recruit->>'created', '') = 'true' and coalesce(recruit->>'searchable', '') = 'true')
$$;

-- ---------- row level security ----------------------------------------------

alter table public.recruit_shortlist enable row level security;
alter table public.club_invites enable row level security;

drop policy if exists sl_read on public.recruit_shortlist;
create policy sl_read on public.recruit_shortlist for select to authenticated using (club_id = my_club() and is_staff());
drop policy if exists sl_insert on public.recruit_shortlist;
create policy sl_insert on public.recruit_shortlist for insert to authenticated
  with check (club_id = my_club() and is_staff() and is_discoverable(player_id) and added_by = auth.uid()
              and (team_id is null or team_in_my_club(team_id)));
drop policy if exists sl_update on public.recruit_shortlist;
create policy sl_update on public.recruit_shortlist for update to authenticated
  using (club_id = my_club() and is_staff())
  with check (club_id = my_club() and (team_id is null or team_in_my_club(team_id)));
drop policy if exists sl_delete on public.recruit_shortlist;
create policy sl_delete on public.recruit_shortlist for delete to authenticated using (club_id = my_club() and is_staff());

-- invitations: the club's staff and the player's family can read them; changes go through the functions below
drop policy if exists inv_read on public.club_invites;
create policy inv_read on public.club_invites for select to authenticated
  using ((club_id = my_club() and is_staff()) or is_my_player(player_id));

-- ---------- search ----------------------------------------------------------

create or replace function public.search_recruits(
  q text default '', p_positions text[] default '{}', age_min int default null, age_max int default null,
  grad int default null, p_foot text default '', p_location text default '', open_only boolean default false,
  video_only boolean default false) returns json
language plpgsql stable security definer set search_path = public as $$
declare cid uuid := my_club(); s text := lower(trim(coalesce(q, ''))); loc text := lower(trim(coalesce(p_location, '')));
begin
  if not is_staff() then raise exception 'Only coaches can search for players.'; end if;
  return coalesce((select json_agg(r order by r->>'updated_at' desc) from (
    select json_build_object(
      'player_id', pl.id, 'slug', pr.slug, 'name', pl.name,
      'age', coalesce(age_on(pl.birth_date), case when pl.birth_year is null then null else extract(year from now())::int - pl.birth_year end),
      'positions', pr.positions, 'foot', pr.foot, 'photo', pr.photo,
      'grad_year', pr.recruit->>'gradYear', 'height', pr.recruit->>'height', 'location', pr.recruit->>'location',
      'summary', left(coalesce(nullif(pr.recruit->>'summary', ''), pr.bio), 220),
      'open', coalesce(pr.recruit->>'open', '') = 'true',
      'videos', jsonb_array_length(pr.videos),
      'highlights', coalesce(jsonb_array_length(pr.recruit->'highlights'), 0),
      'club_name', coalesce((select name from clubs where id = pl.club_id),
                            (select h->>'club' from jsonb_array_elements(pr.history) h where h->>'to' = 'Present' limit 1)),
      'team_name', (select name from teams where id = pl.team_id),
      'mine', pl.club_id is not null and pl.club_id = cid,
      'shortlisted', exists (select 1 from recruit_shortlist sl where sl.club_id = cid and sl.player_id = pl.id),
      'invited', exists (select 1 from club_invites ci where ci.club_id = cid and ci.player_id = pl.id and ci.status = 'pending'),
      'updated_at', pr.updated_at) as r
    from player_profiles pr join players pl on pl.id = pr.player_id
    where pr.visibility = 'public' and coalesce(pr.recruit->>'created', '') = 'true' and coalesce(pr.recruit->>'searchable', '') = 'true'
      and (s = '' or lower(pl.name) like '%' || s || '%' or lower(coalesce(pr.recruit->>'summary', '') || ' ' || pr.bio) like '%' || s || '%'
           or lower(coalesce(pr.recruit->>'school', '')) like '%' || s || '%')
      and (coalesce(array_length(p_positions, 1), 0) = 0 or pr.positions && p_positions)
      and (age_min is null or coalesce(age_on(pl.birth_date), extract(year from now())::int - pl.birth_year) >= age_min)
      and (age_max is null or coalesce(age_on(pl.birth_date), extract(year from now())::int - pl.birth_year) <= age_max)
      and (grad is null or pr.recruit->>'gradYear' = grad::text)
      and (coalesce(p_foot, '') = '' or pr.foot = p_foot or (p_foot <> 'Both' and pr.foot = 'Both'))
      and (loc = '' or lower(coalesce(pr.recruit->>'location', '')) like '%' || loc || '%')
      and (not open_only or coalesce(pr.recruit->>'open', '') = 'true')
      and (not video_only or jsonb_array_length(pr.videos) > 0)
    order by pr.updated_at desc limit 60) x), '[]'::json);
end $$;

-- the club's shortlist, with profile details only while the family still shares them
create or replace function public.my_shortlist() returns json
language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(json_build_object(
    'id', sl.id, 'player_id', sl.player_id, 'team_id', sl.team_id, 'season', sl.season, 'status', sl.status,
    'note', sl.note, 'added_by_name', sl.added_by_name, 'created_at', sl.created_at, 'updated_at', sl.updated_at,
    'shared', is_discoverable(sl.player_id),
    'name', pl.name,
    'slug', case when is_discoverable(sl.player_id) then pr.slug end,
    'age', case when is_discoverable(sl.player_id) then coalesce(age_on(pl.birth_date), extract(year from now())::int - pl.birth_year) end,
    'positions', case when is_discoverable(sl.player_id) then pr.positions else '{}' end,
    'grad_year', case when is_discoverable(sl.player_id) then pr.recruit->>'gradYear' end,
    'location', case when is_discoverable(sl.player_id) then pr.recruit->>'location' end,
    'photo', case when is_discoverable(sl.player_id) then pr.photo end,
    'club_name', case when is_discoverable(sl.player_id) then coalesce((select name from clubs where id = pl.club_id),
                      (select h->>'club' from jsonb_array_elements(pr.history) h where h->>'to' = 'Present' limit 1)) end,
    'mine', pl.club_id is not null and pl.club_id = sl.club_id,
    'invite', (select json_build_object('id', ci.id, 'status', ci.status, 'team_name', ci.team_name) from club_invites ci
               where ci.club_id = sl.club_id and ci.player_id = sl.player_id order by ci.created_at desc limit 1)
  ) order by sl.updated_at desc), '[]'::json)
  from recruit_shortlist sl join players pl on pl.id = sl.player_id left join player_profiles pr on pr.player_id = sl.player_id
  where is_staff() and sl.club_id = my_club()
$$;

-- ---------- invitations -----------------------------------------------------

create or replace function public.send_invite(pid uuid, tid uuid, p_season text, p_message text) returns uuid
language plpgsql security definer set search_path = public as $$
declare t teams; pl players; iid uuid;
begin
  if not is_staff() then raise exception 'Only coaches can send invitations.'; end if;
  if not is_discoverable(pid) then raise exception 'This player''s family isn''t sharing their profile with coaches right now.'; end if;
  select * into t from teams where id = tid and club_id = my_club();
  if not found then raise exception 'Pick one of your club''s teams.'; end if;
  select * into pl from players where id = pid;
  if pl.team_id = tid then raise exception '% is already on this team.', pl.name; end if;
  if exists (select 1 from club_invites where club_id = my_club() and player_id = pid and status = 'pending') then
    raise exception 'You already have an invitation waiting for %.', pl.name; end if;
  insert into club_invites (club_id, team_id, player_id, club_name, team_name, player_name, season, message, sent_by, sent_by_name)
  values (my_club(), t.id, pid, (select name from clubs where id = my_club()), t.name, pl.name,
          left(trim(coalesce(p_season, '')), 40), left(trim(coalesce(p_message, '')), 1000),
          auth.uid(), coalesce((select name from members where id = auth.uid()), ''))
  returning id into iid;
  update recruit_shortlist set status = case when status in ('watching','contacted') then 'offered' else status end, updated_at = now()
    where club_id = my_club() and player_id = pid;
  return iid;
end $$;

create or replace function public.withdraw_invite(iid uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update club_invites set status = 'withdrawn', decided_at = now()
   where id = iid and club_id = my_club() and is_staff() and status = 'pending';
  if not found then raise exception 'Invitation not found.'; end if;
end $$;

-- the family accepts: the player joins that team (leaving any current team); other pending requests are cancelled
create or replace function public.answer_invite(iid uuid, accept boolean) returns text
language plpgsql security definer set search_path = public as $$
declare i club_invites;
begin
  select * into i from club_invites where id = iid;
  if not found or not is_my_player(i.player_id) then raise exception 'Invitation not found.'; end if;
  if i.status <> 'pending' then raise exception 'This invitation was already answered or withdrawn.'; end if;
  if not accept then
    update club_invites set status = 'declined', decided_at = now() where id = iid;
    return i.club_name;
  end if;
  if i.team_id is null or not exists (select 1 from teams where id = i.team_id and club_id = i.club_id) then
    raise exception 'That team no longer exists. Ask the club to send a new invitation.'; end if;
  update players set club_id = i.club_id, team_id = i.team_id where id = i.player_id;
  update club_invites set status = 'accepted', decided_at = now() where id = iid;
  update join_requests set status = 'cancelled', decided_at = now() where player_id = i.player_id and status = 'pending';
  update recruit_shortlist set status = 'signed', updated_at = now() where club_id = i.club_id and player_id = i.player_id;
  return i.club_name;
end $$;

revoke execute on function public.search_recruits(text, text[], int, int, int, text, text, boolean, boolean) from anon;
revoke execute on function public.my_shortlist()                          from anon;
revoke execute on function public.send_invite(uuid, uuid, text, text)     from anon;
revoke execute on function public.withdraw_invite(uuid)                   from anon;
revoke execute on function public.answer_invite(uuid, boolean)            from anon;

do $$ begin
  begin alter publication supabase_realtime add table public.recruit_shortlist; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.club_invites; exception when duplicate_object then null; end;
end $$;

-- Done. You should see "Success. No rows returned".
