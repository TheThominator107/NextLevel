-- NextPass update 026: new club plans, and college coaches approved by NextPass staff
-- Paste into Supabase -> SQL Editor -> New query -> Run. Safe to run more than once.
--   Club plans: per team ($9.99 a team), Club 20 ($149.99, up to 20 teams),
--               Club 50 ($349.99, up to 50 teams), Club Unlimited ($499.99).
--   College coaches now wait for approval, like pro scouts. College coach accounts that
--   already exist when this runs stay approved.

-- ---------- club plans ------------------------------------------------------
alter table public.clubs drop constraint if exists clubs_plan_ok;
alter table public.clubs add constraint clubs_plan_ok check (plan in ('team','t20','t50','unlimited'));

-- a club on Club 20 or Club 50 can't go over its number of teams
create or replace function public.team_limit_check() returns trigger
language plpgsql security definer set search_path = public as $$
declare pl text; cap int; n int;
begin
  select plan into pl from clubs where id = new.club_id;
  cap := case pl when 't20' then 20 when 't50' then 50 else null end;
  if cap is not null then
    select count(*) into n from teams where club_id = new.club_id;
    if n >= cap then raise exception 'Your plan includes up to % teams. Switch to a bigger plan to add more.', cap; end if;
  end if;
  return new;
end $$;
drop trigger if exists teams_limit on public.teams;
create trigger teams_limit before insert on public.teams for each row execute function public.team_limit_check();

-- a plan can't be lowered below the teams the club already has
create or replace function public.club_plan_check() returns trigger
language plpgsql security definer set search_path = public as $$
declare cap int; n int;
begin
  if new.plan is distinct from old.plan then
    cap := case new.plan when 't20' then 20 when 't50' then 50 else null end;
    if cap is not null then
      select count(*) into n from teams where club_id = new.id;
      if n > cap then raise exception 'Your club has % teams. That plan includes up to %.', n, cap; end if;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists clubs_plan_limit on public.clubs;
create trigger clubs_plan_limit before update of plan on public.clubs for each row execute function public.club_plan_check();

-- ---------- college coaches: approved by NextPass staff ----------------------
-- existing accounts are filled in as approved; new ones start as pending
alter table public.college_coaches add column if not exists status text not null default 'approved'
  check (status in ('pending','approved','declined'));
alter table public.college_coaches alter column status set default 'pending';
alter table public.college_coaches add column if not exists decided_at timestamptz;

-- "a college coach" now means an approved one: searching, shortlists, messages and listings
create or replace function public.is_college() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from members m join college_coaches c on c.id = m.id
                 where m.id = auth.uid() and m.role = 'college' and c.status = 'approved')
$$;

-- a waiting college coach can still fix their own details (it goes back for another look if declined)
create or replace function public.update_college(my_name text, p_title text, p_school text, p_program text, p_division text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from members where id = auth.uid() and role = 'college') then
    raise exception 'Only college coach accounts can do this.'; end if;
  if char_length(trim(coalesce(my_name, ''))) = 0 or char_length(trim(coalesce(p_school, ''))) = 0 then
    raise exception 'Please add your name and school.'; end if;
  update college_coaches set name = left(trim(my_name), 60), title = left(trim(coalesce(p_title, '')), 80),
    school = left(trim(p_school), 100), program = left(trim(coalesce(p_program, '')), 80), division = coalesce(p_division, ''),
    status = case when status = 'declined' then 'pending' else status end
  where id = auth.uid();
  update members set name = left(trim(my_name), 60) where id = auth.uid();
end $$;

drop policy if exists cc_read on public.college_coaches;
create policy cc_read on public.college_coaches for select to authenticated using (id = auth.uid() or is_platform_admin());

-- only approved college coaches (and club coaches) list opportunities
create or replace function public.can_list_opportunities() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.members where id = auth.uid() and role in ('admin','coach') and club_id is not null)
      or is_college()
$$;

-- the approvals list: pro scouts and college coaches together
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
  if not (hit or found) then raise exception 'Account not found.'; end if;
end $$;
