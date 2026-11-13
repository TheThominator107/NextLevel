-- NextPlay update 010: date of birth for players + a better club / team search
-- Paste into Supabase -> SQL Editor -> New query -> Run. Safe to run more than once.
-- Needs update 009 first.
--
--  * Players get a date of birth (only the family and their current club's coaches can see it;
--    public profiles and join requests show the age, never the date).
--  * The club search now matches club names, team names and age groups, word by word,
--    so "qst u12" or "premier boys" find the right team.

alter table public.players add column if not exists birth_date date;
alter table public.join_requests add column if not exists age int;

do $$ begin
  alter table public.players add constraint players_birth_date_ok
    check (birth_date is null or (birth_date >= date '1990-01-01' and birth_date <= current_date));
exception when duplicate_object then null; end $$;

create or replace function public.age_on(d date) returns int
language sql stable as $$ select case when d is null then null else date_part('year', age(current_date, d))::int end $$;

-- a parent / player account adds a player
create or replace function public.create_player(p_name text, p_birth_date date) returns uuid
language plpgsql security definer set search_path = public as $$
declare pid uuid; r text;
begin
  select role into r from members where id = auth.uid();
  if r is distinct from 'family' then raise exception 'Only parent / player accounts can add players.'; end if;
  if char_length(trim(coalesce(p_name, ''))) = 0 then raise exception 'Please add the player''s name.'; end if;
  if p_birth_date is null then raise exception 'Please add the date of birth.'; end if;
  if p_birth_date < date '1990-01-01' or p_birth_date > current_date then raise exception 'Please check the date of birth.'; end if;
  if (select count(*) from family_links where member_id = auth.uid()) >= 10 then raise exception 'You can add up to 10 players.'; end if;
  insert into players (club_id, team_id, name, birth_date, birth_year)
    values (null, null, left(trim(p_name), 60), p_birth_date, extract(year from p_birth_date)::int)
    returning id into pid;
  insert into family_links (member_id, player_id) values (auth.uid(), pid);
  return pid;
end $$;

create or replace function public.edit_player(pid uuid, p_name text, p_birth_date date) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_my_player(pid) then raise exception 'Player not found.'; end if;
  if char_length(trim(coalesce(p_name, ''))) = 0 then raise exception 'Please add the player''s name.'; end if;
  if p_birth_date is not null and (p_birth_date < date '1990-01-01' or p_birth_date > current_date) then
    raise exception 'Please check the date of birth.'; end if;
  update players set name = left(trim(p_name), 60), birth_date = p_birth_date,
    birth_year = case when p_birth_date is null then birth_year else extract(year from p_birth_date)::int end
  where id = pid;
end $$;

-- search clubs and teams: every word must match the club name, a team name or an age group
create or replace function public.find_clubs(q text) returns json
language plpgsql stable security definer set search_path = public as $$
declare words text[];
begin
  if auth.uid() is null then raise exception 'Please sign in first.'; end if;
  select coalesce(array_agg(w), '{}') into words
    from (select replace(replace(replace(lower(w), '\', '\\'), '%', '\%'), '_', '\_') as w
          from regexp_split_to_table(trim(coalesce(q, '')), '\s+') w where char_length(w) > 0 limit 6) x;
  if coalesce(array_length(words, 1), 0) = 0 or char_length(trim(q)) < 2 then return '[]'::json; end if;
  return coalesce((
    select json_agg(x order by x->>'name') from (
      select json_build_object('id', c.id, 'name', c.name,
        'teams', coalesce((select json_agg(json_build_object('id', t.id, 'name', t.name, 'age_group', t.age_group) order by t.name)
                           from teams t where t.club_id = c.id), '[]'::json)) as x
      from clubs c
      where not exists (
        select 1 from unnest(words) w
        where c.name not ilike '%' || w || '%'
          and not exists (select 1 from teams t where t.club_id = c.id
                          and (t.name ilike '%' || w || '%' or t.age_group ilike '%' || w || '%')))
      order by c.name limit 20) y), '[]'::json);
end $$;

-- join requests show the coach the player's age (not the date of birth)
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
  insert into join_requests (player_id, club_id, team_id, player_name, birth_year, age, positions, profile_slug,
                             club_name, team_name, note, requested_by, requested_by_name)
  values (pid, t.club_id, t.id, pl.name, pl.birth_year,
          coalesce(age_on(pl.birth_date), case when pl.birth_year is null then null else extract(year from now())::int - pl.birth_year end),
          coalesce(pr.positions, '{}'), pr.slug,
          (select name from clubs where id = t.club_id), t.name, left(trim(coalesce(p_note, '')), 500),
          auth.uid(), coalesce((select name from members where id = auth.uid()), ''))
  returning id into rid;
  return rid;
end $$;

-- public profile: age from the date of birth when there is one
create or replace function public.get_public_profile(p_slug text) returns json
language plpgsql stable security definer set search_path = public as $$
declare pr player_profiles; pl players; insider boolean; cname text; age int;
begin
  select * into pr from player_profiles where slug = p_slug;
  if not found then return json_build_object('status', 'missing'); end if;
  select * into pl from players where id = pr.player_id;
  select name into cname from clubs where id = pl.club_id;
  age := coalesce(age_on(pl.birth_date), case when pl.birth_year is null then null else extract(year from now())::int - pl.birth_year end);
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
    'player', json_build_object('id', pl.id, 'name', pl.name, 'age', age),
    'club_name', cname,
    'refs', coalesce((
      select json_agg(json_build_object('id', c.id, 'kind', c.kind, 'text', c.text, 'author_name', c.author_name,
                                        'author_title', c.author_title, 'date', c.date, 'created_at', c.created_at)
                      order by c.created_at desc)
      from comments c where c.player_id = pr.player_id and c.kind = 'reference'), '[]'::json)
  );
end $$;

revoke execute on function public.create_player(text, date)     from anon;
revoke execute on function public.edit_player(uuid, text, date) from anon;
revoke execute on function public.find_clubs(text)              from anon;
revoke execute on function public.request_team(uuid, uuid, text) from anon;
grant  execute on function public.get_public_profile(text)      to anon, authenticated;

-- Done. You should see "Success. No rows returned".
