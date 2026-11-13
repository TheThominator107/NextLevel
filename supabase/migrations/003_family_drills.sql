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
