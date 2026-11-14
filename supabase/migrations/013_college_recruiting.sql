-- NextPlay update 013: college recruiting (players 16+, college coach accounts)
-- Paste into Supabase -> SQL Editor -> New query -> Run. Safe to run more than once.
-- Needs updates 009 to 012 first.
--
--  * Recruitment Profiles are for players aged 16 and over. Younger players' profiles never show publicly
--    or in search, even if they were made public before.
--  * New account type: College Coach. Sign-up needs a school .edu email address. College coaches search
--    opted-in players, keep their own shortlist and send "interested" messages to families.
--  * Club coaches no longer search for players (club shortlists and team invitations are removed).
--    They still write references from each player's page.

-- ---------- accounts --------------------------------------------------------

alter table public.members drop constraint if exists members_role_check;
alter table public.members add constraint members_role_check check (role in ('admin','coach','family','college'));
alter table public.members drop constraint if exists members_club_by_role;
alter table public.members add constraint members_club_by_role
  check ((role in ('family','college') and club_id is null) or (role in ('admin','coach') and club_id is not null));

create table if not exists public.college_coaches (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text not null default '' check (char_length(name) <= 60),
  title      text not null default '' check (char_length(title) <= 80),
  email      text not null default '',
  school     text not null default '' check (char_length(school) <= 100),
  program    text not null default '' check (char_length(program) <= 80),
  division   text not null default '' check (division in ('', 'NCAA D1','NCAA D2','NCAA D3','NAIA','NJCAA','Other')),
  created_at timestamptz not null default now()
);

create or replace function public.is_college() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from members where id = auth.uid() and role = 'college')
$$;

-- age today, from the date of birth (or birth year for older profiles)
create or replace function public.player_age(pid uuid) returns int
language sql stable security definer set search_path = public as $$
  select coalesce(age_on(birth_date), case when birth_year is null then null else extract(year from now())::int - birth_year end)
  from players where id = pid
$$;

-- public, created, opted in to coach search, and 16 or older
create or replace function public.is_discoverable(pid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(player_age(pid), 0) >= 16 and exists (
    select 1 from player_profiles where player_id = pid and visibility = 'public'
      and coalesce(recruit->>'created', '') = 'true' and coalesce(recruit->>'searchable', '') = 'true')
$$;

create or replace function public.start_college(my_name text, p_title text, p_school text, p_program text, p_division text) returns void
language plpgsql security definer set search_path = public as $$
declare r text; mail text;
begin
  if auth.uid() is null then raise exception 'Please sign in first.'; end if;
  select role into r from members where id = auth.uid();
  if r = 'college' then return; end if;
  if r is not null then raise exception 'This email already has a NextPlay account. Use your school email for a college coach account.'; end if;
  select lower(email) into mail from auth.users where id = auth.uid();
  if mail is null or mail !~ '\.edu$' then raise exception 'College coach accounts need a school email address ending in .edu.'; end if;
  if char_length(trim(coalesce(my_name, ''))) = 0 or char_length(trim(coalesce(p_school, ''))) = 0 then
    raise exception 'Please add your name and school.'; end if;
  if coalesce(p_division, '') not in ('', 'NCAA D1','NCAA D2','NCAA D3','NAIA','NJCAA','Other') then raise exception 'Please pick a division.'; end if;
  insert into members (id, club_id, role, name) values (auth.uid(), null, 'college', left(trim(my_name), 60));
  insert into college_coaches (id, name, title, email, school, program, division)
  values (auth.uid(), left(trim(my_name), 60), left(trim(coalesce(p_title, '')), 80), mail,
          left(trim(p_school), 100), left(trim(coalesce(p_program, '')), 80), coalesce(p_division, ''));
end $$;

create or replace function public.update_college(my_name text, p_title text, p_school text, p_program text, p_division text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_college() then raise exception 'Only college coach accounts can do this.'; end if;
  if char_length(trim(coalesce(my_name, ''))) = 0 or char_length(trim(coalesce(p_school, ''))) = 0 then
    raise exception 'Please add your name and school.'; end if;
  update college_coaches set name = left(trim(my_name), 60), title = left(trim(coalesce(p_title, '')), 80),
    school = left(trim(p_school), 100), program = left(trim(coalesce(p_program, '')), 80), division = coalesce(p_division, '')
  where id = auth.uid();
  update members set name = left(trim(my_name), 60) where id = auth.uid();
end $$;

-- club coaches can't become college coaches the other way round either
create or replace function public.create_club(club_name text, my_name text) returns uuid
language plpgsql security definer set search_path = public as $$
declare cid uuid; r text;
begin
  if auth.uid() is null then raise exception 'Please sign in first.'; end if;
  select role into r from members where id = auth.uid();
  if r = 'family' then raise exception 'This is a parent / player account. Use a different email to coach.'; end if;
  if r = 'college' then raise exception 'This is a college coach account. Use a different email for a club.'; end if;
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
  if r = 'college' then raise exception 'This is a college coach account. Use a different email for a club.'; end if;
  if r is not null then raise exception 'You already belong to a club. Leave it first.'; end if;
  select * into c from clubs where code = upper(trim(club_code));
  if not found then raise exception 'No club has that code. Check it with your club admin.'; end if;
  insert into members (id, club_id, role, name) values (auth.uid(), c.id, 'coach', left(trim(my_name), 60));
  return c.name;
end $$;

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

-- ---------- remove club-coach search (update 012) ---------------------------

drop function if exists public.send_invite(uuid, uuid, text, text);
drop function if exists public.withdraw_invite(uuid);
drop function if exists public.answer_invite(uuid, boolean);
drop function if exists public.my_shortlist();
drop table if exists public.recruit_shortlist cascade;
drop table if exists public.club_invites cascade;

-- ---------- college shortlist & interest ------------------------------------

create table if not exists public.college_shortlist (
  id         uuid primary key default gen_random_uuid(),
  coach_id   uuid not null references auth.users(id) on delete cascade,
  player_id  uuid not null references public.players(id) on delete cascade,
  status     text not null default 'watching' check (status in ('watching','contacted','evaluating','offered','committed','passed')),
  note       text not null default '' check (char_length(note) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (coach_id, player_id)
);

create table if not exists public.recruit_interest (
  id          uuid primary key default gen_random_uuid(),
  player_id   uuid not null references public.players(id) on delete cascade,
  coach_id    uuid references auth.users(id) on delete set null,
  coach_name  text not null default '',
  coach_title text not null default '',
  coach_email text not null default '',
  school      text not null default '',
  program     text not null default '',
  division    text not null default '',
  player_name text not null default '',
  message     text not null default '' check (char_length(message) <= 1500),
  status      text not null default 'new' check (status in ('new','seen','archived')),
  created_at  timestamptz not null default now()
);
create index if not exists interest_player_idx on public.recruit_interest (player_id);
create index if not exists interest_coach_idx on public.recruit_interest (coach_id);

alter table public.college_coaches   enable row level security;
alter table public.college_shortlist enable row level security;
alter table public.recruit_interest  enable row level security;

drop policy if exists cc_read on public.college_coaches;
create policy cc_read on public.college_coaches for select to authenticated using (id = auth.uid());

drop policy if exists csl_read on public.college_shortlist;
create policy csl_read on public.college_shortlist for select to authenticated using (coach_id = auth.uid() and is_college());
drop policy if exists csl_insert on public.college_shortlist;
create policy csl_insert on public.college_shortlist for insert to authenticated
  with check (coach_id = auth.uid() and is_college() and is_discoverable(player_id));
drop policy if exists csl_update on public.college_shortlist;
create policy csl_update on public.college_shortlist for update to authenticated
  using (coach_id = auth.uid() and is_college()) with check (coach_id = auth.uid());
drop policy if exists csl_delete on public.college_shortlist;
create policy csl_delete on public.college_shortlist for delete to authenticated using (coach_id = auth.uid());

-- interest messages: the family and the coach who sent it can read them; changes go through the functions below
drop policy if exists ri_read on public.recruit_interest;
create policy ri_read on public.recruit_interest for select to authenticated
  using (is_my_player(player_id) or (coach_id = auth.uid() and is_college()));

-- ---------- search ----------------------------------------------------------

drop function if exists public.search_recruits(text, text[], int, int, int, text, text, boolean, boolean);
create or replace function public.search_recruits(
  q text default '', p_positions text[] default '{}', grad int default null, gpa_min numeric default null,
  p_division text default '', p_league text default '', p_foot text default '', p_location text default '',
  uncommitted_only boolean default false, video_only boolean default false) returns json
language plpgsql stable security definer set search_path = public as $$
declare s text := lower(trim(coalesce(q, ''))); loc text := lower(trim(coalesce(p_location, '')));
begin
  if not is_college() then raise exception 'Only college coach accounts can search for players.'; end if;
  return coalesce((select json_agg(r order by r->>'updated_at' desc) from (
    select json_build_object(
      'player_id', pl.id, 'slug', pr.slug, 'name', pl.name, 'age', player_age(pl.id),
      'positions', pr.positions, 'foot', pr.foot, 'photo', pr.photo,
      'grad_year', pr.recruit->>'gradYear', 'gpa', pr.recruit->>'gpa', 'height', pr.recruit->>'height',
      'location', pr.recruit->>'location', 'school', pr.recruit->>'school', 'league', pr.recruit->>'league',
      'divisions', coalesce(pr.recruit->'divisions', '[]'::jsonb),
      'committed', coalesce(pr.recruit->>'committed', '') = 'true', 'committed_to', pr.recruit->>'committedTo',
      'summary', left(coalesce(nullif(pr.recruit->>'summary', ''), pr.bio), 220),
      'videos', jsonb_array_length(pr.videos),
      'highlights', coalesce(jsonb_array_length(pr.recruit->'highlights'), 0),
      'club_name', coalesce((select name from clubs where id = pl.club_id),
                            (select h->>'club' from jsonb_array_elements(pr.history) h where h->>'to' = 'Present' limit 1)),
      'shortlisted', exists (select 1 from college_shortlist sl where sl.coach_id = auth.uid() and sl.player_id = pl.id),
      'contacted', exists (select 1 from recruit_interest ri where ri.coach_id = auth.uid() and ri.player_id = pl.id),
      'updated_at', pr.updated_at) as r
    from player_profiles pr join players pl on pl.id = pr.player_id
    where is_discoverable(pl.id)
      and (s = '' or lower(pl.name) like '%' || s || '%'
           or lower(coalesce(pr.recruit->>'summary', '') || ' ' || pr.bio || ' ' || coalesce(pr.recruit->>'school', '') || ' ' || coalesce(pr.recruit->>'major', '')) like '%' || s || '%')
      and (coalesce(array_length(p_positions, 1), 0) = 0 or pr.positions && p_positions)
      and (grad is null or pr.recruit->>'gradYear' = grad::text)
      and (gpa_min is null or (coalesce(pr.recruit->>'gpa', '') ~ '^[0-9]+(\.[0-9]+)?$' and (pr.recruit->>'gpa')::numeric >= gpa_min))
      and (coalesce(p_division, '') = '' or coalesce(pr.recruit->'divisions', '[]'::jsonb) ? p_division)
      and (coalesce(p_league, '') = '' or pr.recruit->>'league' = p_league)
      and (coalesce(p_foot, '') = '' or pr.foot = p_foot or (p_foot <> 'Both' and pr.foot = 'Both'))
      and (loc = '' or lower(coalesce(pr.recruit->>'location', '')) like '%' || loc || '%')
      and (not uncommitted_only or coalesce(pr.recruit->>'committed', '') <> 'true')
      and (not video_only or jsonb_array_length(pr.videos) > 0)
    order by pr.updated_at desc limit 60) x), '[]'::json);
end $$;

-- the coach's shortlist, with profile details only while the family still shares them
create or replace function public.college_shortlist_view() returns json
language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(json_build_object(
    'id', sl.id, 'player_id', sl.player_id, 'status', sl.status, 'note', sl.note,
    'created_at', sl.created_at, 'updated_at', sl.updated_at,
    'shared', is_discoverable(sl.player_id), 'name', pl.name,
    'slug', case when is_discoverable(sl.player_id) then pr.slug end,
    'age', case when is_discoverable(sl.player_id) then player_age(sl.player_id) end,
    'positions', case when is_discoverable(sl.player_id) then pr.positions else '{}' end,
    'grad_year', case when is_discoverable(sl.player_id) then pr.recruit->>'gradYear' end,
    'gpa', case when is_discoverable(sl.player_id) then pr.recruit->>'gpa' end,
    'location', case when is_discoverable(sl.player_id) then pr.recruit->>'location' end,
    'photo', case when is_discoverable(sl.player_id) then pr.photo end,
    'committed', is_discoverable(sl.player_id) and coalesce(pr.recruit->>'committed', '') = 'true',
    'contacted', exists (select 1 from recruit_interest ri where ri.coach_id = sl.coach_id and ri.player_id = sl.player_id)
  ) order by sl.updated_at desc), '[]'::json)
  from college_shortlist sl join players pl on pl.id = sl.player_id left join player_profiles pr on pr.player_id = sl.player_id
  where is_college() and sl.coach_id = auth.uid()
$$;

-- a college coach tells the family they're interested; the family sees the coach's school email
create or replace function public.send_interest(pid uuid, p_message text) returns uuid
language plpgsql security definer set search_path = public as $$
declare cc college_coaches; iid uuid;
begin
  if not is_college() then raise exception 'Only college coach accounts can do this.'; end if;
  if not is_discoverable(pid) then raise exception 'This player''s family isn''t sharing their profile with coaches right now.'; end if;
  if char_length(trim(coalesce(p_message, ''))) = 0 then raise exception 'Please write a short message.'; end if;
  if exists (select 1 from recruit_interest where coach_id = auth.uid() and player_id = pid and created_at > now() - interval '7 days') then
    raise exception 'You already sent this family a message this week.'; end if;
  select * into cc from college_coaches where id = auth.uid();
  insert into recruit_interest (player_id, coach_id, coach_name, coach_title, coach_email, school, program, division, player_name, message)
  values (pid, auth.uid(), cc.name, cc.title, cc.email, cc.school, cc.program, cc.division,
          (select name from players where id = pid), left(trim(p_message), 1500))
  returning id into iid;
  update college_shortlist set status = case when status = 'watching' then 'contacted' else status end, updated_at = now()
    where coach_id = auth.uid() and player_id = pid;
  return iid;
end $$;

create or replace function public.mark_interest(iid uuid, p_status text) returns void
language plpgsql security definer set search_path = public as $$
declare ri recruit_interest;
begin
  select * into ri from recruit_interest where id = iid;
  if not found or not is_my_player(ri.player_id) then raise exception 'Message not found.'; end if;
  if p_status not in ('new','seen','archived') then raise exception 'Unknown status.'; end if;
  update recruit_interest set status = p_status where id = iid;
end $$;

-- ---------- public profile: 16 and over only --------------------------------

create or replace function public.get_public_profile(p_slug text) returns json
language plpgsql stable security definer set search_path = public as $$
declare pr player_profiles; pl players; insider boolean; cname text; age int; live boolean;
begin
  select * into pr from player_profiles where slug = p_slug;
  if not found then return json_build_object('status', 'missing'); end if;
  select * into pl from players where id = pr.player_id;
  select name into cname from clubs where id = pl.club_id;
  age := player_age(pl.id);
  insider := auth.uid() is not null and (is_my_player(pl.id) or staff_has_player(pl.id));
  live := pr.visibility = 'public' and coalesce(pr.recruit->>'created', '') = 'true' and coalesce(age, 0) >= 16;

  if not live and not insider then
    return json_build_object('status', 'limited',
      'player', json_build_object('name', pl.name, 'age', age),
      'club_name', cname);
  end if;

  return json_build_object(
    'status', 'ok',
    'profile', json_build_object(
      'player_id', pr.player_id, 'visibility', pr.visibility, 'slug', pr.slug, 'positions', pr.positions,
      'foot', pr.foot, 'strengths', pr.strengths, 'bio', pr.bio, 'history', pr.history,
      'videos', pr.videos, 'photo', pr.photo, 'recruit', pr.recruit, 'updated_at', pr.updated_at),
    'player', json_build_object('id', pl.id, 'name', pl.name, 'age', age),
    'club_name', cname,
    'refs', coalesce((
      select json_agg(json_build_object('id', c.id, 'kind', c.kind, 'text', c.text, 'author_name', c.author_name,
                                        'author_title', c.author_title, 'date', c.date, 'created_at', c.created_at)
                      order by c.created_at desc)
      from comments c where c.player_id = pr.player_id and c.kind = 'reference'), '[]'::json)
  );
end $$;

revoke execute on function public.start_college(text, text, text, text, text)  from anon;
revoke execute on function public.update_college(text, text, text, text, text) from anon;
revoke execute on function public.search_recruits(text, text[], int, numeric, text, text, text, text, boolean, boolean) from anon;
revoke execute on function public.college_shortlist_view()                      from anon;
revoke execute on function public.send_interest(uuid, text)                     from anon;
revoke execute on function public.mark_interest(uuid, text)                     from anon;
grant  execute on function public.get_public_profile(text)                      to anon, authenticated;

do $$ begin
  begin alter publication supabase_realtime add table public.college_shortlist; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.recruit_interest; exception when duplicate_object then null; end;
end $$;

-- Done. You should see "Success. No rows returned".
-- Tip: turn on Authentication -> Sign In / Providers -> Email -> "Confirm email" before launch,
-- so college coaches have to prove they own their .edu address.
