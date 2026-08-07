-- ============================================================
-- Roam-Blón · Live Support Chat Tables
-- Run once in Supabase → SQL Editor.
-- Creates chat_rooms + chat_messages and the RLS policies that
-- let anonymous guests / logged-in tourists send messages and
-- let the app (anon key) insert the room greeting automatically.
-- ============================================================

-- 1. chat_rooms — one row per active conversation
create table if not exists public.chat_rooms (
  id uuid primary key default gen_random_uuid(),
  tourist_email text not null,
  tourist_name text,
  status text default 'active',          -- 'active' | 'closed'
  latest_message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. chat_messages — one row per message
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.chat_rooms(id) on delete cascade,
  content text not null,
  sender_role text not null,             -- 'tourist' | 'admin' | 'assistant'
  sender_email text,
  created_at timestamptz default now()
);

-- Indexes for fast room + history lookups
create index if not exists chat_rooms_status_idx on public.chat_rooms (status);
create index if not exists chat_rooms_tourist_email_idx on public.chat_rooms (tourist_email);
create index if not exists chat_messages_room_id_idx on public.chat_messages (room_id, created_at asc);

-- 3. Row Level Security — the app inserts with the ANON key,
--    so anonymous visitors must be allowed to create rooms and
--    send messages for the chat to work.
alter table public.chat_rooms enable row level security;
alter table public.chat_messages enable row level security;

-- chat_rooms: anyone may read and create rooms
create policy "allow anon chat_rooms select"
  on public.chat_rooms for select using (true);

create policy "allow anon chat_rooms insert"
  on public.chat_rooms for insert with check (true);

create policy "allow anon chat_rooms update"
  on public.chat_rooms for update using (true);

-- chat_messages: anyone may read and send messages
create policy "allow anon chat_messages select"
  on public.chat_messages for select using (true);

create policy "allow anon chat_messages insert"
  on public.chat_messages for insert with check (true);

-- ============================================================
-- OPTIONAL: if realtime updates aren't showing instantly, also
-- run this from Supabase → Database → Replication and add
-- chat_messages to the realtime publication.
-- ============================================================
alter publication supabase_realtime add table public.chat_messages;
alter publication supabase_realtime add table public.chat_rooms;
