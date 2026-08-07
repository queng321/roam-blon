-- ============================================================
-- Roam-Blón · Tourist Profile Photo
-- Run once in Supabase → SQL Editor.
-- Adds an avatar_url column to the tourists table so tourists
-- can upload a profile photo (stored as a resized base64 data URL,
-- the same pattern already used for admin ID proof photos).
-- ============================================================

-- 1. Add the avatar column (safe to run repeatedly)
alter table public.tourists
  add column if not exists avatar_url text;
