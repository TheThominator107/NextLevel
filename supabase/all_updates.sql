-- NextPlay: ALL database updates (002 to 015) in one file.
-- Paste into Supabase -> SQL Editor -> New query -> Run.
-- Safe to run no matter which updates you have already run, and safe to run more than once.
-- If Supabase asks you to confirm a 'destructive operation', click 'Run this query' (it only removes old, unused parts).


-- =================== 002_review_updates.sql ===================
-- NextPlay update 002: review update notes + protect review history
-- Paste into Supabase -> SQL Editor -> New query -> Run. Safe to run more than once.

-- 1. A short "what changed" note saved with every review
alter table public.reviews
  add column if not exists summary text not null default ''
  check (char_length(summary) <= 280);

-- 2. Review history is permanent: only the club admin can delete a review
drop policy if exists reviews_del on public.reviews;
create policy reviews_del on public.reviews for delete to authenticated
  using (club_id = my_club() and is_admin());

-- 3. Nobody can edit a past review (no update policy exists, so updates are refused).
--    A new review is always added instead, so every step of progress is kept.

-- Done. You should see "Success. No rows returned".

-- =================== 003_family_drills.sql ===================
-- NextPlay update 003: families can add recommended home drills to their own player's week
-- Paste into Supabase -> SQL Editor -> New query -> Run. Safe to run more than once.

drop policy if exists assign_family_insert on public.assignments;
create policy assign_family_insert on public.assignments for insert to authenticated
  with check (
    not is_staff()
    and club_id = my_club()
    and player_id in (select my_player_ids())
    and assigned_by = auth.uid()
  );

-- families can remove drills they added themselves (not ones the coach assigned)
drop policy if exists assign_family_delete on public.assignments;
create policy assign_family_delete on public.assignments for delete to authenticated
  using (assigned_by = auth.uid() and player_id in (select my_player_ids()));

-- Done. You should see "Success. No rows returned".

-- =================== 004_contact_messages.sql ===================
-- NextPlay update 004: "Contact Us" form messages
-- Paste into Supabase -> SQL Editor -> New query -> Run. Safe to run more than once.
-- Read messages in Supabase -> Table Editor -> contact_messages. Visitors can send but never read them.

create table if not exists public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 80),
  email      text not null check (char_length(email) between 3 and 120 and position('@' in email) > 1),
  role       text not null default '' check (char_length(role) <= 40),
  club       text not null default '' check (char_length(club) <= 120),
  topic      text not null default '' check (char_length(topic) <= 40),
  message    text not null check (char_length(message) between 1 and 2000),
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

drop policy if exists contact_insert on public.contact_messages;
create policy contact_insert on public.contact_messages for insert to anon, authenticated with check (true);
-- No read policy on purpose: only you (in the Supabase dashboard) can read messages.

grant insert on public.contact_messages to anon, authenticated;

-- Done. You should see "Success. No rows returned".

-- =================== 005_drill_paywall.sql ===================
-- NextPlay update 005: drill instructions behind the Home Training paywall
-- Paste into Supabase -> SQL Editor -> New query -> Run. Safe to run more than once.
-- Step-by-step instructions now live here; only coaches and families with Home Training can read them.

create table if not exists public.drill_steps (
  drill_id text primary key,
  steps    text[] not null default '{}'
);

-- Who has Home Training: coaches/admins (Club plan), families whose club includes it,
-- and families on the family plan.
create or replace function public.has_home_training() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from members m join clubs c on c.id = m.club_id
    where m.id = auth.uid()
      and (m.role in ('admin','coach') or c.family_access = 'included' or m.family_plan is not null)
  )
$$;

alter table public.drill_steps enable row level security;
drop policy if exists drill_steps_read on public.drill_steps;
create policy drill_steps_read on public.drill_steps for select to authenticated using (has_home_training());
revoke all on public.drill_steps from anon;

-- the built-in drill library (35 drills)
insert into public.drill_steps (drill_id, steps) values
  ($s$b-toe-taps$s$, array[$s$Ball still in front of you, tap the top with the sole of each foot in turn.$s$, $s$Stay on the balls of your feet and keep your head up.$s$, $s$3 rounds of 30 seconds, 30 seconds rest.$s$, $s$Make it harder: move the ball in a circle while tapping.$s$]),
  ($s$b-sole-roll$s$, array[$s$Roll the ball across your body with the sole, side to side.$s$, $s$Add a pull-back: drag it back with the sole and push forward with the laces.$s$, $s$Alternate feet every 5 reps.$s$, $s$3 rounds of 45 seconds.$s$]),
  ($s$b-juggle$s$, array[$s$Count your best juggle with any surface.$s$, $s$Then try feet only, then alternating feet.$s$, $s$Write down your record each time.$s$, $s$Goal: add 5 to your record each week.$s$]),
  ($s$b-first-touch$s$, array[$s$Put a cone 2 yards to your left and one 2 yards to your right.$s$, $s$Pass at the wall; as it comes back, take your first touch past one cone with your back foot.$s$, $s$Alternate sides each rep.$s$, $s$20 reps each side. Open your hips before the ball arrives.$s$]),
  ($s$b-volley$s$, array[$s$Toss the ball up to yourself (or have a helper toss it).$s$, $s$Cushion it down with your thigh or foot, then strike it at the wall or goal.$s$, $s$Next, strike it on the half-volley as it bounces: knee over the ball, toes down.$s$, $s$3 sets of 10. Count clean strikes.$s$]),
  ($s$b-wall-pass$s$, array[$s$Stand 3 to 5 yards from a wall.$s$, $s$Pass with the inside of your right foot, take one touch to control, pass again.$s$, $s$Do 25 passes, then switch to your left foot for 25.$s$, $s$Make it harder: step back to 8 yards and use one touch only.$s$]),
  ($s$b-long-pass$s$, array[$s$Make a 3x3 yard box with cones 20 to 30 yards away.$s$, $s$Strike the ball into the box: lean slightly back, lock your ankle, strike through the middle-bottom.$s$, $s$10 with each foot. Count how many land in the box.$s$, $s$Make it harder: move the box further away or to the side.$s$]),
  ($s$b-weak-foot$s$, array[$s$For one session, touch the ball with your weaker foot only.$s$, $s$Do 2 minutes each of: taps, rolls, wall passes, short dribbles.$s$, $s$Finish with 10 shots with the weak foot.$s$, $s$Note which part felt hardest for your coach.$s$]),
  ($s$b-targets$s$, array[$s$Mark the 4 corners of a goal or wall with tape or objects.$s$, $s$From 12 yards, aim for a corner with the inside of the foot.$s$, $s$Then laces, keeping your knee over the ball.$s$, $s$Score 1 point per corner hit. Best of 20.$s$]),
  ($s$b-dribble-shoot$s$, array[$s$Dribble through 3 cones, then take one touch to set the ball out of your feet.$s$, $s$Shoot within 2 touches of the last cone.$s$, $s$Pick your corner before you strike, and follow your shot in.$s$, $s$10 reps; alternate the foot you shoot with.$s$]),
  ($s$b-cone-weave$s$, array[$s$Set 6 cones in a line, 1 to 2 yards apart.$s$, $s$Weave through using only your right foot, then only your left.$s$, $s$Then use inside and outside of the same foot.$s$, $s$Time 3 runs each way and try to beat your best.$s$]),
  ($s$b-speed-dribble$s$, array[$s$Set two cones 20 yards apart.$s$, $s$Dribble as fast as you can, touching the ball every 2 to 3 steps with your laces.$s$, $s$Stop the ball dead on the far line, turn, race back.$s$, $s$6 runs with full rest. Time them and try to beat your best.$s$]),
  ($s$b-change-pace$s$, array[$s$Dribble slowly toward a cone as if it's a defender.$s$, $s$At 1 yard away, do a move (scissor, drop of the shoulder or cut) and explode away for 5 yards.$s$, $s$The burst is the point: go from slow to full speed in 2 touches.$s$, $s$10 reps each direction.$s$]),
  ($s$b-shield$s$, array[$s$Keep the ball on your far foot with your body between it and the helper.$s$, $s$Arm out for balance, knees bent, keep turning your back to them.$s$, $s$Rounds of 30 seconds: can you keep it?$s$, $s$Switch roles after each round.$s$]),
  ($s$b-1v1-line$s$, array[$s$Make a channel 8 yards wide and 15 yards long.$s$, $s$Attacker tries to stop the ball on the far line; defender tries to win it.$s$, $s$Attacker: change speed, don't just change direction. Defender: side-on, stay patient.$s$, $s$Best of 10, then swap roles.$s$]),
  ($s$b-5-10-5$s$, array[$s$Set 3 cones in a line, 5 yards apart.$s$, $s$Start at the middle, sprint 5 yards right and touch the line.$s$, $s$Sprint 10 yards left, then 5 back to the middle.$s$, $s$6 reps with full rest. Low hips on each turn.$s$]),
  ($s$b-first-step$s$, array[$s$Start side-on or facing away from a cone 5 yards ahead.$s$, $s$On a clap or call, turn and sprint to the cone. Short, quick first steps; drive your arms.$s$, $s$Rest 30 seconds between reps.$s$, $s$8 reps. The first 2 steps matter most.$s$]),
  ($s$b-strength$s$, array[$s$30 seconds each, 30 seconds rest: squats, forward lunges, glute bridges, plank, side plank (each side).$s$, $s$Then 30 seconds balancing on one leg, eyes closed if you can (each leg).$s$, $s$Go through the circuit twice.$s$, $s$Good form beats speed. Stop if anything hurts.$s$]),
  ($s$b-recovery$s$, array[$s$Stand at a cone 'in attack'. A helper calls 'Lost it!'.$s$, $s$Sprint back past a cone 15 yards behind you, then turn and face forward in a defending stance.$s$, $s$Get goal-side first, then slow down and get side-on.$s$, $s$8 reps with a walk-back rest.$s$]),
  ($s$b-jockey$s$, array[$s$Side-on stance, knees bent, weight on the balls of your feet.$s$, $s$Shuffle backward and sideways between two cones 5 yards apart without crossing your feet.$s$, $s$20 seconds on, 20 seconds off, 6 rounds.$s$, $s$Add a helper dribbling at you at walking pace.$s$]),
  ($s$b-scan$s$, array[$s$A helper stands behind you and holds up fingers.$s$, $s$Check over your shoulder before each pass arrives and call the number.$s$, $s$Then receive and pass back to the wall.$s$, $s$Aim for 2 checks before every touch.$s$]),
  ($s$b-color-gates$s$, array[$s$Make 3 small gates out of coloured cones around you.$s$, $s$Dribble in the middle. When the helper calls a colour, dribble through that gate as fast as you can.$s$, $s$Keep your head up so you already know where each gate is.$s$, $s$Make it harder: the helper holds up a colour instead of calling it.$s$]),
  ($s$b-pro-watch$s$, array[$s$Pick one player who plays your position and watch only them for 10 minutes.$s$, $s$Note where they stand when their team has the ball, and where they go when it's lost.$s$, $s$Count how often they check their shoulder before receiving.$s$, $s$Write down 3 things you'll copy and share them with your coach.$s$]),
  ($s$b-draw-shape$s$, array[$s$Draw a field and your team's formation.$s$, $s$Mark where you stand when we have the ball, and where you go when we lose it.$s$, $s$Draw one arrow for your best run and one for your best pass.$s$, $s$Bring it to practice and ask your coach if you got it right.$s$]),
  ($s$b-talk$s$, array[$s$Pass back and forth with a helper.$s$, $s$Before each pass, they call 'Man on!', 'Time!' or 'Turn!'.$s$, $s$You react: one-touch pass back, take a touch and look up, or turn away.$s$, $s$Swap roles so you practise giving loud, short, clear calls too.$s$]),
  ($s$b-reflect$s$, array[$s$After each practice or game, write 3 short lines.$s$, $s$1: One thing my coach asked me to do. 2: One thing that went well. 3: One thing I'll try next time.$s$, $s$Read last week's notes before your next session.$s$, $s$Show your coach once a month.$s$]),
  ($s$g-set-catch$s$, array[$s$Set position: feet shoulder-width, knees soft, weight forward, hands in front.$s$, $s$A helper throws or kicks at chest, waist and head height.$s$, $s$Catch with a 'W' (thumbs behind the ball) above the waist and scoop below it.$s$, $s$3 sets of 10. Get set before every shot.$s$]),
  ($s$g-w-catch$s$, array[$s$Throw the ball at a wall and catch the rebound with a W-catch at head height.$s$, $s$Then a basket catch at your chest, then a scoop from the ground.$s$, $s$10 of each, then mix them up.$s$, $s$Make it harder: stand closer to the wall.$s$]),
  ($s$g-collapse$s$, array[$s$On grass or a mat only. Start kneeling: the helper rolls the ball to your side; fall on your side and catch it, hands first.$s$, $s$Next from a crouch, then from standing.$s$, $s$Land on your side (hip and shoulder), never on your elbow or stomach.$s$, $s$5 each side at each stage. Stop if it hurts.$s$]),
  ($s$g-reaction$s$, array[$s$Stand 3 yards from a wall in your set position.$s$, $s$A helper throws a tennis ball at the wall from behind you; react and catch the rebound.$s$, $s$Stay low and balanced; move your feet before your hands.$s$, $s$3 rounds of 10.$s$]),
  ($s$g-angles$s$, array[$s$Mark two posts and place 3 cones in an arc 12 yards out.$s$, $s$A helper stands on a cone. Move so you're on the line between the ball and the middle of the goal.$s$, $s$Take 1 to 2 steps off your line toward the ball. Check the angle by turning your head.$s$, $s$Helper moves to a new cone every 10 seconds.$s$]),
  ($s$g-shuffle$s$, array[$s$Shuffle sideways between two cones 3 yards apart without crossing your feet.$s$, $s$On a call of 'Set!', stop and get into your set position.$s$, $s$The helper throws a ball for you to catch right away.$s$, $s$6 rounds of 30 seconds.$s$]),
  ($s$g-distribution$s$, array[$s$Roll the ball along the ground to a target 15 yards away, 10 times.$s$, $s$Then sidearm throws to 20 yards, then overarm throws to 25+ yards.$s$, $s$Finish with 10 kicks from your hands or the ground to a target.$s$, $s$Count how many reach the target.$s$]),
  ($s$g-come-stay$s$, array[$s$A helper throws high balls into your area from the side.$s$, $s$Decide early: call 'KEEPER!' and attack the ball at its highest point, or call 'AWAY!' and stay set.$s$, $s$Take off from one foot, knee up for protection.$s$, $s$10 balls each side.$s$]),
  ($s$g-organiser$s$, array[$s$Watch 10 minutes of a match as if you're the keeper.$s$, $s$Say out loud what you'd tell your defenders: 'Push up!', 'Mark 9!', 'Time!', 'Away!'.$s$, $s$Keep calls short, loud and early.$s$, $s$Practise the same calls in your next session.$s$])
on conflict (drill_id) do update set steps = excluded.steps;

-- Done. You should see "Success. No rows returned".

-- =================== 006_private_messages_meetings.sql ===================
-- NextPlay update 006: private coach / player / parent chat + meeting room
-- Paste into Supabase -> SQL Editor -> New query -> Run. Safe to run more than once.
-- Who can see a player's private chat and meetings: the club's coaches and that player's own family accounts
-- (parents and the player's own login). Nobody else - not other families, not other clubs.

create table if not exists public.meetings (
  id              uuid primary key default gen_random_uuid(),
  club_id         uuid not null references public.clubs(id) on delete cascade,
  player_id       uuid not null references public.players(id) on delete cascade,
  topic           text not null check (char_length(topic) between 1 and 120),
  review_id       uuid references public.reviews(id) on delete set null,
  details         text not null default '' check (char_length(details) <= 2000),
  preferred_times text not null default '' check (char_length(preferred_times) <= 300),
  status          text not null default 'requested' check (status in ('requested','scheduled','done','cancelled')),
  scheduled_at    timestamptz,
  location        text not null default '' check (char_length(location) <= 300),
  notes           text not null default '' check (char_length(notes) <= 4000),
  created_by      uuid references auth.users(id) on delete set null,
  created_by_name text not null default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.private_messages (
  id          uuid primary key default gen_random_uuid(),
  club_id     uuid not null references public.clubs(id) on delete cascade,
  player_id   uuid not null references public.players(id) on delete cascade,
  meeting_id  uuid references public.meetings(id) on delete cascade,
  author_id   uuid references auth.users(id) on delete set null,
  author_name text not null default '',
  role        text not null default '',
  text        text not null check (char_length(text) between 1 and 2000),
  created_at  timestamptz not null default now()
);

create index if not exists meetings_player_idx on public.meetings (player_id);
create index if not exists meetings_club_idx on public.meetings (club_id);
create index if not exists pm_player_idx on public.private_messages (player_id, created_at desc);
create index if not exists pm_club_idx on public.private_messages (club_id, created_at desc);
create index if not exists pm_meeting_idx on public.private_messages (meeting_id);

create or replace function public.meeting_matches(mid uuid, pid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from meetings where id = mid and player_id = pid)
$$;

alter table public.meetings enable row level security;
alter table public.private_messages enable row level security;

-- meetings: coaches + this player's family can see, create and update; only the creator or a coach can delete
drop policy if exists meetings_read on public.meetings;
create policy meetings_read on public.meetings for select to authenticated using (can_see_player(player_id));
drop policy if exists meetings_insert on public.meetings;
create policy meetings_insert on public.meetings for insert to authenticated
  with check (can_see_player(player_id) and club_id = my_club() and created_by = auth.uid());
drop policy if exists meetings_update on public.meetings;
create policy meetings_update on public.meetings for update to authenticated
  using (can_see_player(player_id)) with check (can_see_player(player_id) and club_id = my_club());
drop policy if exists meetings_delete on public.meetings;
create policy meetings_delete on public.meetings for delete to authenticated
  using (can_see_player(player_id) and (created_by = auth.uid() or is_staff()));

-- private messages: same people; you post as yourself; a meeting message must belong to that player's meeting
drop policy if exists pm_read on public.private_messages;
create policy pm_read on public.private_messages for select to authenticated using (can_see_player(player_id));
drop policy if exists pm_insert on public.private_messages;
create policy pm_insert on public.private_messages for insert to authenticated
  with check (
    author_id = auth.uid() and club_id = my_club() and can_see_player(player_id)
    and (meeting_id is null or meeting_matches(meeting_id, player_id))
  );
drop policy if exists pm_delete on public.private_messages;
create policy pm_delete on public.private_messages for delete to authenticated
  using (can_see_player(player_id) and (author_id = auth.uid() or is_admin()));

-- live updates
do $$ begin
  begin alter publication supabase_realtime add table public.meetings; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.private_messages; exception when duplicate_object then null; end;
end $$;

-- Done. You should see "Success. No rows returned".

-- =================== 007_team_coaches.sql ===================
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

-- =================== 008_public_private_profiles.sql ===================
-- NextPlay update 008: profiles are Public or Private
-- Paste into Supabase -> SQL Editor -> New query -> Run. Safe to run more than once.
-- Public:  the shareable profile (photo, positions, strengths, bio, videos, club history, coach references).
-- Private: the shareable link shows only the player's name, club and age.
-- Never shared on either: coach reviews, ratings, home drills, private messages and meetings.

-- the old "club only" setting becomes Private
update public.player_profiles set visibility = 'private' where visibility = 'club';

create or replace function public.get_public_profile(p_slug text) returns json
language plpgsql stable security definer set search_path = public as $$
declare pr player_profiles; pl players; insider boolean; cname text; age int;
begin
  select * into pr from player_profiles where slug = p_slug;
  if not found then return json_build_object('status', 'missing'); end if;
  select * into pl from players where id = pr.player_id;
  select name into cname from clubs where id = pr.club_id;
  age := case when pl.birth_year is null then null else extract(year from now())::int - pl.birth_year end;

  insider := auth.uid() is not null and pr.club_id = my_club()
             and (is_staff() or pr.player_id in (select my_player_ids()));

  if pr.visibility <> 'public' and not insider then
    -- Private: name, club and age only
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

grant execute on function public.get_public_profile(text) to anon, authenticated;

-- Done. You should see "Success. No rows returned".

-- =================== 009_family_owned_players.sql ===================
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

-- =================== 010_player_setup_and_search.sql ===================
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

-- =================== 011_recruitment_profile.sql ===================
-- NextPlay update 011: the Recruitment Profile
-- Paste into Supabase -> SQL Editor -> New query -> Run. Safe to run more than once.
-- Needs updates 009 and 010 first.
--
--  * The player profile (photo, positions, strengths, bio) is now only for the family and the player's coaches.
--  * Families can create a separate Recruitment Profile: recruiting summary, graduation year, height, weight,
--    school, GPA, a contact email for coaches, career highlights, season stats, highlight videos, club history
--    and coach references.
--  * The shareable link shows the Recruitment Profile only once it is created and set to Public.
--    Otherwise it shows just the player's name, club and age.

alter table public.player_profiles add column if not exists recruit jsonb not null default '{}'::jsonb;

do $$ begin
  alter table public.player_profiles add constraint player_profiles_recruit_size check (pg_column_size(recruit) < 60000);
exception when duplicate_object then null; end $$;

-- profiles that were public before this update stay hidden until the family creates a Recruitment Profile
create or replace function public.get_public_profile(p_slug text) returns json
language plpgsql stable security definer set search_path = public as $$
declare pr player_profiles; pl players; insider boolean; cname text; age int; live boolean;
begin
  select * into pr from player_profiles where slug = p_slug;
  if not found then return json_build_object('status', 'missing'); end if;
  select * into pl from players where id = pr.player_id;
  select name into cname from clubs where id = pl.club_id;
  age := coalesce(age_on(pl.birth_date), case when pl.birth_year is null then null else extract(year from now())::int - pl.birth_year end);
  insider := auth.uid() is not null and (is_my_player(pl.id) or staff_has_player(pl.id));
  live := pr.visibility = 'public' and coalesce(pr.recruit->>'created', '') = 'true';

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

grant execute on function public.get_public_profile(text) to anon, authenticated;

-- Done. You should see "Success. No rows returned".

-- =================== 012_coach_recruiting.sql ===================
-- NextPlay update 012: coach recruiting (find players, shortlist, invite to a team)
-- Paste into Supabase -> SQL Editor -> New query -> Run. Safe to run more than once.
-- Needs updates 009, 010 and 011 first.
--
--  * Coaches and club admins can search Recruitment Profiles, but only those the family has made Public
--    AND chosen to show in coach search (recruit.searchable). Nothing else about a player is searchable.
--  * Each club keeps a shared shortlist with a status, season, team and notes. Only that club's staff see it.
--  * A coach can invite a listed player to one of the club's teams. The family sees the invitation and can
--    accept (the player joins the team) or decline. Families can turn search off at any time; the player
--    then disappears from search and from shortlists' details.

-- ---------- tables ----------------------------------------------------------

create table if not exists public.recruit_shortlist (
  id            uuid primary key default gen_random_uuid(),
  club_id       uuid not null references public.clubs(id) on delete cascade,
  player_id     uuid not null references public.players(id) on delete cascade,
  team_id       uuid references public.teams(id) on delete set null,
  season        text not null default '' check (char_length(season) <= 40),
  status        text not null default 'watching' check (status in ('watching','contacted','trial','offered','signed','passed')),
  note          text not null default '' check (char_length(note) <= 1000),
  added_by      uuid references auth.users(id) on delete set null,
  added_by_name text not null default '',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (club_id, player_id)
);
create index if not exists shortlist_club_idx on public.recruit_shortlist (club_id);

create table if not exists public.club_invites (
  id           uuid primary key default gen_random_uuid(),
  club_id      uuid not null references public.clubs(id) on delete cascade,
  team_id      uuid references public.teams(id) on delete set null,
  player_id    uuid not null references public.players(id) on delete cascade,
  club_name    text not null default '',
  team_name    text not null default '',
  player_name  text not null default '',
  season       text not null default '' check (char_length(season) <= 40),
  message      text not null default '' check (char_length(message) <= 1000),
  status       text not null default 'pending' check (status in ('pending','accepted','declined','withdrawn')),
  sent_by      uuid references auth.users(id) on delete set null,
  sent_by_name text not null default '',
  created_at   timestamptz not null default now(),
  decided_at   timestamptz
);
create index if not exists invites_club_idx on public.club_invites (club_id, status);
create index if not exists invites_player_idx on public.club_invites (player_id, status);

-- ---------- helpers ---------------------------------------------------------

-- public, created and opted in to coach search
create or replace function public.is_discoverable(pid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from player_profiles where player_id = pid and visibility = 'public'
                 and coalesce(recruit->>'created', '') = 'true' and coalesce(recruit->>'searchable', '') = 'true')
$$;

-- ---------- row level security ----------------------------------------------

alter table public.recruit_shortlist enable row level security;
alter table public.club_invites enable row level security;

drop policy if exists sl_read on public.recruit_shortlist;
create policy sl_read on public.recruit_shortlist for select to authenticated using (club_id = my_club() and is_staff());
drop policy if exists sl_insert on public.recruit_shortlist;
create policy sl_insert on public.recruit_shortlist for insert to authenticated
  with check (club_id = my_club() and is_staff() and is_discoverable(player_id) and added_by = auth.uid()
              and (team_id is null or team_in_my_club(team_id)));
drop policy if exists sl_update on public.recruit_shortlist;
create policy sl_update on public.recruit_shortlist for update to authenticated
  using (club_id = my_club() and is_staff())
  with check (club_id = my_club() and (team_id is null or team_in_my_club(team_id)));
drop policy if exists sl_delete on public.recruit_shortlist;
create policy sl_delete on public.recruit_shortlist for delete to authenticated using (club_id = my_club() and is_staff());

-- invitations: the club's staff and the player's family can read them; changes go through the functions below
drop policy if exists inv_read on public.club_invites;
create policy inv_read on public.club_invites for select to authenticated
  using ((club_id = my_club() and is_staff()) or is_my_player(player_id));

-- ---------- search ----------------------------------------------------------

create or replace function public.search_recruits(
  q text default '', p_positions text[] default '{}', age_min int default null, age_max int default null,
  grad int default null, p_foot text default '', p_location text default '', open_only boolean default false,
  video_only boolean default false) returns json
language plpgsql stable security definer set search_path = public as $$
declare cid uuid := my_club(); s text := lower(trim(coalesce(q, ''))); loc text := lower(trim(coalesce(p_location, '')));
begin
  if not is_staff() then raise exception 'Only coaches can search for players.'; end if;
  return coalesce((select json_agg(r order by r->>'updated_at' desc) from (
    select json_build_object(
      'player_id', pl.id, 'slug', pr.slug, 'name', pl.name,
      'age', coalesce(age_on(pl.birth_date), case when pl.birth_year is null then null else extract(year from now())::int - pl.birth_year end),
      'positions', pr.positions, 'foot', pr.foot, 'photo', pr.photo,
      'grad_year', pr.recruit->>'gradYear', 'height', pr.recruit->>'height', 'location', pr.recruit->>'location',
      'summary', left(coalesce(nullif(pr.recruit->>'summary', ''), pr.bio), 220),
      'open', coalesce(pr.recruit->>'open', '') = 'true',
      'videos', jsonb_array_length(pr.videos),
      'highlights', coalesce(jsonb_array_length(pr.recruit->'highlights'), 0),
      'club_name', coalesce((select name from clubs where id = pl.club_id),
                            (select h->>'club' from jsonb_array_elements(pr.history) h where h->>'to' = 'Present' limit 1)),
      'team_name', (select name from teams where id = pl.team_id),
      'mine', pl.club_id is not null and pl.club_id = cid,
      'shortlisted', exists (select 1 from recruit_shortlist sl where sl.club_id = cid and sl.player_id = pl.id),
      'invited', exists (select 1 from club_invites ci where ci.club_id = cid and ci.player_id = pl.id and ci.status = 'pending'),
      'updated_at', pr.updated_at) as r
    from player_profiles pr join players pl on pl.id = pr.player_id
    where pr.visibility = 'public' and coalesce(pr.recruit->>'created', '') = 'true' and coalesce(pr.recruit->>'searchable', '') = 'true'
      and (s = '' or lower(pl.name) like '%' || s || '%' or lower(coalesce(pr.recruit->>'summary', '') || ' ' || pr.bio) like '%' || s || '%'
           or lower(coalesce(pr.recruit->>'school', '')) like '%' || s || '%')
      and (coalesce(array_length(p_positions, 1), 0) = 0 or pr.positions && p_positions)
      and (age_min is null or coalesce(age_on(pl.birth_date), extract(year from now())::int - pl.birth_year) >= age_min)
      and (age_max is null or coalesce(age_on(pl.birth_date), extract(year from now())::int - pl.birth_year) <= age_max)
      and (grad is null or pr.recruit->>'gradYear' = grad::text)
      and (coalesce(p_foot, '') = '' or pr.foot = p_foot or (p_foot <> 'Both' and pr.foot = 'Both'))
      and (loc = '' or lower(coalesce(pr.recruit->>'location', '')) like '%' || loc || '%')
      and (not open_only or coalesce(pr.recruit->>'open', '') = 'true')
      and (not video_only or jsonb_array_length(pr.videos) > 0)
    order by pr.updated_at desc limit 60) x), '[]'::json);
end $$;

-- the club's shortlist, with profile details only while the family still shares them
create or replace function public.my_shortlist() returns json
language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(json_build_object(
    'id', sl.id, 'player_id', sl.player_id, 'team_id', sl.team_id, 'season', sl.season, 'status', sl.status,
    'note', sl.note, 'added_by_name', sl.added_by_name, 'created_at', sl.created_at, 'updated_at', sl.updated_at,
    'shared', is_discoverable(sl.player_id),
    'name', pl.name,
    'slug', case when is_discoverable(sl.player_id) then pr.slug end,
    'age', case when is_discoverable(sl.player_id) then coalesce(age_on(pl.birth_date), extract(year from now())::int - pl.birth_year) end,
    'positions', case when is_discoverable(sl.player_id) then pr.positions else '{}' end,
    'grad_year', case when is_discoverable(sl.player_id) then pr.recruit->>'gradYear' end,
    'location', case when is_discoverable(sl.player_id) then pr.recruit->>'location' end,
    'photo', case when is_discoverable(sl.player_id) then pr.photo end,
    'club_name', case when is_discoverable(sl.player_id) then coalesce((select name from clubs where id = pl.club_id),
                      (select h->>'club' from jsonb_array_elements(pr.history) h where h->>'to' = 'Present' limit 1)) end,
    'mine', pl.club_id is not null and pl.club_id = sl.club_id,
    'invite', (select json_build_object('id', ci.id, 'status', ci.status, 'team_name', ci.team_name) from club_invites ci
               where ci.club_id = sl.club_id and ci.player_id = sl.player_id order by ci.created_at desc limit 1)
  ) order by sl.updated_at desc), '[]'::json)
  from recruit_shortlist sl join players pl on pl.id = sl.player_id left join player_profiles pr on pr.player_id = sl.player_id
  where is_staff() and sl.club_id = my_club()
$$;

-- ---------- invitations -----------------------------------------------------

create or replace function public.send_invite(pid uuid, tid uuid, p_season text, p_message text) returns uuid
language plpgsql security definer set search_path = public as $$
declare t teams; pl players; iid uuid;
begin
  if not is_staff() then raise exception 'Only coaches can send invitations.'; end if;
  if not is_discoverable(pid) then raise exception 'This player''s family isn''t sharing their profile with coaches right now.'; end if;
  select * into t from teams where id = tid and club_id = my_club();
  if not found then raise exception 'Pick one of your club''s teams.'; end if;
  select * into pl from players where id = pid;
  if pl.team_id = tid then raise exception '% is already on this team.', pl.name; end if;
  if exists (select 1 from club_invites where club_id = my_club() and player_id = pid and status = 'pending') then
    raise exception 'You already have an invitation waiting for %.', pl.name; end if;
  insert into club_invites (club_id, team_id, player_id, club_name, team_name, player_name, season, message, sent_by, sent_by_name)
  values (my_club(), t.id, pid, (select name from clubs where id = my_club()), t.name, pl.name,
          left(trim(coalesce(p_season, '')), 40), left(trim(coalesce(p_message, '')), 1000),
          auth.uid(), coalesce((select name from members where id = auth.uid()), ''))
  returning id into iid;
  update recruit_shortlist set status = case when status in ('watching','contacted') then 'offered' else status end, updated_at = now()
    where club_id = my_club() and player_id = pid;
  return iid;
end $$;

create or replace function public.withdraw_invite(iid uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update club_invites set status = 'withdrawn', decided_at = now()
   where id = iid and club_id = my_club() and is_staff() and status = 'pending';
  if not found then raise exception 'Invitation not found.'; end if;
end $$;

-- the family accepts: the player joins that team (leaving any current team); other pending requests are cancelled
create or replace function public.answer_invite(iid uuid, accept boolean) returns text
language plpgsql security definer set search_path = public as $$
declare i club_invites;
begin
  select * into i from club_invites where id = iid;
  if not found or not is_my_player(i.player_id) then raise exception 'Invitation not found.'; end if;
  if i.status <> 'pending' then raise exception 'This invitation was already answered or withdrawn.'; end if;
  if not accept then
    update club_invites set status = 'declined', decided_at = now() where id = iid;
    return i.club_name;
  end if;
  if i.team_id is null or not exists (select 1 from teams where id = i.team_id and club_id = i.club_id) then
    raise exception 'That team no longer exists. Ask the club to send a new invitation.'; end if;
  update players set club_id = i.club_id, team_id = i.team_id where id = i.player_id;
  update club_invites set status = 'accepted', decided_at = now() where id = iid;
  update join_requests set status = 'cancelled', decided_at = now() where player_id = i.player_id and status = 'pending';
  update recruit_shortlist set status = 'signed', updated_at = now() where club_id = i.club_id and player_id = i.player_id;
  return i.club_name;
end $$;

revoke execute on function public.search_recruits(text, text[], int, int, int, text, text, boolean, boolean) from anon;
revoke execute on function public.my_shortlist()                          from anon;
revoke execute on function public.send_invite(uuid, uuid, text, text)     from anon;
revoke execute on function public.withdraw_invite(uuid)                   from anon;
revoke execute on function public.answer_invite(uuid, boolean)            from anon;

do $$ begin
  begin alter publication supabase_realtime add table public.recruit_shortlist; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.club_invites; exception when duplicate_object then null; end;
end $$;

-- Done. You should see "Success. No rows returned".

-- =================== 013_college_recruiting.sql ===================
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

-- =================== 014_more_drills.sql ===================
-- NextPlay update 014: 45 more home drills (step-by-step instructions)
-- Paste into Supabase -> SQL Editor -> New query -> Run. Safe to run more than once.
-- The drill list itself is in the app; this adds the instructions families with Home Training can read.

insert into public.drill_steps (drill_id, steps) values
  ($s$b-inside-outside$s$, array[$s$Push the ball a little to the side with the inside of your right foot, then bring it back with the outside of the same foot.$s$, $s$Keep it close: small touches, the ball never more than a step away.$s$, $s$30 seconds right foot, 30 seconds left foot, 4 rounds.$s$, $s$Make it harder: move forward slowly while you do it, eyes up.$s$]),
  ($s$b-tick-tock$s$, array[$s$Stand over the ball and tap it between the insides of your feet, left-right-left.$s$, $s$Stay on your toes with your knees soft.$s$, $s$Count how many touches you get in 30 seconds. 4 rounds.$s$, $s$Make it harder: move sideways a few steps each way while you tick-tock.$s$]),
  ($s$b-cushion$s$, array[$s$Toss the ball just above head height.$s$, $s$Cushion it with the top of your thigh, then let it drop and stop it with the sole of your foot.$s$, $s$Next, cushion straight off the laces, then the inside of the foot.$s$, $s$10 of each, both legs. Count how many stay within one step of you.$s$]),
  ($s$b-push-stop$s$, array[$s$Set two cones 15 yards apart.$s$, $s$Dribble with small touches. Every 4 or 5 steps, stop the ball dead with your sole, then go again.$s$, $s$Use your right foot down, your left foot back.$s$, $s$6 lengths. Make it harder: a helper calls 'Stop!' at random.$s$]),
  ($s$b-pass-gate$s$, array[$s$Make a gate 1 yard wide with two cones, 5 yards in front of a wall or helper.$s$, $s$Pass through the gate with the inside of your foot: ankle locked, toe up, plant foot beside the ball.$s$, $s$10 with your right, 10 with your left. Count how many go through.$s$, $s$Make it harder: make the gate narrower or step back 2 yards.$s$]),
  ($s$b-laces$s$, array[$s$Place the ball 10 yards from a wall or goal.$s$, $s$Plant your standing foot beside the ball, knee over it, toe pointed down.$s$, $s$Strike through the middle of the ball with your laces and land on your kicking foot.$s$, $s$3 sets of 8, alternating feet. Aim to keep shots below waist height.$s$]),
  ($s$b-quick-feet$s$, array[$s$Make a ladder of 8 squares with chalk, tape or sticks.$s$, $s$Run through with one foot in each square, then two feet in each square.$s$, $s$Then sideways: two feet in, two feet out.$s$, $s$3 runs of each. Stay light on the balls of your feet.$s$]),
  ($s$b-balance$s$, array[$s$Stand on one leg with your knee slightly bent.$s$, $s$Reach your other foot forward, to the side and behind you, tapping the ground lightly each time.$s$, $s$10 reaches on each leg, 3 rounds.$s$, $s$Make it harder: hold a ball out in front of you while you reach.$s$]),
  ($s$b-stance$s$, array[$s$A helper dribbles toward you at walking pace.$s$, $s$Get side-on, knees bent, about an arm's length away. Watch the ball, not their feet.$s$, $s$When the ball rolls a little too far from them, poke it away with your front foot.$s$, $s$10 tries, then swap roles.$s$]),
  ($s$b-weekly-goal$s$, array[$s$At the start of the week, write one thing your coach wants you to improve.$s$, $s$Turn it into a goal you can count, like '50 weak-foot passes a day'.$s$, $s$Tick off each day you do it.$s$, $s$At the end of the week, show your coach how many days you ticked.$s$]),
  ($s$b-call-ball$s$, array[$s$Walk around with a helper who has the ball.$s$, $s$Every time you are open, call their name and 'Yes!' clearly, with a hand out to show where you want it.$s$, $s$They only pass when you call. Receive, then pass it back.$s$, $s$20 calls. Make it harder: jog instead of walk.$s$]),
  ($s$g-scoop$s$, array[$s$A helper rolls the ball at you, or roll it off a wall.$s$, $s$Get your body behind the ball, kneel on one knee or keep your feet together, and scoop it into your chest.$s$, $s$Then practise falling on a slow ball and smothering it with both hands.$s$, $s$10 of each. Body behind the ball every time.$s$]),
  ($s$g-roll-out$s$, array[$s$Set a 2-yard gate 10 yards away.$s$, $s$Step forward, bend low and roll the ball along the ground like a bowler.$s$, $s$It should not bounce. Follow through toward the target.$s$, $s$10 with each hand. Make it harder: move the gate to 15 yards.$s$]),
  ($s$b-four-turns$s$, array[$s$Dribble at a cone and turn just before it.$s$, $s$Practise four turns: inside hook, outside hook, Cruyff and drag-back.$s$, $s$5 of each turn with each foot. Accelerate away for 3 steps after every turn.$s$, $s$Make it harder: a helper calls which turn to do as you arrive.$s$]),
  ($s$b-receive-turn$s$, array[$s$Stand 6 yards from a wall with a cone 5 yards behind you.$s$, $s$Pass to the wall, check your shoulder, then receive on your back foot and turn in one touch.$s$, $s$Dribble round the cone and go again.$s$, $s$10 turns each way. Your first touch should already be moving away.$s$]),
  ($s$b-one-two$s$, array[$s$Dribble toward a cone that is a 'defender' with a wall or helper to the side.$s$, $s$Pass to the wall, sprint past the cone and collect the return in your stride.$s$, $s$Pass with the foot nearest the wall; go as soon as the ball leaves your foot.$s$, $s$8 each side. Make it harder: one-touch return only.$s$]),
  ($s$b-crossing$s$, array[$s$Mark a target zone 6 yards wide, 12 yards from goal or a wall, like a penalty spot area.$s$, $s$Dribble down the side and cross into the zone: plant foot pointing at the target, strike across the ball.$s$, $s$Mix it up: driven low, floated and pulled back.$s$, $s$6 from each side. Count crosses that land in the zone.$s$]),
  ($s$b-first-time$s$, array[$s$Have a helper roll the ball across you, or play it off a wall.$s$, $s$Shoot first time without stopping it. Side-foot for accuracy, laces for power.$s$, $s$Keep your head still and over the ball.$s$, $s$3 sets of 8. Alternate feet.$s$]),
  ($s$b-angle-finish$s$, array[$s$Place cones at three wide angles about 12 yards from goal.$s$, $s$Dribble from each cone toward goal and decide: near post low, or across the keeper to the far post.$s$, $s$Look at the target before you strike.$s$, $s$5 from each cone. Note which finish worked best.$s$]),
  ($s$b-skill-moves$s$, array[$s$Set 3 cones in a line, 4 yards apart.$s$, $s$At each cone do a move: step-over, scissor, then roll and cut.$s$, $s$Sell the move with your shoulders, then explode out of it.$s$, $s$6 runs. Then do every move with your weaker foot.$s$]),
  ($s$b-block-tackle$s$, array[$s$A helper dribbles at you slowly. Stay side-on and patient.$s$, $s$When they take a heavy touch, step in with the inside of your foot, ankle locked, and block through the middle of the ball.$s$, $s$Keep your body over the ball and stay on your feet.$s$, $s$10 tries. Safe and controlled: no sliding.$s$]),
  ($s$b-press-cover$s$, array[$s$Place 4 cones in a square, 10 yards apart. A helper stands on one cone with the ball.$s$, $s$Sprint to press them, then curve your run so you block the pass to one side.$s$, $s$The helper moves to another cone; recover and press again.$s$, $s$6 rounds of 30 seconds. Arrive under control, not flying in.$s$]),
  ($s$b-jump-land$s$, array[$s$Jump up as high as you can and land softly, knees bent and over your toes.$s$, $s$Then jump forward, then side to side over a line.$s$, $s$6 of each, 3 rounds. Quiet landings are good landings.$s$, $s$Make it harder: hop on one leg (3 each side).$s$]),
  ($s$b-scan-switch$s$, array[$s$Put a cone gate on your left and right, both 5 yards away.$s$, $s$Pass to the wall. Before it comes back, a helper points to a gate.$s$, $s$Check your shoulder, see the gate and take your first touch toward it.$s$, $s$20 reps. Make it harder: the helper points later.$s$]),
  ($s$g-low-dive$s$, array[$s$On grass or a mat only. Start in your set position.$s$, $s$The helper rolls or kicks the ball low to your side. Step toward it and dive, hands first, landing on your side.$s$, $s$Bottom hand behind the ball, top hand on top.$s$, $s$5 each side, 3 rounds. Get up and set quickly after every save.$s$]),
  ($s$g-cross-catch$s$, array[$s$A helper throws or chips the ball high toward you from the side.$s$, $s$Take off from one foot, drive the other knee up and catch at the highest point.$s$, $s$Call 'KEEPER!' loudly as you go.$s$, $s$10 from each side. Make it harder: start a few yards off your line.$s$]),
  ($s$g-goal-kicks$s$, array[$s$Set a target zone 30 yards away.$s$, $s$Take 10 goal kicks from the ground: plant foot beside the ball, strike underneath with your laces.$s$, $s$Then 10 drop kicks: drop the ball, strike it just as it touches the ground.$s$, $s$Count how many land in the zone.$s$]),
  ($s$b-switch-play$s$, array[$s$Put cone targets 25 yards to your left and right.$s$, $s$Receive off a wall, check your shoulder, and switch the ball to one target in two touches.$s$, $s$A helper calls 'pressure' on one side; switch to the other.$s$, $s$10 each way. Long and low is better than high and slow.$s$]),
  ($s$b-driven-pass$s$, array[$s$Set a 2-yard target gate 20 yards away and slightly to the side.$s$, $s$Strike across your body with the laces, knee over the ball, so it stays low and fast.$s$, $s$Follow through toward the target and land on your kicking foot.$s$, $s$10 each foot. Count passes through the gate that stay below knee height.$s$]),
  ($s$b-chip$s$, array[$s$Dribble toward goal with a helper or tall cone as the 'keeper' 6 yards out.$s$, $s$Chip over: lean back slightly, stab under the ball with a short follow-through.$s$, $s$Mix it with low finishes so you choose based on the keeper's position.$s$, $s$10 attempts. Note which choice you made and why.$s$]),
  ($s$b-curl$s$, array[$s$Place a 'wall' of cones 10 yards out from 20 yards away.$s$, $s$Strike with the inside of your foot, wrapping round the outside of the ball to curl it.$s$, $s$Aim to bend it round the wall into the corner.$s$, $s$10 each foot. Then try the outside of the foot.$s$]),
  ($s$b-1v1-recover$s$, array[$s$Start 25 yards from goal with a helper 3 yards behind you.$s$, $s$On 'Go!', dribble at speed and finish before they catch you.$s$, $s$Protect the ball with your body if they arrive; shoot early if they don't.$s$, $s$8 reps, then swap roles.$s$]),
  ($s$b-combo-moves$s$, array[$s$Set 5 cones in a zig-zag, 3 yards apart.$s$, $s$At each cone, string two moves together, such as step-over into a drag-back, or a feint into a La Croqueta.$s$, $s$Keep the ball moving fast. Speed comes from small, quick touches.$s$, $s$6 runs, timed. Try to beat your best time with clean moves.$s$]),
  ($s$b-aerial$s$, array[$s$A helper kicks or throws long, high balls to you from 20 yards.$s$, $s$Move your feet early to get under it. Control with chest, thigh or foot, so it drops at your feet.$s$, $s$Second touch must move the ball away into space.$s$, $s$15 balls. Count controls that land within one step.$s$]),
  ($s$b-tight-space$s$, array[$s$Stand facing a wall with a helper right behind you giving light pressure.$s$, $s$Check your shoulder, receive the pass off the wall and keep the ball away from them with your body.$s$, $s$Spin away if they're tight on one side; play it back first time if they're tight behind.$s$, $s$3 rounds of 1 minute. Swap roles.$s$]),
  ($s$b-accel-decel$s$, array[$s$Set cones at 0, 10, 15 and 25 yards.$s$, $s$Sprint to 10, brake hard to a stop by 15 with short choppy steps, then sprint again to 25.$s$, $s$Stay low when you brake: hips back, chest over your knees.$s$, $s$6 reps with full rest. Quality over quantity.$s$]),
  ($s$b-defend-2v1$s$, array[$s$Make a channel 15 yards wide. Two helpers attack you with the ball.$s$, $s$Position yourself to stop the pass between them while slowing the dribbler down.$s$, $s$Delay until help arrives: don't dive in, show them wide, and talk to yourself out loud.$s$, $s$8 rounds. Count how many times they don't score.$s$]),
  ($s$b-third-man$s$, array[$s$Draw three teammates: A passes to B, B lays it off to C, who is already running into space.$s$, $s$Draw two examples from your position: one where you are B and one where you are C.$s$, $s$Watch a match and spot one real third-man run.$s$, $s$Share the drawing with your coach and ask when to use it.$s$]),
  ($s$b-press-triggers$s$, array[$s$Watch 15 minutes of a top team without the ball.$s$, $s$Count each time they press hard. What started it? A back-pass, a bad touch, a pass to the touchline?$s$, $s$Write down the three most common triggers.$s$, $s$In your next game, press hard on one of those triggers.$s$]),
  ($s$b-film-review$s$, array[$s$Watch 20 minutes of your own game, following only yourself.$s$, $s$Note 3 good decisions and 3 you'd change, with the time on the video.$s$, $s$For each one you'd change, write what you'll do next time.$s$, $s$Send the notes to your coach before the next practice.$s$]),
  ($s$b-lead-warmup$s$, array[$s$Ask your coach if you can lead part of the warm-up.$s$, $s$Plan 3 short activities and the instructions you'll give.$s$, $s$Speak loudly, keep instructions short and demonstrate.$s$, $s$Afterwards, ask your coach for one thing you did well and one to improve.$s$]),
  ($s$g-top-corner$s$, array[$s$On grass or a mat only. A helper throws or volleys the ball high to your side.$s$, $s$Take a quick step toward it, drive off your near leg and extend through your top hand.$s$, $s$Catch it if you can; if not, push it wide past the post.$s$, $s$4 each side, 3 rounds. Rest well between rounds.$s$]),
  ($s$g-breakaway$s$, array[$s$A helper dribbles at you from 18 yards.$s$, $s$Close them down fast while their head is down, then get set as they're about to shoot.$s$, $s$If they take a big touch, go down and smother; otherwise make yourself big with a star jump or K-block.$s$, $s$10 breakaways. Stay on your feet as long as you can.$s$]),
  ($s$g-back-pass$s$, array[$s$A helper passes back to you, then chases to press.$s$, $s$Scan first, then decide: play it short to a cone target, or clear it long and safe.$s$, $s$Use both feet. Your first touch should take you away from the pressure.$s$, $s$10 reps. Never dribble around the presser in your own box.$s$]),
  ($s$g-penalties$s$, array[$s$Watch the kicker's run-up angle, hips and plant foot. They often point where the ball goes.$s$, $s$Stay big and still on your line until the ball is struck.$s$, $s$A helper takes 10 penalties. Note what gave each one away.$s$, $s$Then try to save 10 more using those clues.$s$])
on conflict (drill_id) do update set steps = excluded.steps;

-- Done. You should see "Success. No rows returned".

-- =================== 015_club_unlimited.sql ===================
-- NextPlay update 015: Club Unlimited plan
-- Paste into Supabase -> SQL Editor -> New query -> Run. Safe to run more than once.
--
--  * Each club is on one of two plans: 'team' ($19.99 a month per team) or 'unlimited' ($199 a month, unlimited teams).
--  * Club admins switch plans in the app (Club -> Edit). Payments aren't connected yet, so this only records the choice.

alter table public.clubs add column if not exists plan text not null default 'team';

do $$ begin
  alter table public.clubs add constraint clubs_plan_ok check (plan in ('team','unlimited'));
exception when duplicate_object then null; end $$;

-- Done. You should see "Success. No rows returned".

-- All updates done. You should see "Success. No rows returned".
