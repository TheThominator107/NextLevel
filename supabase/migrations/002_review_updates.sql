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
