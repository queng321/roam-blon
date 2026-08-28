-- ============================================================
-- Roam-Blón · Restore qr_scans
-- ============================================================
-- Use this to re-insert the qr_scans rows you exported before
-- deleting them. Paste your exported rows into the VALUES list
-- below (keep the column order). `id` is auto-generated, so it
-- is intentionally omitted — this avoids primary-key conflicts
-- and lets Supabase assign fresh ids.
--
-- HOW TO USE
--  1. Export the old rows (from your backup / forked DB), e.g.:
--       select item_type, item_id, item_name, visitor_type,
--              nationality, scanned_at, created_at
--       from public.qr_scans;
--  2. Paste each row as a (...) tuple in the VALUES list.
--  3. Run in Supabase → SQL Editor.
--
-- NOTES
--  - Keep the original scanned_at so historical visit counts/times
--    are preserved.
--  - visitor_type / nationality accept 'local' / 'foreign' (or a
--    country name). Rows with NULL nationality just won't count
--    toward the Top Nationalities panel.
--  - The anon insert policy allows this; running as postgres/service
--    role also bypasses RLS.
-- ============================================================

insert into public.qr_scans
  (item_type, item_id, item_name, visitor_type, nationality, scanned_at, created_at)
values
  -- ▼▼▼ PASTE YOUR EXPORTED ROWS HERE ▼▼▼
  -- Example rows (replace with your real data):
  ('destination', 'biniray', 'Biniray Festival', 'local',  'Local',    '2025-01-15 09:24:11+08', '2025-01-15 09:24:11+08'),
  ('dining',     'horizon', 'Horizon Seaside Restaurant', 'foreign', 'Japanese', '2025-02-02 18:05:43+08', '2025-02-02 18:05:43+08')
  -- ▲▲▲ PASTE YOUR EXPORTED ROWS HERE ▲▲▲
;

-- Optional: verify the row count came back
-- select count(*) from public.qr_scans;
