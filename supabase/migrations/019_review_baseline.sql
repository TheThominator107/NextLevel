-- NextPass update 019: what each review is rated against
-- Paste into Supabase -> SQL Editor -> New query -> Run. Safe to run more than once.
-- Coaches pick a baseline for every review: age group, league, team,
-- or (U16 and up) ability to play at a higher level.
-- Older reviews keep an empty baseline. The six new skills (weak foot, skill moves,
-- sprint speed, stamina, vision, attitude) live in the existing ratings field, so they need no change here.

alter table public.reviews add column if not exists baseline text not null default '';

alter table public.reviews drop constraint if exists reviews_baseline_check;
alter table public.reviews add constraint reviews_baseline_check
  check (baseline in ('', 'age', 'league', 'team', 'higher'));

-- Done. You should see "Success. No rows returned".
