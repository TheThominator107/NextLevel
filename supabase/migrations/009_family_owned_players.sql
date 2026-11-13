-- NextPlay update 009: parents sign up freely and request to join a team
-- Paste into Supabase -> SQL Editor -> New query -> Run. Safe to run more than once.
--
-- What changes:
--  * Parent / player accounts no longer belong to a club and no longer need a code.
--  * Families create their own players. The player and profile belong to the family, not the club.
--  * A family searches for a club, picks a team and sends a request. A coach at that club approves
--    (and can place the player on a different team) or declines.
--  * Leaving or being removed from a club: the family keeps every past review, reference, drill and
--    message. That club's coaches lose access. A new club's coaches only see what their own club wrote.
--  * Coaches no longer add players themselves; rosters fill from approved requests.
--  * Coaches still join a club with the club code (unchanged). Families can no longer read that code.

-- ---------- 1. columns ------------------------------------------------------

alter table public.members         alter column club_id drop not null;
alter table public.players         alter column club_id drop not null;
alter table public.players         alter column invite_code drop not null;
alter table public.player_profiles alter column club_id drop not null;
alter table public.assignments     alter column club_id drop not null;

-- existing family accounts become club-free; their players stay on their teams
update public.members set club_id = null where role = 'family' and club_id is not null;
update public.player_profiles set club_id = null where club_id is not null;
update public.players set invite_code = null where invite_code is not null;

do $$ begin
  alter table public.members add constraint members_club_by_role
    check ((role = 'family' and club_id is null) or (role <> 'family' and club_id is not null));
exception when duplicate_object then null; end $$;

-- ---------- 2. join requests -------------------------------------------------

create table if not exists public.join_requests (
  id                uuid primary key default gen_random_uuid(),
  player_id         uuid not null references public.players(id) on delete cascade,
  club_id           uuid not null references public.clubs(id) on delete cascade,
  team_id           uuid references public.teams(id) on delete set null,
  -- copied when the request is sent, so the coach can see who is asking before the player joins
  player_name       text not null default '',
  birth_year        int,
  positions         text[] not null default '{}',
  profile_slug      text,
  club_name         text not null default '',
  team_name         text not null default '',
  note              text not null default '' check (char_length(note) <= 500),
  requested_by      uuid references auth.users(id) on delete set null,
  requested_by_name text not null default '',
  status            text not null default 'pending' check (status in ('pending','approved','declined','cancelled')),
  decided_by_name   text not null default '',
  decided_team_name text not null default '',
  decided_at        timestamptz,
  created_at        timestamptz not null default now()
);
create index if not exists join_requests_club_idx on public.join_requests (club_id, status);
create index if not exists join_requests_player_idx on public.join_requests (player_id);

-- ---------- 3. helper functions ---------------------------------------------

create or replace function public.is_my_player(pid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from family_links where member_id = auth.uid() and player_id = pid)
$$;

create or replace function public.player_club(pid uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select club_id from players where id = pid
$$;

create or replace function public.team_club(tid uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select club_id from teams where id = tid
$$;

-- clubs this family's players are currently in
create or replace function public.family_club_ids() returns setof uuid
language sql stable security definer set search_path = public as $$
  select distinct p.club_id from players p join family_links f on f.player_id = p.id
  where f.member_id = auth.uid() and p.club_id is not null
$$;

-- a coach or admin whose club this player is in right now
create or replace function public.staff_has_player(pid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select is_staff() and exists (select 1 from players where id = pid and club_id is not null and club_id = my_club())
$$;

-- a family account linked to a player in my club (so coaches see parents' names)
create or replace function public.is_family_in_my_club(mid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select is_staff() and exists (
    select 1 from family_links f join players p on p.id = f.player_id
    where f.member_id = mid and p.club_id = my_club())
$$;

-- families: their own players, wherever they are. Staff: players in their club right now.
create or replace function public.can_see_player(pid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select is_my_player(pid) or staff_has_player(pid)
$$;

create or replace function public.player_in_my_club(pid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from players where id = pid and club_id is not null and club_id = my_club())
$$;

-- private chat and meetings: the family, plus the team's coaches and the admin of the player's current club
create or replace function public.can_message_player(pid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select is_my_player(pid) or exists (
    select 1 from players p
    where p.id = pid and p.club_id is not null and p.club_id = my_club()
      and (is_admin()
           or (is_staff() and exists (select 1 from team_coaches tc where tc.team_id = p.team_id and tc.member_id = auth.uid())))
  )
$$;

-- Home Training: staff, families on the family plan, or families with a player in a club that includes it
create or replace function public.has_home_training() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from members m where m.id = auth.uid() and (m.role in ('admin','coach') or m.family_plan is not null))
      or exists (select 1 from clubs c where c.id in (select family_club_ids()) and c.family_access = 'included')
$$;

-- ---------- 4. row level security -------------------------------------------

alter table public.join_requests enable row level security;

-- clubs: only that club's staff read the row (it holds the coach code). Families use family_clubs().
drop policy if exists clubs_read on public.clubs;
create policy clubs_read on public.clubs for select to authenticated using (id = my_club());

-- members: your own row; your club's people; families see their clubs' coaches; coaches see their players' parents
drop policy if exists members_read on public.members;
create policy members_read on public.members for select to authenticated
  using (id = auth.uid()
         or (club_id is not null and club_id = my_club())
         or (role in ('admin','coach') and club_id in (select family_club_ids()))
         or is_family_in_my_club(id));
drop policy if exists members_delete on public.members;
create policy members_delete on public.members for delete to authenticated
  using (id = auth.uid() or (club_id is not null and club_id = my_club() and is_admin() and role <> 'admin'));

-- teams: your club's teams, or the teams your players are on
drop policy if exists teams_read on public.teams;
create policy teams_read on public.teams for select to authenticated
  using (club_id = my_club() or id in (select my_team_ids()));

-- players: families create them (add_player) and may delete their own; coaches move them between
-- their club's teams and set the position; joining/leaving a club goes through the functions below
drop policy if exists players_read  on public.players;
create policy players_read on public.players for select to authenticated using (can_see_player(id));
drop policy if exists players_write on public.players;
drop policy if exists players_edit  on public.players;
create policy players_edit on public.players for update to authenticated
  using (club_id is not null and club_id = my_club() and is_staff())
  with check (club_id = my_club() and (team_id is null or team_in_my_club(team_id)));
drop policy if exists players_del on public.players;
create policy players_del on public.players for delete to authenticated using (is_my_player(id));
revoke update on public.players from authenticated;
grant update (team_id, position) on public.players to authenticated;

-- reviews & comments: the family always; staff only for their own club's entries on their current players
drop policy if exists reviews_read on public.reviews;
create policy reviews_read on public.reviews for select to authenticated
  using (is_my_player(player_id) or (club_id = my_club() and staff_has_player(player_id)));
drop policy if exists comments_read on public.comments;
create policy comments_read on public.comments for select to authenticated
  using (is_my_player(player_id) or (club_id = my_club() and staff_has_player(player_id)));

-- club drills: staff, and families with a player in that club
drop policy if exists drills_read on public.drills;
create policy drills_read on public.drills for select to authenticated
  using (club_id = my_club() or club_id in (select family_club_ids()));

-- home drill plans
drop policy if exists assign_read on public.assignments;
create policy assign_read on public.assignments for select to authenticated
  using (is_my_player(player_id) or (staff_has_player(player_id) and (club_id = my_club() or club_id is null)));
drop policy if exists assign_family_insert on public.assignments;
create policy assign_family_insert on public.assignments for insert to authenticated
  with check (not is_staff() and is_my_player(player_id) and assigned_by = auth.uid()
              and club_id is not distinct from player_club(player_id));
drop policy if exists assign_family_delete on public.assignments;
create policy assign_family_delete on public.assignments for delete to authenticated
  using (assigned_by = auth.uid() and is_my_player(player_id));

-- player profiles belong to the family
drop policy if exists profiles_read on public.player_profiles;
create policy profiles_read on public.player_profiles for select to authenticated using (can_see_player(player_id));
drop policy if exists profiles_insert on public.player_profiles;
create policy profiles_insert on public.player_profiles for insert to authenticated with check (is_my_player(player_id));
drop policy if exists profiles_update on public.player_profiles;
create policy profiles_update on public.player_profiles for update to authenticated
  using (is_my_player(player_id)) with check (is_my_player(player_id));

-- team chat: staff see their club's chats; families see their players' current teams
drop policy if exists messages_read on public.messages;
create policy messages_read on public.messages for select to authenticated
  using ((club_id = my_club() and is_staff()) or team_id in (select my_team_ids()));
drop policy if exists messages_write on public.messages;
create policy messages_write on public.messages for insert to authenticated
  with check (
    author_id = auth.uid() and club_id = team_club(team_id)
    and ((is_staff() and club_id = my_club()) or (team_id in (select my_team_ids()) and announce = false))
  );
drop policy if exists messages_del on public.messages;
create policy messages_del on public.messages for delete to authenticated
  using (author_id = auth.uid() or (club_id = my_club() and is_staff()));

-- meetings & private messages: new ones only while the player is in a club;
-- the family keeps old ones; staff only see their own club's
drop policy if exists meetings_read on public.meetings;
create policy meetings_read on public.meetings for select to authenticated
  using (is_my_player(player_id) or (club_id = my_club() and can_message_player(player_id)));
drop policy if exists meetings_insert on public.meetings;
create policy meetings_insert on public.meetings for insert to authenticated
  with check (can_message_player(player_id) and club_id = player_club(player_id) and created_by = auth.uid());
drop policy if exists meetings_update on public.meetings;
create policy meetings_update on public.meetings for update to authenticated
  using ((is_my_player(player_id) or club_id = my_club()) and can_message_player(player_id))
  with check ((is_my_player(player_id) or club_id = my_club()) and can_message_player(player_id));
drop policy if exists meetings_delete on public.meetings;
create policy meetings_delete on public.meetings for delete to authenticated
  using ((is_my_player(player_id) or club_id = my_club()) and can_message_player(player_id)
         and (created_by = auth.uid() or (is_admin() and club_id = my_club())));

drop policy if exists pm_read on public.private_messages;
create policy pm_read on public.private_messages for select to authenticated
  using (is_my_player(player_id) or (club_id = my_club() and can_message_player(player_id)));
drop policy if exists pm_insert on public.private_messages;
create policy pm_insert on public.private_messages for insert to authenticated
  with check (
    author_id = auth.uid() and can_message_player(player_id) and club_id = player_club(player_id)
    and (meeting_id is null or meeting_matches(meeting_id, player_id))
  );
drop policy if exists pm_delete on public.private_messages;
create policy pm_delete on public.private_messages for delete to authenticated
  using ((is_my_player(player_id) or club_id = my_club()) and can_message_player(player_id)
         and (author_id = auth.uid() or (is_admin() and club_id = my_club())));

-- join requests: the family and the club's staff can read them; changes go through the functions below
drop policy if exists jr_read on public.join_requests;
create policy jr_read on public.join_requests for select to authenticated
  using (is_my_player(player_id) or (club_id = my_club() and is_staff()));

-- ---------- 5. actions the app calls ----------------------------------------

-- the player-code connection is gone
drop function if exists public.join_family(text, text);

create or replace function public.create_club(club_name text, my_name text) returns uuid
language plpgsql security definer set search_path = public as $$
declare cid uuid; r text;
begin
  if auth.uid() is null then raise exception 'Please sign in first.'; end if;
  select role into r from members where id = auth.uid();
  if r = 'family' then raise exception 'This is a parent / player account. Use a different email to coach.'; end if;
  if r is not null then raise exception 'You already belong to a club. Leave it first.'; end if;
  insert into clubs (name, code, created_by) values (trim(club_name), gen_code(6), auth.uid()) returning id into cid;
  insert into members (id, club_id, role, name) values (auth.uid(), cid, 'admin', left(trim(my_name), 60));
  return cid;
end $$;

create or replace function public.join_club(club_code text, my_name text) returns text
language plpgsql security definer set search_path = public as $$
declare c clubs; r text;
begin
  if auth.uid() is null then raise exception 'Please sign in first.'; end if;
  select role into r from members where id = auth.uid();
  if r = 'family' then raise exception 'This is a parent / player account. Use a different email to coach.'; end if;
  if r is not null then raise exception 'You already belong to a club. Leave it first.'; end if;
  select * into c from clubs where code = upper(trim(club_code));
  if not found then raise exception 'No club has that code. Check it with your club admin.'; end if;
  insert into members (id, club_id, role, name) values (auth.uid(), c.id, 'coach', left(trim(my_name), 60));
  return c.name;
end $$;

-- a parent / player account, no code needed
create or replace function public.start_family(my_name text) returns void
language plpgsql security definer set search_path = public as $$
declare r text;
begin
  if auth.uid() is null then raise exception 'Please sign in first.'; end if;
  select role into r from members where id = auth.uid();
  if r = 'family' then return; end if;
  if r is not null then raise exception 'This is a coach account. Use a different email for your family.'; end if;
  if char_length(trim(coalesce(my_name, ''))) = 0 then raise exception 'Please add your name.'; end if;
  insert into members (id, club_id, role, name) values (auth.uid(), null, 'family', left(trim(my_name), 60));
end $$;

create or replace function public.add_player(p_name text, p_birth_year int) returns uuid
language plpgsql security definer set search_path = public as $$
declare pid uuid; r text;
begin
  select role into r from members where id = auth.uid();
  if r is distinct from 'family' then raise exception 'Only parent / player accounts can add players.'; end if;
  if char_length(trim(coalesce(p_name, ''))) = 0 then raise exception 'Please add the player''s name.'; end if;
  if p_birth_year is not null and (p_birth_year < 1990 or p_birth_year > extract(year from now())::int) then
    raise exception 'Please check the birth year.'; end if;
  if (select count(*) from family_links where member_id = auth.uid()) >= 10 then
    raise exception 'You can add up to 10 players.'; end if;
  insert into players (club_id, team_id, name, birth_year) values (null, null, left(trim(p_name), 60), p_birth_year)
    returning id into pid;
  insert into family_links (member_id, player_id) values (auth.uid(), pid);
  return pid;
end $$;

create or replace function public.update_player(pid uuid, p_name text, p_birth_year int) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_my_player(pid) then raise exception 'Player not found.'; end if;
  if char_length(trim(coalesce(p_name, ''))) = 0 then raise exception 'Please add the player''s name.'; end if;
  if p_birth_year is not null and (p_birth_year < 1990 or p_birth_year > extract(year from now())::int) then
    raise exception 'Please check the birth year.'; end if;
  update players set name = left(trim(p_name), 60), birth_year = p_birth_year where id = pid;
end $$;

-- the clubs a family's players are in (name and Home Training setting; never the coach code)
create or replace function public.family_clubs() returns json
language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(json_build_object('id', c.id, 'name', c.name, 'family_access', c.family_access)), '[]'::json)
  from clubs c where c.id in (select family_club_ids())
$$;

-- search clubs by name, with their teams
create or replace function public.find_clubs(q text) returns json
language plpgsql stable security definer set search_path = public as $$
declare s text := trim(coalesce(q, ''));
begin
  if auth.uid() is null then raise exception 'Please sign in first.'; end if;
  if char_length(s) < 2 then return '[]'::json; end if;
  s := replace(replace(replace(s, '\', '\\'), '%', '\%'), '_', '\_');
  return coalesce((
    select json_agg(x order by x->>'name') from (
      select json_build_object('id', c.id, 'name', c.name,
        'teams', coalesce((select json_agg(json_build_object('id', t.id, 'name', t.name, 'age_group', t.age_group) order by t.name)
                           from teams t where t.club_id = c.id), '[]'::json)) as x
      from clubs c where c.name ilike '%' || s || '%' order by c.name limit 20) y), '[]'::json);
end $$;

create or replace function public.request_team(pid uuid, tid uuid, p_note text) returns uuid
language plpgsql security definer set search_path = public as $$
declare pl players; t teams; pr player_profiles; rid uuid;
begin
  if not is_my_player(pid) then raise exception 'Player not found.'; end if;
  select * into pl from players where id = pid;
  select * into t from teams where id = tid;
  if not found then raise exception 'That team can''t be found.'; end if;
  if pl.team_id = tid then raise exception '% is already on this team.', pl.name; end if;
  if exists (select 1 from join_requests where player_id = pid and status = 'pending') then
    raise exception '% already has a request waiting. Cancel it first to ask a different team.', pl.name; end if;
  select * into pr from player_profiles where player_id = pid;
  insert into join_requests (player_id, club_id, team_id, player_name, birth_year, positions, profile_slug,
                             club_name, team_name, note, requested_by, requested_by_name)
  values (pid, t.club_id, t.id, pl.name, pl.birth_year, coalesce(pr.positions, '{}'), pr.slug,
          (select name from clubs where id = t.club_id), t.name, left(trim(coalesce(p_note, '')), 500),
          auth.uid(), coalesce((select name from members where id = auth.uid()), ''))
  returning id into rid;
  return rid;
end $$;

create or replace function public.cancel_request(rid uuid) returns void
language plpgsql security definer set search_path = public as $$
declare r join_requests;
begin
  select * into r from join_requests where id = rid;
  if not found or not is_my_player(r.player_id) then raise exception 'Request not found.'; end if;
  if r.status <> 'pending' then raise exception 'This request was already answered.'; end if;
  update join_requests set status = 'cancelled', decided_at = now() where id = rid;
end $$;

-- any coach or admin of the club can answer; they can place the player on a different team in their club
create or replace function public.decide_request(rid uuid, approve boolean, tid uuid) returns text
language plpgsql security definer set search_path = public as $$
declare r join_requests; t teams; me text;
begin
  select * into r from join_requests where id = rid;
  if not found or not is_staff() or r.club_id is distinct from my_club() then raise exception 'Request not found.'; end if;
  if r.status <> 'pending' then raise exception 'This request was already answered.'; end if;
  select name into me from members where id = auth.uid();
  if not approve then
    update join_requests set status = 'declined', decided_by_name = coalesce(me, ''), decided_at = now() where id = rid;
    return r.player_name;
  end if;
  select * into t from teams where id = coalesce(tid, r.team_id) and club_id = r.club_id;
  if not found then raise exception 'Pick one of your club''s teams.'; end if;
  update players set club_id = r.club_id, team_id = t.id where id = r.player_id;
  update join_requests set status = 'approved', decided_by_name = coalesce(me, ''), decided_team_name = t.name, decided_at = now()
    where id = rid;
  return r.player_name;
end $$;

-- the family takes their player off the club
create or replace function public.leave_team(pid uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_my_player(pid) then raise exception 'Player not found.'; end if;
  update players set club_id = null, team_id = null where id = pid;
end $$;

-- a coach or admin removes a player from their club (the family keeps the profile and history)
create or replace function public.remove_from_club(pid uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not staff_has_player(pid) then raise exception 'Player not found.'; end if;
  update players set club_id = null, team_id = null where id = pid;
end $$;

-- the shareable profile: the club shown is the player's current club
create or replace function public.get_public_profile(p_slug text) returns json
language plpgsql stable security definer set search_path = public as $$
declare pr player_profiles; pl players; insider boolean; cname text; age int;
begin
  select * into pr from player_profiles where slug = p_slug;
  if not found then return json_build_object('status', 'missing'); end if;
  select * into pl from players where id = pr.player_id;
  select name into cname from clubs where id = pl.club_id;
  age := case when pl.birth_year is null then null else extract(year from now())::int - pl.birth_year end;
  insider := auth.uid() is not null and (is_my_player(pl.id) or staff_has_player(pl.id));

  if pr.visibility <> 'public' and not insider then
    return json_build_object('status', 'limited',
      'player', json_build_object('name', pl.name, 'age', age),
      'club_name', cname);
  end if;

  return json_build_object(
    'status', 'ok',
    'profile', json_build_object(
      'player_id', pr.player_id, 'visibility', pr.visibility, 'slug', pr.slug, 'positions', pr.positions,
      'foot', pr.foot, 'strengths', pr.strengths, 'bio', pr.bio, 'history', pr.history,
      'videos', pr.videos, 'photo', pr.photo, 'updated_at', pr.updated_at),
    'player', json_build_object('id', pl.id, 'name', pl.name, 'birth_year', pl.birth_year, 'age', age),
    'club_name', cname,
    'refs', coalesce((
      select json_agg(json_build_object('id', c.id, 'kind', c.kind, 'text', c.text, 'author_name', c.author_name,
                                        'author_title', c.author_title, 'date', c.date, 'created_at', c.created_at)
                      order by c.created_at desc)
      from comments c where c.player_id = pr.player_id and c.kind = 'reference'), '[]'::json)
  );
end $$;

revoke execute on function public.start_family(text)               from anon;
revoke execute on function public.add_player(text, int)            from anon;
revoke execute on function public.update_player(uuid, text, int)   from anon;
revoke execute on function public.family_clubs()                   from anon;
revoke execute on function public.find_clubs(text)                 from anon;
revoke execute on function public.request_team(uuid, uuid, text)   from anon;
revoke execute on function public.cancel_request(uuid)             from anon;
revoke execute on function public.decide_request(uuid, boolean, uuid) from anon;
revoke execute on function public.leave_team(uuid)                 from anon;
revoke execute on function public.remove_from_club(uuid)           from anon;
grant  execute on function public.get_public_profile(text)         to anon, authenticated;

do $$ begin
  begin alter publication supabase_realtime add table public.join_requests; exception when duplicate_object then null; end;
end $$;

-- Done. You should see "Success. No rows returned".
