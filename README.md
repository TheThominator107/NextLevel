# NextPlay

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
Existing database: run any migration you haven't run yet. They're all safe to run more than once.

## Paywall
Drill instructions live in the `drill_steps` table (migration 005). Only coaches and families with Home Training
(club includes it, or family plan) can read them. Two free sample drills keep their steps in `app.js`.
