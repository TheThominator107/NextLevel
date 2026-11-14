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
