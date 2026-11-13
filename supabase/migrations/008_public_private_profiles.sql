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
