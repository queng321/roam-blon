-- Tour guide bookings: tourists book tour guides from the destination pages.
-- The app (src/components/TourGuideBooking.tsx) sends this payload on confirm:
--   guide_name, tourist_email, tourist_name, tourist_nationality, booking_date,
--   booking_time, day_of_tour, destinations, pax, total_price, notes, status,
--   reference_code (localStorage copy only), guide_id (uuid when known)
-- Run this in Supabase → SQL Editor to bring the table in sync with the app.
-- Before this script the table was missing most text columns, so every insert
-- failed with "Could not find the '<column>' column" and bookings were only
-- saved to localStorage. Re-run AFTER adding the missing columns.

alter table public.tour_guide_bookings
  add column if not exists tourist_name text,
  add column if not exists tourist_nationality text,
  add column if not exists booking_time text,
  add column if not exists day_of_tour text,
  add column if not exists destinations text,
  add column if not exists notes text,
  add column if not exists reference_code text,
  add column if not exists rejection_reason text;