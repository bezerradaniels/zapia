-- Adds the three jsonb columns that are referenced in application code and
-- the security column-grant migration (20260529140000) but were never
-- created through a migration file.

ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS delivery_hours  jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS custom_links    jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS gallery_images  jsonb NOT NULL DEFAULT '[]'::jsonb;
