-- NextPlay update 004: "Contact Us" form messages
-- Paste into Supabase -> SQL Editor -> New query -> Run. Safe to run more than once.
-- Read messages in Supabase -> Table Editor -> contact_messages. Visitors can send but never read them.

create table if not exists public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 80),
  email      text not null check (char_length(email) between 3 and 120 and position('@' in email) > 1),
  role       text not null default '' check (char_length(role) <= 40),
  club       text not null default '' check (char_length(club) <= 120),
  topic      text not null default '' check (char_length(topic) <= 40),
  message    text not null check (char_length(message) between 1 and 2000),
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

drop policy if exists contact_insert on public.contact_messages;
create policy contact_insert on public.contact_messages for insert to anon, authenticated with check (true);
-- No read policy on purpose: only you (in the Supabase dashboard) can read messages.

grant insert on public.contact_messages to anon, authenticated;

-- Done. You should see "Success. No rows returned".
