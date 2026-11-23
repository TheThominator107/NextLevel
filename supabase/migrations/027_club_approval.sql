-- NextPass update 027: new clubs wait for NextPass staff approval
-- Paste into Supabase -> SQL Editor -> New query -> Run. Safe to run more than once.
--   A club made after this runs starts as "pending". Until NextPass staff approve it, its
--   coaches can't add teams or players, search for players, message families or list
--   opportunities, and families can't find it or ask to join it.
--   Clubs that already exist when this runs stay approved.
--   NextPass staff approve or decline clubs in the same Approvals list as college coaches
--   and pro scouts. Clubs that NextPass staff create themselves are approved straight away.

-- ---------- club status ------------------------------------------------------
alter table public.clubs add column if not exists status text not null default 'approved';
alter table public.clubs alter column status set default 'pending';
alter table public.clubs add column if not exists decided_at timestamptz;
alter table public.clubs drop constraint if exists clubs_status_ok;
alter table public.clubs add constraint clubs_status_ok check (status in ('pending','approved','declined'));

-- only NextPass staff can change a club's status (club admins can still rename their club)
create or replace function public.club_status_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status and not is_platform_admin() then
    raise exception 'Only NextPass staff can approve clubs.';
  end if;
  return new;
end $$;
drop trigger if exists clubs_status_guard on public.clubs;
create trigger clubs_status_guard before update of status on public.clubs for each row execute function public.club_status_guard();

create or replace function public.club_approved(cid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from clubs where id = cid and status = 'approved')
$$;

-- ---------- coaches of a club that isn't approved have no coach rights -------
create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from members m join clubs c on c.id = m.club_id
                 where m.id = auth.uid() and m.role in ('admin','coach') and c.status = 'approved')
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from members m join clubs c on c.id = m.club_id
                 where m.id = auth.uid() and m.role = 'admin' and c.status = 'approved')
$$;

create or replace function public.has_home_training() returns boolean
language sql stable security definer set search_path = public as $$
  select is_staff()
      or exists (select 1 from members m where m.id = auth.uid() and m.family_plan is not null)
      or exists (select 1 from family_club_ids())
$$;

create or replace function public.can_list_opportunities() returns boolean
language sql stable security definer set search_path = public as $$
  select is_staff() or is_college()
$$;

-- ---------- new clubs start as pending ----------------------------------------
create or replace function public.create_club(club_name text, my_name text) returns uuid
language plpgsql security definer set search_path = public as $$
declare cid uuid; r text;
begin
  if auth.uid() is null then raise exception 'Please sign in first.'; end if;
  select role into r from members where id = auth.uid();
  if r = 'family' then raise exception 'This is a parent / player account. Use a different email to coach.'; end if;
  if r = 'college' then raise exception 'This is a college coach account. Use a different email for a club.'; end if;
  if r is not null then raise exception 'You already belong to a club. Leave it first.'; end if;
  insert into clubs (name, code, created_by, status, decided_at)
  values (trim(club_name), gen_code(6), auth.uid(),
          case when is_platform_admin() then 'approved' else 'pending' end,
          case when is_platform_admin() then now() end)
  returning id into cid;
  insert into members (id, club_id, role, name) values (auth.uid(), cid, 'admin', left(trim(my_name), 60));
  return cid;
end $$;

-- coaches can join a club that is waiting; they wait with it. A declined club can't be joined.
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
  if not found or c.status = 'declined' then raise exception 'No club has that code. Check it with your club admin.'; end if;
  insert into members (id, club_id, role, name) values (auth.uid(), c.id, 'coach', left(trim(my_name), 60));
  return c.name;
end $$;

-- ---------- families only see approved clubs ------------------------------------
create or replace function public.team_invite_info(p_team uuid) returns json
language sql stable security definer set search_path = public as $$
  select json_build_object('team_id', t.id, 'team_name', t.name, 'age_group', t.age_group,
                           'club_id', c.id, 'club_name', c.name)
  from public.teams t join public.clubs c on c.id = t.club_id
  where t.id = p_team and c.status = 'approved';
$$;

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
      where c.status = 'approved'
        and not exists (
        select 1 from unnest(words) w
        where c.name not ilike '%' || w || '%'
          and not exists (select 1 from teams t where t.club_id = c.id
                          and (t.name ilike '%' || w || '%' or t.age_group ilike '%' || w || '%')))
      order by c.name limit 20) y), '[]'::json);
end $$;

create or replace function public.request_team(pid uuid, tid uuid, p_note text) returns uuid
language plpgsql security definer set search_path = public as $$
declare pl players; t teams; pr player_profiles; rid uuid;
begin
  if not is_my_player(pid) then raise exception 'Player not found.'; end if;
  select * into pl from players where id = pid;
  select * into t from teams where id = tid;
  if not found or not club_approved(t.club_id) then raise exception 'That team can''t be found.'; end if;
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

-- ---------- the Approvals list: clubs next to college coaches and pro scouts -----
create or replace function public.scout_requests() returns json
language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(x order by (x->>'status' = 'pending') desc, x->>'created_at' desc), '[]'::json) from (
    select json_build_object('id', s.id, 'kind', 'pro', 'name', s.name, 'title', s.title, 'email', s.email, 'org', s.org,
      'org_type', s.org_type, 'region', s.region, 'about', s.about, 'status', s.status, 'created_at', s.created_at, 'decided_at', s.decided_at) as x
    from pro_scouts s where is_platform_admin()
    union all
    select json_build_object('id', c.id, 'kind', 'college', 'name', c.name, 'title', c.title, 'email', c.email, 'org', c.school,
      'org_type', concat_ws(' · ', nullif(c.program, ''), nullif(c.division, '')), 'region', '', 'about', '', 'status', c.status,
      'created_at', c.created_at, 'decided_at', c.decided_at)
    from college_coaches c where is_platform_admin()
    union all
    select json_build_object('id', cl.id, 'kind', 'club',
      'name', coalesce((select m.name from members m where m.id = cl.created_by), ''), 'title', 'Club admin',
      'email', coalesce((select u.email from auth.users u where u.id = cl.created_by), ''), 'org', cl.name,
      'org_type', '', 'region', '', 'about', '', 'status', cl.status, 'created_at', cl.created_at, 'decided_at', cl.decided_at)
    from clubs cl where is_platform_admin() and (cl.status <> 'approved' or cl.decided_at is not null)
  ) q
$$;

create or replace function public.decide_scout(sid uuid, approve boolean) returns void
language plpgsql security definer set search_path = public as $$
declare hit boolean := false;
begin
  if not is_platform_admin() then raise exception 'Only NextPass staff can approve accounts.'; end if;
  update pro_scouts set status = case when approve then 'approved' else 'declined' end, decided_at = now() where id = sid;
  hit := found;
  update college_coaches set status = case when approve then 'approved' else 'declined' end, decided_at = now() where id = sid;
  hit := hit or found;
  update clubs set status = case when approve then 'approved' else 'declined' end, decided_at = now() where id = sid;
  if not (hit or found) then raise exception 'Not found.'; end if;
end $$;

revoke execute on function public.club_approved(uuid) from anon;

-- Done. You should see "Success. No rows returned".
