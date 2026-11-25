-- NextPass update 030: families can view a team session's drill plan
-- Paste into Supabase -> SQL Editor -> New query -> Run. Safe to run more than once.
-- team_calendar() now also returns the session's drills (with the coach's note on each drill),
-- so players and parents can open "View session" on the calendar. It stays read-only for them,
-- and the session notes (equipment, who's missing, reminders) stay private to coaches.

create or replace function public.team_calendar() returns json
language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(json_build_object(
           'id', s.id, 'team_id', s.team_id, 'title', s.title, 'session_date', s.session_date,
           'start_time', s.start_time, 'minutes', s.minutes, 'location', s.location, 'focus', s.focus,
           'blocks', s.blocks)
         order by s.session_date, s.start_time), '[]'::json)
  from team_sessions s
  where s.on_calendar and s.session_date is not null and s.team_id is not null
    and s.session_date >= current_date - 90
    and (
      (is_staff() and s.club_id = my_club())
      or exists (select 1 from players p join family_links f on f.player_id = p.id
                 where f.member_id = auth.uid() and p.team_id = s.team_id and p.club_id = s.club_id)
    )
$$;
grant execute on function public.team_calendar() to authenticated;

-- Done. You should see "Success. No rows returned".
