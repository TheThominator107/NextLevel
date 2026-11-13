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
