-- Guide reviews: tourists rate accepted tour guide bookings
-- Run this in Supabase → SQL Editor

create table if not exists public.guide_reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id text,
  reference_code text,
  guide_name text not null,
  guide_id text,
  tourist_email text not null,
  tourist_name text,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now()
);

alter table public.guide_reviews enable row level security;

create policy "Public insert guide reviews"
  on public.guide_reviews for insert
  with check (true);

create policy "Public read guide reviews"
  on public.guide_reviews for select
  using (true);

create policy "Public update guide reviews"
  on public.guide_reviews for update
  using (true);

create policy "Public delete guide reviews"
  on public.guide_reviews for delete
  using (true);
