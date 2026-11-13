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
