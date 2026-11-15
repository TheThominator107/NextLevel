-- NextPlay update 016: three recruiting sections
--   College     (16 and over)  college coaches with a .edu email (unchanged)
--   Pro         (16 and over)  pro scouts and academy staff, each approved by a NextPlay owner
--   Youth clubs (any age)      coaches and admins of clubs on NextPlay; the parent opts in,
--                              and under-16s are never on a public link
-- Safe to run more than once. Needs updates 002-015 (or all_updates.sql) first.

-- ---------- pro scout accounts ----------------------------------------------

alter table public.members drop constraint if exists members_role_check;
alter table public.members add constraint members_role_check check (role in ('admin','coach','family','college','pro'));
alter table public.members drop constraint if exists members_club_by_role;
alter table public.members add constraint members_club_by_role
  check ((role in ('family','college','pro') and club_id is null) or (role in ('admin','coach') and club_id is not null));

-- NextPlay owners: the people who approve pro scouts. Add yourself once (see the end of this file).
create table if not exists public.platform_admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.pro_scouts (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text not null default '' check (char_length(name) <= 60),
  title      text not null default '' check (char_length(title) <= 80),
  email      text not null default '',
  org        text not null default '' check (char_length(org) <= 100),
  org_type   text not null default '' check (org_type in ('', 'Professional club','Academy','Agency','National federation','Other')),
  region     text not null default '' check (char_length(region) <= 80),
  about      text not null default '' check (char_length(about) <= 600),
  status     text not null default 'pending' check (status in ('pending','approved','declined')),
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create or replace function public.is_platform_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from platform_admins where user_id = auth.uid())
$$;

-- an approved pro scout
create or replace function public.is_pro() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from members m join pro_scouts s on s.id = m.id
                 where m.id = auth.uid() and m.role = 'pro' and s.status = 'approved')
$$;

-- which recruiting section the signed-in person searches in
create or replace function public.my_section() returns text
language sql stable security definer set search_path = public as $$
  select case when is_college() then 'college' when is_pro() then 'pro' when is_staff() then 'youth' end
$$;

-- is this player listed in a section right now?
create or replace function public.is_listed(pid uuid, sec text) returns boolean
language sql stable security definer set search_path = public as $$
  select case sec
    when 'college' then is_discoverable(pid)
    when 'pro' then coalesce(player_age(pid), 0) >= 16 and exists (
      select 1 from player_profiles where player_id = pid and visibility = 'public'
        and coalesce(recruit->>'created', '') = 'true' and coalesce(recruit->'pro'->>'searchable', '') = 'true')
    when 'youth' then exists (
      select 1 from player_profiles where player_id = pid
        and coalesce(recruit->>'created', '') = 'true' and coalesce(recruit->'youth'->>'searchable', '') = 'true')
    else false end
$$;

-- under-16s are shown to coaches as "First L."
create or replace function public.listed_name(pid uuid) returns text
language sql stable security definer set search_path = public as $$
  select case when coalesce(player_age(pid), 0) >= 16 or position(' ' in trim(name)) = 0 then trim(name)
              else split_part(trim(name), ' ', 1) || ' ' || left(split_part(trim(name), ' ', array_length(string_to_array(trim(name), ' '), 1)), 1) || '.' end
  from players where id = pid
$$;

create or replace function public.start_pro(my_name text, p_title text, p_org text, p_org_type text, p_region text, p_about text) returns void
language plpgsql security definer set search_path = public as $$
declare r text; mail text;
begin
  if auth.uid() is null then raise exception 'Please sign in first.'; end if;
  select role into r from members where id = auth.uid();
  if r = 'pro' then return; end if;
  if r is not null then raise exception 'This email already has a NextPlay account. Use a different email for a pro scout account.'; end if;
  select lower(email) into mail from auth.users where id = auth.uid();
  if char_length(trim(coalesce(my_name, ''))) = 0 or char_length(trim(coalesce(p_org, ''))) = 0 then
    raise exception 'Please add your name and your club or organization.'; end if;
  if coalesce(p_org_type, '') not in ('Professional club','Academy','Agency','National federation','Other') then
    raise exception 'Please pick what kind of organization you work for.'; end if;
  insert into members (id, club_id, role, name) values (auth.uid(), null, 'pro', left(trim(my_name), 60));
  insert into pro_scouts (id, name, title, email, org, org_type, region, about)
  values (auth.uid(), left(trim(my_name), 60), left(trim(coalesce(p_title, '')), 80), coalesce(mail, ''),
          left(trim(p_org), 100), p_org_type, left(trim(coalesce(p_region, '')), 80), left(trim(coalesce(p_about, '')), 600));
end $$;

-- a scout can fix their details; changing the organization sends an approved account back for review
create or replace function public.update_pro(my_name text, p_title text, p_org text, p_org_type text, p_region text, p_about text) returns void
language plpgsql security definer set search_path = public as $$
declare s pro_scouts;
begin
  select * into s from pro_scouts where id = auth.uid();
  if not found then raise exception 'Only pro scout accounts can do this.'; end if;
  if char_length(trim(coalesce(my_name, ''))) = 0 or char_length(trim(coalesce(p_org, ''))) = 0 then
    raise exception 'Please add your name and your club or organization.'; end if;
  if coalesce(p_org_type, '') not in ('Professional club','Academy','Agency','National federation','Other') then
    raise exception 'Please pick what kind of organization you work for.'; end if;
  update pro_scouts set name = left(trim(my_name), 60), title = left(trim(coalesce(p_title, '')), 80),
    org = left(trim(p_org), 100), org_type = p_org_type, region = left(trim(coalesce(p_region, '')), 80),
    about = left(trim(coalesce(p_about, '')), 600),
    status = case when lower(trim(p_org)) <> lower(org) or status = 'declined' then 'pending' else status end,
    decided_at = case when lower(trim(p_org)) <> lower(org) or status = 'declined' then null else decided_at end
  where id = auth.uid();
  update members set name = left(trim(my_name), 60) where id = auth.uid();
end $$;

-- owners: everyone who asked for a pro scout account, waiting first
create or replace function public.scout_requests() returns json
language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(json_build_object('id', s.id, 'name', s.name, 'title', s.title, 'email', s.email, 'org', s.org,
      'org_type', s.org_type, 'region', s.region, 'about', s.about, 'status', s.status, 'created_at', s.created_at, 'decided_at', s.decided_at)
    order by (s.status = 'pending') desc, s.created_at desc), '[]'::json)
  from pro_scouts s where is_platform_admin()
$$;

create or replace function public.decide_scout(sid uuid, approve boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_platform_admin() then raise exception 'Only NextPlay owners can approve scouts.'; end if;
  update pro_scouts set status = case when approve then 'approved' else 'declined' end, decided_at = now() where id = sid;
  if not found then raise exception 'Scout not found.'; end if;
end $$;

alter table public.platform_admins enable row level security;
alter table public.pro_scouts      enable row level security;
drop policy if exists pa_read on public.platform_admins;
create policy pa_read on public.platform_admins for select to authenticated using (user_id = auth.uid());
drop policy if exists ps_read on public.pro_scouts;
create policy ps_read on public.pro_scouts for select to authenticated using (id = auth.uid() or is_platform_admin());

-- ---------- shortlists and interest messages, for all three sections --------

alter table public.recruit_interest add column if not exists section text not null default 'college';
alter table public.recruit_interest drop constraint if exists recruit_interest_section_ok;
alter table public.recruit_interest add constraint recruit_interest_section_ok check (section in ('college','pro','youth'));

drop policy if exists csl_read on public.college_shortlist;
create policy csl_read on public.college_shortlist for select to authenticated using (coach_id = auth.uid() and my_section() is not null);
drop policy if exists csl_insert on public.college_shortlist;
create policy csl_insert on public.college_shortlist for insert to authenticated
  with check (coach_id = auth.uid() and my_section() is not null and is_listed(player_id, my_section()));
drop policy if exists csl_update on public.college_shortlist;
create policy csl_update on public.college_shortlist for update to authenticated
  using (coach_id = auth.uid() and my_section() is not null) with check (coach_id = auth.uid());

drop policy if exists ri_read on public.recruit_interest;
create policy ri_read on public.recruit_interest for select to authenticated
  using (is_my_player(player_id) or coach_id = auth.uid());

-- what a pro scout or a youth club coach sees about one listed player
create or replace function public.listing_card(pid uuid, sec text) returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'player_id', pl.id, 'section', sec, 'name', listed_name(pl.id), 'age', player_age(pl.id),
    'birth_year', coalesce(extract(year from pl.birth_date)::int, pl.birth_year),
    'slug', case when sec <> 'youth' then pr.slug end,
    'positions', pr.positions, 'foot', pr.foot, 'photo', pr.photo,
    'height', pr.recruit->>'height', 'location', pr.recruit->>'location', 'league', pr.recruit->>'league',
    'summary', left(coalesce(nullif(pr.recruit->>'summary', ''), pr.bio), 220),
    'videos', jsonb_array_length(pr.videos),
    'highlights', coalesce(jsonb_array_length(pr.recruit->'highlights'), 0),
    'club_name', coalesce((select name from clubs where id = pl.club_id),
                          (select h->>'club' from jsonb_array_elements(pr.history) h where h->>'to' = 'Present' limit 1)),
    'pro', case when sec = 'pro' then coalesce(pr.recruit->'pro', '{}'::jsonb) - 'searchable' end,
    'youth', case when sec = 'youth' then coalesce(pr.recruit->'youth', '{}'::jsonb) - 'searchable' end,
    'shortlisted', exists (select 1 from college_shortlist sl where sl.coach_id = auth.uid() and sl.player_id = pl.id),
    'contacted', exists (select 1 from recruit_interest ri where ri.coach_id = auth.uid() and ri.player_id = pl.id),
    'updated_at', pr.updated_at)
  from player_profiles pr join players pl on pl.id = pr.player_id
  where pl.id = pid and my_section() = sec and is_listed(pid, sec)
$$;

create or replace function public.search_pro(
  q text default '', p_positions text[] default '{}', age_min int default null, age_max int default null,
  p_foot text default '', p_status text default '', p_level text default '', p_location text default '',
  video_only boolean default false) returns json
language plpgsql stable security definer set search_path = public as $$
declare s text := lower(trim(coalesce(q, ''))); loc text := lower(trim(coalesce(p_location, '')));
begin
  if not is_pro() then raise exception 'Only approved pro scout accounts can search for players.'; end if;
  return coalesce((select json_agg(listing_card(x.id, 'pro') order by x.updated_at desc) from (
    select pl.id, pr.updated_at
    from player_profiles pr join players pl on pl.id = pr.player_id
    where is_listed(pl.id, 'pro')
      and (s = '' or lower(pl.name) like '%' || s || '%'
           or lower(coalesce(pr.recruit->>'summary', '') || ' ' || pr.bio || ' ' || coalesce(pr.recruit->'pro'->>'nationality', '')) like '%' || s || '%')
      and (coalesce(array_length(p_positions, 1), 0) = 0 or pr.positions && p_positions)
      and (age_min is null or player_age(pl.id) >= age_min)
      and (age_max is null or player_age(pl.id) <= age_max)
      and (coalesce(p_foot, '') = '' or pr.foot = p_foot or (p_foot <> 'Both' and pr.foot = 'Both'))
      and (coalesce(p_status, '') = '' or pr.recruit->'pro'->>'status' = p_status)
      and (coalesce(p_level, '') = '' or coalesce(pr.recruit->'pro'->'levels', '[]'::jsonb) ? p_level)
      and (loc = '' or lower(coalesce(pr.recruit->>'location', '') || ' ' || coalesce(pr.recruit->'pro'->>'nationality', '')) like '%' || loc || '%')
      and (not video_only or jsonb_array_length(pr.videos) > 0)
    order by pr.updated_at desc limit 60) x), '[]'::json);
end $$;

create or replace function public.search_youth(
  q text default '', p_positions text[] default '{}', p_birth_year int default null,
  p_level text default '', p_looking text default '', p_location text default '',
  video_only boolean default false) returns json
language plpgsql stable security definer set search_path = public as $$
declare s text := lower(trim(coalesce(q, ''))); loc text := lower(trim(coalesce(p_location, '')));
begin
  if not is_staff() then raise exception 'Only club coaches can search for youth players.'; end if;
  return coalesce((select json_agg(listing_card(x.id, 'youth') order by x.updated_at desc) from (
    select pl.id, pr.updated_at
    from player_profiles pr join players pl on pl.id = pr.player_id
    where is_listed(pl.id, 'youth')
      and pl.club_id is distinct from my_club()            -- not players already at your club
      and (s = '' or lower(listed_name(pl.id)) like '%' || s || '%'
           or lower(coalesce(pr.recruit->>'summary', '') || ' ' || pr.bio) like '%' || s || '%')
      and (coalesce(array_length(p_positions, 1), 0) = 0 or pr.positions && p_positions)
      and (p_birth_year is null or coalesce(extract(year from pl.birth_date)::int, pl.birth_year) = p_birth_year)
      and (coalesce(p_level, '') = '' or coalesce(pr.recruit->'youth'->'levels', '[]'::jsonb) ? p_level)
      and (coalesce(p_looking, '') = '' or coalesce(pr.recruit->'youth'->'looking', '[]'::jsonb) ? p_looking)
      and (loc = '' or lower(coalesce(pr.recruit->'youth'->>'area', '') || ' ' || coalesce(pr.recruit->>'location', '')) like '%' || loc || '%')
      and (not video_only or jsonb_array_length(pr.videos) > 0)
    order by pr.updated_at desc limit 60) x), '[]'::json);
end $$;

-- the full listing a youth club coach can open (under-16s have no public link)
create or replace function public.youth_profile(pid uuid) returns json
language plpgsql stable security definer set search_path = public as $$
declare pr player_profiles;
begin
  if not is_staff() or not is_listed(pid, 'youth') then raise exception 'This family isn''t sharing their profile with club coaches right now.'; end if;
  select * into pr from player_profiles where player_id = pid;
  return json_build_object(
    'card', listing_card(pid, 'youth'),
    'summary', coalesce(nullif(pr.recruit->>'summary', ''), pr.bio),
    'strengths', pr.strengths, 'videos', pr.videos, 'history', pr.history,
    'highlights', coalesce(pr.recruit->'highlights', '[]'::jsonb), 'stats', coalesce(pr.recruit->'stats', '[]'::jsonb),
    'refs', coalesce((
      select json_agg(json_build_object('id', c.id, 'text', c.text, 'author_name', c.author_name, 'author_title', c.author_title, 'date', c.date)
                      order by c.created_at desc)
      from comments c where c.player_id = pid and c.kind = 'reference'), '[]'::json));
end $$;

-- the shortlist of whoever is signed in (college coach, pro scout or club coach)
create or replace function public.college_shortlist_view() returns json
language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(json_build_object(
    'id', sl.id, 'player_id', sl.player_id, 'status', sl.status, 'note', sl.note,
    'created_at', sl.created_at, 'updated_at', sl.updated_at, 'section', my_section(),
    'shared', is_listed(sl.player_id, my_section()), 'name', listed_name(sl.player_id),
    'slug', case when is_listed(sl.player_id, my_section()) and my_section() <> 'youth' then pr.slug end,
    'age', case when is_listed(sl.player_id, my_section()) then player_age(sl.player_id) end,
    'birth_year', case when is_listed(sl.player_id, my_section()) then coalesce(extract(year from pl.birth_date)::int, pl.birth_year) end,
    'positions', case when is_listed(sl.player_id, my_section()) then pr.positions else '{}' end,
    'grad_year', case when is_listed(sl.player_id, my_section()) then pr.recruit->>'gradYear' end,
    'gpa', case when is_listed(sl.player_id, my_section()) and my_section() = 'college' then pr.recruit->>'gpa' end,
    'location', case when is_listed(sl.player_id, my_section()) then coalesce(nullif(pr.recruit->'youth'->>'area', ''), pr.recruit->>'location') end,
    'photo', case when is_listed(sl.player_id, my_section()) then pr.photo end,
    'committed', my_section() = 'college' and is_listed(sl.player_id, 'college') and coalesce(pr.recruit->>'committed', '') = 'true',
    'contacted', exists (select 1 from recruit_interest ri where ri.coach_id = sl.coach_id and ri.player_id = sl.player_id)
  ) order by sl.updated_at desc), '[]'::json)
  from college_shortlist sl join players pl on pl.id = sl.player_id left join player_profiles pr on pr.player_id = sl.player_id
  where my_section() is not null and sl.coach_id = auth.uid()
$$;

-- "I'm interested": the family sees who is asking and replies by email
create or replace function public.send_interest(pid uuid, p_message text) returns uuid
language plpgsql security definer set search_path = public as $$
declare sec text := my_section(); cc college_coaches; ps pro_scouts; iid uuid;
  v_name text; v_title text; v_email text; v_org text; v_program text := ''; v_division text := '';
begin
  if sec is null then raise exception 'Only college coaches, approved pro scouts and club coaches can do this.'; end if;
  if not is_listed(pid, sec) then raise exception 'This player''s family isn''t sharing their profile with coaches right now.'; end if;
  if sec = 'youth' and (select club_id from players where id = pid) is not distinct from my_club() then
    raise exception 'This player is already at your club.'; end if;
  if char_length(trim(coalesce(p_message, ''))) = 0 then raise exception 'Please write a short message.'; end if;
  if exists (select 1 from recruit_interest where coach_id = auth.uid() and player_id = pid and created_at > now() - interval '7 days') then
    raise exception 'You already sent this family a message this week.'; end if;
  if sec = 'college' then
    select * into cc from college_coaches where id = auth.uid();
    v_name := cc.name; v_title := cc.title; v_email := cc.email; v_org := cc.school; v_program := cc.program; v_division := cc.division;
  elsif sec = 'pro' then
    select * into ps from pro_scouts where id = auth.uid();
    v_name := ps.name; v_title := ps.title; v_email := ps.email; v_org := ps.org; v_program := ps.org_type; v_division := ps.region;
  else
    select m.name, case when m.role = 'admin' then 'Club admin' else 'Coach' end, c.name into v_name, v_title, v_org
      from members m join clubs c on c.id = m.club_id where m.id = auth.uid();
    select coalesce(email, '') into v_email from auth.users where id = auth.uid();
  end if;
  insert into recruit_interest (player_id, coach_id, coach_name, coach_title, coach_email, school, program, division, player_name, message, section)
  values (pid, auth.uid(), coalesce(v_name, ''), coalesce(v_title, ''), coalesce(v_email, ''), coalesce(v_org, ''), coalesce(v_program, ''), coalesce(v_division, ''),
          (select name from players where id = pid), left(trim(p_message), 1500), sec)
  returning id into iid;
  update college_shortlist set status = case when status = 'watching' then 'contacted' else status end, updated_at = now()
    where coach_id = auth.uid() and player_id = pid;
  return iid;
end $$;

revoke execute on function public.start_pro(text, text, text, text, text, text)  from anon;
revoke execute on function public.update_pro(text, text, text, text, text, text) from anon;
revoke execute on function public.scout_requests()                               from anon;
revoke execute on function public.decide_scout(uuid, boolean)                    from anon;
revoke execute on function public.listing_card(uuid, text)                       from anon;
revoke execute on function public.search_pro(text, text[], int, int, text, text, text, text, boolean) from anon;
revoke execute on function public.search_youth(text, text[], int, text, text, text, boolean)          from anon;
revoke execute on function public.youth_profile(uuid)                            from anon;

do $$ begin
  begin alter publication supabase_realtime add table public.pro_scouts; exception when duplicate_object then null; when undefined_object then null; end;
end $$;

-- Done. You should see "Success. No rows returned".
--
-- ONE MORE STEP, once: make yourself a NextPlay owner so you can approve pro scouts.
-- Run this line on its own, with the email you sign in to NextPlay with:
--
--   insert into public.platform_admins (user_id) select id from auth.users where lower(email) = lower('you@example.com') on conflict do nothing;
