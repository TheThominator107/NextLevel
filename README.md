# NextPass

Player development app for soccer clubs: coach reviews, home drills, player profiles and team chat.

## How it's built
- Plain HTML + JavaScript, no build step. Cloudflare Pages serves the files in this folder as-is.
- Data, logins, file storage and live chat: Supabase (settings in `config.js`; only the public publishable key lives here).
- Database tables and privacy rules: `supabase/setup.sql`.

## Deploying
Cloudflare Pages is connected to this repo: every push to `main` goes live; other branches get a preview link.
Build command: (none). Output directory: `/`.

## Database updates
New database: run `supabase/setup.sql`, then every file in `supabase/migrations/` in number order.

**Recruiting has three sections** (update 016): College and Pro for players 16 and over, Youth clubs for any age. Pro scouts can't see players until a NextPass owner approves them in the app. To make yourself an owner, run this once in the SQL Editor with the email you sign in to NextPass with:

```sql
insert into public.platform_admins (user_id) select id from auth.users where lower(email) = lower('you@example.com') on conflict do nothing;
```

**Training sessions** (update 018): coaches plan team practices under Training → Team Drills from the team drill library in `teamdrills.js`. Saved sessions are visible only to coaches and admins in the same club.

**Invite links** (update 020): coaches copy a coach invite link (`#coach-join-<club code>`) or a team's family invite link (`#team-<team id>`) from the box under the club code. The family link fills in the team; a coach still approves each request.

**Review baseline** (update 019): every review records what the ratings are measured against (age group, league, team, or for U16 and up, ability to play at a higher level). Field reviews now cover 19 skills, including weak foot, skill moves, sprint speed, stamina, vision and attitude.

**Not sure which database updates you've run?** Run `supabase/all_updates.sql` once in the SQL Editor. It contains every update (002 to 020), is safe whatever state your database is in, and can be run again any time. If Supabase warns about a "destructive operation", click "Run this query": it only removes old, unused parts.
Existing database: run any migration you haven't run yet. They're all safe to run more than once.

## Paywall
Drill instructions live in the `drill_steps` table (migration 005). Only coaches and families with Home Training
(club includes it, or family plan) can read them. Two free sample drills keep their steps in `app.js`.
