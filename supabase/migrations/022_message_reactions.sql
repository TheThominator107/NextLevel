-- NextPass update 022: emoji reactions on chat messages
-- Paste into Supabase -> SQL Editor -> New query -> Run. Safe to run more than once.
-- Coaches, parents and players can react to a Team Chat message or a private message with
-- one of five emoji. One reaction per person per message; picking another emoji replaces it.
-- You can only react to messages you can already read, and reactions go when the message goes.

create table if not exists public.message_reactions (
  id          text primary key,                       -- "<message id>:<user id>"
  message_id  uuid not null,
  kind        text not null check (kind in ('team','private')),
  user_id     uuid not null references auth.users(id) on delete cascade,
  user_name   text not null default '' check (char_length(user_name) <= 120),
  club_id     uuid references public.clubs(id) on delete cascade,
  emoji       text not null check (emoji in ('👍','👎','❗','❓','😂')),
  created_at  timestamptz not null default now(),
  constraint message_reactions_id check (id = message_id::text || ':' || user_id::text)
);
create index if not exists message_reactions_msg on public.message_reactions (message_id);
create index if not exists message_reactions_club on public.message_reactions (club_id, created_at desc);

-- can the signed-in person read this message? (uses the message tables' own privacy rules)
create or replace function public.can_see_message(k text, mid uuid) returns boolean
language sql stable set search_path = public as $$
  select case k
    when 'team'    then exists (select 1 from public.messages m where m.id = mid)
    when 'private' then exists (select 1 from public.private_messages p where p.id = mid)
    else false end
$$;

-- the club comes from the message itself, never from the app
create or replace function public.message_reactions_fill() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.club_id := case new.kind
    when 'team'    then (select club_id from public.messages where id = new.message_id)
    when 'private' then (select club_id from public.private_messages where id = new.message_id)
  end;
  return new;
end $$;
drop trigger if exists message_reactions_fill on public.message_reactions;
create trigger message_reactions_fill before insert or update on public.message_reactions
  for each row execute function public.message_reactions_fill();

alter table public.message_reactions enable row level security;
drop policy if exists reactions_read on public.message_reactions;
create policy reactions_read on public.message_reactions for select to authenticated
  using (can_see_message(kind, message_id));
drop policy if exists reactions_insert on public.message_reactions;
create policy reactions_insert on public.message_reactions for insert to authenticated
  with check (user_id = auth.uid() and can_see_message(kind, message_id));
drop policy if exists reactions_update on public.message_reactions;
create policy reactions_update on public.message_reactions for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid() and can_see_message(kind, message_id));
drop policy if exists reactions_delete on public.message_reactions;
create policy reactions_delete on public.message_reactions for delete to authenticated
  using (user_id = auth.uid());

-- a deleted message takes its reactions with it
create or replace function public.message_reactions_cleanup() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  delete from public.message_reactions
   where message_id = old.id and kind = (case tg_table_name when 'messages' then 'team' else 'private' end);
  return old;
end $$;
drop trigger if exists messages_reactions_cleanup on public.messages;
create trigger messages_reactions_cleanup after delete on public.messages
  for each row execute function public.message_reactions_cleanup();
drop trigger if exists private_messages_reactions_cleanup on public.private_messages;
create trigger private_messages_reactions_cleanup after delete on public.private_messages
  for each row execute function public.message_reactions_cleanup();

grant select, insert, update, delete on public.message_reactions to authenticated;

do $$ begin
  begin alter publication supabase_realtime add table public.message_reactions; exception when duplicate_object then null; when undefined_object then null; end;
end $$;
