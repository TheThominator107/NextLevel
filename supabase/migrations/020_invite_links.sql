-- NextPass update 020: invite links
-- Paste into Supabase -> SQL Editor -> New query -> Run. Safe to run more than once.
-- A team invite link (…#team-<team id>) shows the family which team and club
-- they're joining. The family still sends a join request and a coach approves it,
-- so the link only fills in the search; it doesn't add anyone to the team.

create or replace function public.team_invite_info(p_team uuid) returns json
language sql stable security definer set search_path = public as $$
  select json_build_object('team_id', t.id, 'team_name', t.name, 'age_group', t.age_group,
                           'club_id', c.id, 'club_name', c.name)
  from public.teams t join public.clubs c on c.id = t.club_id
  where t.id = p_team;
$$;

revoke all on function public.team_invite_info(uuid) from public;
grant execute on function public.team_invite_info(uuid) to anon, authenticated;

-- Done. You should see "Success. No rows returned".
