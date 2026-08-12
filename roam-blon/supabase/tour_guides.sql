-- Tour guides table: the admin adds/manages tour guides from the Bookings tab,
-- and tourists book them from the destination pages.
-- Run this in Supabase → SQL Editor (it is also required for guide login).

create table if not exists public.tour_guides (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  name text,
  email text unique,
  contact_number text,
  phone text,
  specialties text,
  specialty text,
  rate_per_day numeric default 1500,
  price numeric,
  rate_label text,
  bio text,
  description text,
  languages jsonb default '["Filipino","English"]'::jsonb,
  experience_years integer default 1,
  profile_image_url text,
  photo_url text,
  status text default 'pending',
  is_available boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.tour_guides enable row level security;

create policy "Public insert tour guides"
  on public.tour_guides for insert
  with check (true);

create policy "Public read tour guides"
  on public.tour_guides for select
  using (true);

create policy "Public update tour guides"
  on public.tour_guides for update
  using (true);

create policy "Public delete tour guides"
  on public.tour_guides for delete
  using (true);
