-- =====================================================================
-- PitchPath database setup
-- Paste this whole file into Supabase -> SQL Editor -> New query -> Run.
-- Safe to run on a new, empty project. Run it once.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- tables ----------------------------------------------------

create table public.clubs (
  id            uuid primary key default gen_random_uuid(),
  name          text not null check (char_length(name) between 1 and 80),
  code          text not null unique,
  family_access text not null default 'included' check (family_access in ('included','subscribe')),
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now()
);

create table public.members (
  id           uuid primary key references auth.users(id) on delete cascade,
  club_id      uuid not null references public.clubs(id) on delete cascade,
  role         text not null check (role in ('admin','coach','family')),
  name         text not null default '' check (char_length(name) <= 60),
  family_plan  text,
  plan_started date,
  last_read    jsonb not null default '{}'::jsonb,
  joined_at    timestamptz not null default now()
);

create table public.teams (
  id         uuid primary key default gen_random_uuid(),
  club_id    uuid not null references public.clubs(id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 60),
  age_group  text not null default '',
  created_at timestamptz not null default now()
);

create table public.players (
  id          uuid primary key default gen_random_uuid(),
  club_id     uuid not null references public.clubs(id) on delete cascade,
  team_id     uuid references public.teams(id) on delete set null,
  name        text not null check (char_length(name) between 1 and 60),
  position    text not null default 'Not set',
  birth_year  int,
  invite_code text not null unique,
  created_at  timestamptz not null default now()
);

create table public.family_links (
  member_id uuid not null references public.members(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  primary key (member_id, player_id)
);

create table public.reviews (
  id         uuid primary key default gen_random_uuid(),
  club_id    uuid not null references public.clubs(id) on delete cascade,
  player_id  uuid not null references public.players(id) on delete cascade,
  coach_id   uuid references auth.users(id) on delete set null,
  coach_name text not null default '',
  date       date not null default current_date,
  ratings    jsonb not null default '{}'::jsonb,
  strengths  text[] not null default '{}',
  improve    text[] not null default '{}',
  note       text not null default '' check (char_length(note) <= 1500),
  created_at timestamptz not null default now()
);

create table public.drills (
  id         uuid primary key default gen_random_uuid(),
  club_id    uuid not null references public.clubs(id) on delete cascade,
  title      text not null check (char_length(title) between 1 and 80),
  category   text not null default 'Ball mastery',
  minutes    int not null default 10,
  equipment  text not null default '',
  level      text not null default 'All levels',
  steps      text[] not null default '{}',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.assignments (
  id          uuid primary key default gen_random_uuid(),
  club_id     uuid not null references public.clubs(id) on delete cascade,
  player_id   uuid not null references public.players(id) on delete cascade,
  drill_id    text not null,
  drill_title text not null default '',
  per_week    int not null default 3 check (per_week between 1 and 7),
  note        text not null default '',
  assigned_by uuid references auth.users(id) on delete set null,
  done        date[] not null default '{}',
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table public.player_profiles (
  player_id  uuid primary key references public.players(id) on delete cascade,
  club_id    uuid not null references public.clubs(id) on delete cascade,
  visibility text not null default 'private' check (visibility in ('private','club','public')),
  slug       text not null unique,
  positions  text[] not null default '{}',
  foot       text not null default '',
  strengths  text[] not null default '{}',
  bio        text not null default '' check (char_length(bio) <= 600),
  history    jsonb not null default '[]'::jsonb,
  videos     jsonb not null default '[]'::jsonb,
  photo      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.comments (
  id           uuid primary key default gen_random_uuid(),
  club_id      uuid not null references public.clubs(id) on delete cascade,
  player_id    uuid not null references public.players(id) on delete cascade,
  kind         text not null check (kind in ('reference','comment')),
  text         text not null check (char_length(text) between 1 and 2000),
  author_id    uuid references auth.users(id) on delete set null,
  author_name  text not null default '',
  author_title text not null default '',
  date         date not null default current_date,
  created_at   timestamptz not null default now()
);

create table public.messages (
  id          uuid primary key default gen_random_uuid(),
  club_id     uuid not null references public.clubs(id) on delete cascade,
  team_id     uuid not null references public.teams(id) on delete cascade,
  author_id   uuid references auth.users(id) on delete set null,
  author_name text not null default '',
  role        text not null default '',
  text        text not null check (char_length(text) between 1 and 1000),
  announce    boolean not null default false,
  created_at  timestamptz not null default now()
);

create index on public.members (club_id);
create index on public.teams (club_id);
create index on public.players (club_id);
create index on public.players (team_id);
create index on public.family_links (player_id);
create index on public.reviews (club_id);
create index on public.reviews (player_id);
create index on public.drills (club_id);
create index on public.assignments (club_id);
create index on public.assignments (player_id);
create index on public.player_profiles (club_id);
create index on public.comments (player_id);
create index on public.comments (club_id);
create index on public.messages (club_id, created_at desc);
create index on public.messages (team_id);

-- ---------- helper functions (who am I?) ------------------------------
-- security definer so they can read members/family_links without RLS loops

create or replace function public.my_club() returns uuid
language sql stable security definer set search_path = public as $$
  select club_id from members where id = auth.uid()
$$;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from members where id = auth.uid() and role in ('admin','coach'))
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from members where id = auth.uid() and role = 'admin')
$$;

create or replace function public.my_player_ids() returns setof uuid
language sql stable security definer set search_path = public as $$
  select player_id from family_links where member_id = auth.uid()
$$;

create or replace function public.my_team_ids() returns setof uuid
language sql stable security definer set search_path = public as $$
  select p.team_id from players p
  join family_links f on f.player_id = p.id
  where f.member_id = auth.uid() and p.team_id is not null
$$;

-- staff see every player in their club; families see only their own players
create or replace function public.can_see_player(pid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from players p
    where p.id = pid and p.club_id = my_club()
      and (is_staff() or pid in (select my_player_ids()))
  )
$$;

create or replace function public.player_in_my_club(pid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from players where id = pid and club_id = my_club())
$$;

create or replace function public.team_in_my_club(tid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from teams where id = tid and club_id = my_club())
$$;

-- ---------- row level security ----------------------------------------

alter table public.clubs           enable row level security;
alter table public.members         enable row level security;
alter table public.teams           enable row level security;
alter table public.players         enable row level security;
alter table public.family_links    enable row level security;
alter table public.reviews         enable row level security;
alter table public.drills          enable row level security;
alter table public.assignments     enable row level security;
alter table public.player_profiles enable row level security;
alter table public.comments        enable row level security;
alter table public.messages        enable row level security;

-- clubs: members read their own club; only the club admin edits it.
-- New clubs are created through create_club() below.
create policy clubs_read   on public.clubs for select to authenticated using (id = my_club());
create policy clubs_update on public.clubs for update to authenticated
  using (id = my_club() and is_admin()) with check (id = my_club());

-- members: see people in your club; edit only a few fields on your own row;
-- leave your club, or (admin) remove a coach or family.
create policy members_read on public.members for select to authenticated using (club_id = my_club());
create policy members_update_self on public.members for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy members_delete on public.members for delete to authenticated
  using (id = auth.uid() or (club_id = my_club() and is_admin() and role <> 'admin'));
revoke update on public.members from authenticated;
grant update (name, family_plan, plan_started, last_read) on public.members to authenticated;

-- teams
create policy teams_read  on public.teams for select to authenticated using (club_id = my_club());
create policy teams_write on public.teams for insert to authenticated with check (club_id = my_club() and is_staff());
create policy teams_edit  on public.teams for update to authenticated using (club_id = my_club() and is_staff()) with check (club_id = my_club());
create policy teams_del   on public.teams for delete to authenticated using (club_id = my_club() and is_staff());

-- players
create policy players_read  on public.players for select to authenticated using (can_see_player(id));
create policy players_write on public.players for insert to authenticated
  with check (club_id = my_club() and is_staff() and (team_id is null or team_in_my_club(team_id)));
create policy players_edit  on public.players for update to authenticated
  using (club_id = my_club() and is_staff())
  with check (club_id = my_club() and (team_id is null or team_in_my_club(team_id)));
create policy players_del   on public.players for delete to authenticated using (club_id = my_club() and is_staff());

-- family links (created through join_family()); coaches can see who is connected
create policy links_read on public.family_links for select to authenticated
  using (member_id = auth.uid() or (is_staff() and player_in_my_club(player_id)));
create policy links_del on public.family_links for delete to authenticated using (member_id = auth.uid());

-- reviews
create policy reviews_read  on public.reviews for select to authenticated using (can_see_player(player_id));
create policy reviews_write on public.reviews for insert to authenticated
  with check (club_id = my_club() and is_staff() and coach_id = auth.uid() and player_in_my_club(player_id));
create policy reviews_del   on public.reviews for delete to authenticated using (club_id = my_club() and is_staff());

-- drills (club's own drills; built-in drills live in the app)
create policy drills_read  on public.drills for select to authenticated using (club_id = my_club());
create policy drills_write on public.drills for insert to authenticated with check (club_id = my_club() and is_staff());
create policy drills_del   on public.drills for delete to authenticated using (club_id = my_club() and is_staff());

-- assignments (families tick off drills through toggle_done())
create policy assign_read  on public.assignments for select to authenticated using (can_see_player(player_id));
create policy assign_write on public.assignments for insert to authenticated
  with check (club_id = my_club() and is_staff() and player_in_my_club(player_id));
create policy assign_edit  on public.assignments for update to authenticated
  using (club_id = my_club() and is_staff()) with check (club_id = my_club());
create policy assign_del   on public.assignments for delete to authenticated using (club_id = my_club() and is_staff());

-- player profiles: the family edits; coaches and the family read;
-- 'club' profiles are readable by the whole club; public ones via get_public_profile()
create policy profiles_read on public.player_profiles for select to authenticated
  using (can_see_player(player_id) or (visibility = 'club' and club_id = my_club()));
create policy profiles_insert on public.player_profiles for insert to authenticated
  with check (player_id in (select my_player_ids()) and club_id = my_club());
create policy profiles_update on public.player_profiles for update to authenticated
  using (player_id in (select my_player_ids()))
  with check (player_id in (select my_player_ids()) and club_id = my_club());

-- coach comments & references
create policy comments_read  on public.comments for select to authenticated using (can_see_player(player_id));
create policy comments_write on public.comments for insert to authenticated
  with check (club_id = my_club() and is_staff() and author_id = auth.uid() and player_in_my_club(player_id));
create policy comments_del   on public.comments for delete to authenticated
  using (club_id = my_club() and (author_id = auth.uid() or is_admin()));

-- team chat: coaches see every team's chat; families see their players' teams
create policy messages_read on public.messages for select to authenticated
  using (club_id = my_club() and (is_staff() or team_id in (select my_team_ids())));
create policy messages_write on public.messages for insert to authenticated
  with check (
    author_id = auth.uid() and club_id = my_club() and team_in_my_club(team_id)
    and (is_staff() or (team_id in (select my_team_ids()) and announce = false))
  );
create policy messages_del on public.messages for delete to authenticated
  using (club_id = my_club() and (author_id = auth.uid() or is_staff()));

-- ---------- actions the app calls -------------------------------------

create or replace function public.gen_code(n int) returns text
language sql volatile set search_path = public as $$
  select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + floor(random() * 32)::int, 1), '')
  from generate_series(1, n)
$$;

create or replace function public.create_club(club_name text, my_name text) returns uuid
language plpgsql security definer set search_path = public as $$
declare cid uuid;
begin
  if auth.uid() is null then raise exception 'Please sign in first.'; end if;
  if exists (select 1 from members where id = auth.uid()) then
    raise exception 'You already belong to a club. Leave it first.';
  end if;
  insert into clubs (name, code, created_by) values (trim(club_name), gen_code(6), auth.uid()) returning id into cid;
  insert into members (id, club_id, role, name) values (auth.uid(), cid, 'admin', left(trim(my_name), 60));
  return cid;
end $$;

create or replace function public.join_club(club_code text, my_name text) returns text
language plpgsql security definer set search_path = public as $$
declare c clubs;
begin
  if auth.uid() is null then raise exception 'Please sign in first.'; end if;
  if exists (select 1 from members where id = auth.uid()) then
    raise exception 'You already belong to a club. Leave it first.';
  end if;
  select * into c from clubs where code = upper(trim(club_code));
  if not found then raise exception 'No club has that code. Check it with your club admin.'; end if;
  insert into members (id, club_id, role, name) values (auth.uid(), c.id, 'coach', left(trim(my_name), 60));
  return c.name;
end $$;

-- also used to add a second child to an existing family account
create or replace function public.join_family(player_code text, my_name text) returns text
language plpgsql security definer set search_path = public as $$
declare p players; m members;
begin
  if auth.uid() is null then raise exception 'Please sign in first.'; end if;
  select * into p from players where invite_code = upper(trim(player_code));
  if not found then raise exception 'No player has that code. Check it with your coach.'; end if;
  select * into m from members where id = auth.uid();
  if found then
    if m.club_id <> p.club_id then raise exception 'That player is in a different club. One club per account for now.'; end if;
    if m.role <> 'family' then raise exception 'Coach accounts can''t connect to a player. Use a separate parent account.'; end if;
  else
    insert into members (id, club_id, role, name) values (auth.uid(), p.club_id, 'family', left(trim(coalesce(my_name, '')), 60));
  end if;
  insert into family_links (member_id, player_id) values (auth.uid(), p.id) on conflict do nothing;
  return p.name;
end $$;

-- families mark a home drill done (or undo) for a given day
create or replace function public.toggle_done(aid uuid, d date) returns void
language plpgsql security definer set search_path = public as $$
declare a assignments;
begin
  select * into a from assignments where id = aid;
  if not found or not can_see_player(a.player_id) then raise exception 'Drill not found.'; end if;
  if d < current_date - 2 or d > current_date + 2 then raise exception 'Pick today''s date.'; end if;
  if d = any(a.done) then
    update assignments set done = array_remove(done, d) where id = aid;
  else
    update assignments set done = (select coalesce(array_agg(x order by x), '{}') from (
      select x from unnest(array_append(a.done, d)) x order by x desc limit 90) s) where id = aid;
  end if;
end $$;

-- the shareable profile page; works for signed-out visitors when the profile is public
create or replace function public.get_public_profile(p_slug text) returns json
language plpgsql stable security definer set search_path = public as $$
declare pr player_profiles; pl players; ok boolean;
begin
  select * into pr from player_profiles where slug = p_slug;
  if not found then return json_build_object('status', 'missing'); end if;
  ok := pr.visibility = 'public'
     or (auth.uid() is not null and pr.club_id = my_club()
         and (pr.visibility = 'club' or is_staff() or pr.player_id in (select my_player_ids())));
  if not ok then return json_build_object('status', 'private'); end if;
  select * into pl from players where id = pr.player_id;
  return json_build_object(
    'status', 'ok',
    'profile', to_json(pr),
    'player', json_build_object('id', pl.id, 'name', pl.name, 'birth_year', pl.birth_year),
    'club_name', (select name from clubs where id = pr.club_id),
    'refs', coalesce((
      select json_agg(json_build_object('id', c.id, 'kind', c.kind, 'text', c.text, 'author_name', c.author_name,
                                        'author_title', c.author_title, 'date', c.date, 'created_at', c.created_at)
                      order by c.created_at desc)
      from comments c where c.player_id = pr.player_id and c.kind = 'reference'), '[]'::json)
  );
end $$;

revoke execute on function public.create_club(text, text)   from anon;
revoke execute on function public.join_club(text, text)     from anon;
revoke execute on function public.join_family(text, text)   from anon;
revoke execute on function public.toggle_done(uuid, date)   from anon;
grant  execute on function public.get_public_profile(text)  to anon, authenticated;

-- ---------- live updates (chat, reviews, etc.) ------------------------

alter publication supabase_realtime add table
  public.clubs, public.members, public.teams, public.players, public.family_links,
  public.reviews, public.drills, public.assignments, public.player_profiles,
  public.comments, public.messages;

-- ---------- photo & video storage -------------------------------------
-- Files go in folders named by player id; only that player's family can upload or delete.
-- The bucket is public-read with unguessable file names, so profile pages can show them.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 52428800,
        array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm'])
on conflict (id) do nothing;

create policy media_upload on storage.objects for insert to authenticated
  with check (bucket_id = 'media'
              and (storage.foldername(name))[1] in (select x::text from public.my_player_ids() x));

create policy media_select_own on storage.objects for select to authenticated
  using (bucket_id = 'media'
         and (storage.foldername(name))[1] in (select x::text from public.my_player_ids() x));

create policy media_delete on storage.objects for delete to authenticated
  using (bucket_id = 'media'
         and (storage.foldername(name))[1] in (select x::text from public.my_player_ids() x));

-- Done. You should see "Success. No rows returned".
