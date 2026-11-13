-- NextPlay update 007: assign coaches to teams; private messages & meetings only for a player's own team coaches
-- Paste into Supabase -> SQL Editor -> New query -> Run. Safe to run more than once.
-- After this, a coach sees private conversations and meetings only for players on teams they're assigned to.
-- The club admin still sees all of them (safeguarding oversight). Coaches who aren't assigned to any team
-- yet will see no private conversations until the club admin assigns them on the Club page.

create table if not exists public.team_coaches (
  team_id   uuid not null references public.teams(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  primary key (team_id, member_id)
);
create index if not exists team_coaches_member_idx on public.team_coaches (member_id);

create or replace function public.is_club_staff(mid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from members where id = mid and club_id = my_club() and role in ('admin','coach'))
$$;

-- who may see a player's private chat and meetings
create or replace function public.can_message_player(pid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from players p
    where p.id = pid and p.club_id = my_club()
      and (
        is_admin()
        or (is_staff() and exists (select 1 from team_coaches tc where tc.team_id = p.team_id and tc.member_id = auth.uid()))
        or pid in (select my_player_ids())
      )
  )
$$;

alter table public.team_coaches enable row level security;
drop policy if exists team_coaches_read on public.team_coaches;
create policy team_coaches_read on public.team_coaches for select to authenticated using (team_in_my_club(team_id));
-- the admin assigns anyone on staff; a coach can add or remove themselves
drop policy if exists team_coaches_insert on public.team_coaches;
create policy team_coaches_insert on public.team_coaches for insert to authenticated
  with check (team_in_my_club(team_id) and is_club_staff(member_id) and (is_admin() or (is_staff() and member_id = auth.uid())));
drop policy if exists team_coaches_delete on public.team_coaches;
create policy team_coaches_delete on public.team_coaches for delete to authenticated
  using (team_in_my_club(team_id) and (is_admin() or member_id = auth.uid()));

-- meetings: replace "any coach in the club" with "this player's team coaches, the admin, and the family"
drop policy if exists meetings_read on public.meetings;
create policy meetings_read on public.meetings for select to authenticated using (can_message_player(player_id));
drop policy if exists meetings_insert on public.meetings;
create policy meetings_insert on public.meetings for insert to authenticated
  with check (can_message_player(player_id) and club_id = my_club() and created_by = auth.uid());
drop policy if exists meetings_update on public.meetings;
create policy meetings_update on public.meetings for update to authenticated
  using (can_message_player(player_id)) with check (can_message_player(player_id) and club_id = my_club());
drop policy if exists meetings_delete on public.meetings;
create policy meetings_delete on public.meetings for delete to authenticated
  using (can_message_player(player_id) and (created_by = auth.uid() or is_admin()));

-- private messages: same people
drop policy if exists pm_read on public.private_messages;
create policy pm_read on public.private_messages for select to authenticated using (can_message_player(player_id));
drop policy if exists pm_insert on public.private_messages;
create policy pm_insert on public.private_messages for insert to authenticated
  with check (
    author_id = auth.uid() and club_id = my_club() and can_message_player(player_id)
    and (meeting_id is null or meeting_matches(meeting_id, player_id))
  );
drop policy if exists pm_delete on public.private_messages;
create policy pm_delete on public.private_messages for delete to authenticated
  using (can_message_player(player_id) and (author_id = auth.uid() or is_admin()));

do $$ begin
  begin alter publication supabase_realtime add table public.team_coaches; exception when duplicate_object then null; end;
end $$;

-- Done. You should see "Success. No rows returned".
