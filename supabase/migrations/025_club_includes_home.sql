-- NextPass update 025: every club plan includes Home Drills; $4.99 full access for players without a club
-- Paste into Supabase -> SQL Editor -> New query -> Run. Safe to run more than once.
--   * Families with a player on a club's team get the full home drill library and the recruiting
--     portal through the club. The "families subscribe themselves" club setting is retired.
--   * Families without a club get both with full access ($4.99 a month, members.family_plan).
--   * A player only shows in college, pro and youth-club searches while their family has access.

-- every club includes Home Drills from now on
update public.clubs set family_access = 'included' where family_access <> 'included';

-- full access: coaches, families on the $4.99 plan, or families with a player in any club
create or replace function public.has_home_training() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from members m where m.id = auth.uid() and (m.role in ('admin','coach') or m.family_plan is not null))
      or exists (select 1 from family_club_ids())
$$;

-- does this player's family have access (a club, or the $4.99 plan)?
create or replace function public.player_has_access(pid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from players where id = pid and club_id is not null)
      or exists (select 1 from family_links f join members m on m.id = f.member_id
                 where f.player_id = pid and m.family_plan is not null)
$$;

-- college search: unchanged rules, plus the family has access
create or replace function public.is_discoverable(pid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(player_age(pid), 0) >= 16 and player_has_access(pid) and exists (
    select 1 from player_profiles where player_id = pid and visibility = 'public'
      and coalesce(recruit->>'created', '') = 'true' and coalesce(recruit->>'searchable', '') = 'true')
$$;

-- pro and youth-club search: unchanged rules, plus the family has access
create or replace function public.is_listed(pid uuid, sec text) returns boolean
language sql stable security definer set search_path = public as $$
  select case sec
    when 'college' then is_discoverable(pid)
    when 'pro' then coalesce(player_age(pid), 0) >= 16 and player_has_access(pid) and exists (
      select 1 from player_profiles where player_id = pid and visibility = 'public'
        and coalesce(recruit->>'created', '') = 'true' and coalesce(recruit->'pro'->>'searchable', '') = 'true')
    when 'youth' then player_has_access(pid) and exists (
      select 1 from player_profiles where player_id = pid
        and coalesce(recruit->>'created', '') = 'true' and coalesce(recruit->'youth'->>'searchable', '') = 'true')
    else false end
$$;
