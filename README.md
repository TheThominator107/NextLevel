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

**Recruiting has three sections** (update 016): College and Pro for players 16 and over, Youth clubs for any age. Pro scouts and college coaches (update 026) can't see players until a NextPass owner approves them in the app. To make yourself an owner, run this once in the SQL Editor with the email you sign in to NextPass with:

```sql
insert into public.platform_admins (user_id) select id from auth.users where lower(email) = lower('you@example.com') on conflict do nothing;
```

**Training sessions** (update 018): coaches plan team practices under Training → Team Drills from the team drill library in `teamdrills.js`. Saved sessions are visible only to coaches and admins in the same club.

**Spanish** (`i18n.js`, `i18n/`): the Español / English button in the menu switches language for that browser. The app still writes pages in English; `i18n.js` swaps in Spanish from `i18n/es.json` as each page draws, so names, notes and messages people type are never changed. To update translations:
1. `python3 tools/i18n_extract.py` collects new English text into `i18n/en.json` (numbered).
2. Add the Spanish in `i18n/es/*.tsv` as `number|Spanish`. Sentences the app assembles at run time go in `i18n/es/runtime.pairs` as `English<TAB>Spanish`; `{0}` is a value and `{0|one|many}` picks singular or plural.
3. `python3 tools/i18n_build.py` writes `i18n/es.json`. Bump `data-i18nv` in `index.html` so browsers fetch the new file.
Anything marked `translate="no"` (like the NextPass logo) is never translated.

**Invite links** (update 020): coaches copy a coach invite link (`#coach-join-<club code>`) or a team's family invite link (`#team-<team id>`) from the box under the club code. The family link fills in the team; a coach still approves each request.

**Review baseline** (update 019): every review records what the ratings are measured against (age group, league, team, or for U16 and up, ability to play at a higher level). Field reviews now cover 19 skills, including weak foot, skill moves, sprint speed, stamina, vision and attitude.

**Ratings in words**: reviews still store 1 to 5, but the app shows them as Getting started, Developing, Solid, Strong and Standout.

**Updates 021 to 026**: meeting notifications (021), emoji reactions in chats (022), email changes kept in sync for college coaches and scouts (023), recruiting opportunities listed by coaches (024), Home Drills and Recruiting included in every club plan with Full Access for families without a club (025), the per-team, Club 20, Club 50 and Club Unlimited plans with their team limits and college coach approval (026).

**Not sure which database updates you've run?** Run `supabase/all_updates.sql` once in the SQL Editor. It contains every update (002 to 026), is safe whatever state your database is in, and can be run again any time. If Supabase warns about a "destructive operation", click "Run this query": it only removes old, unused parts.
Existing database: run any migration you haven't run yet. They're all safe to run more than once.

## Paywall
Drill instructions live in the `drill_steps` table (migration 005). Coaches, families on a club's team (every club plan includes Home Drills and Recruiting)
and families with Full Access ($4.99/month) can read them. Two free sample drills keep their steps in `app.js`.
