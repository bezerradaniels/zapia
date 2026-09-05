-- Phase 4: Database integrity constraints and input sanitation

-- 1. Ensure gtm_id follows standard Google Tag Manager container ID format
alter table public.stores
  drop constraint if exists stores_gtm_id_format;

alter table public.stores
  add constraint stores_gtm_id_format
  check (gtm_id is null or gtm_id ~ '^GTM-[A-Z0-9]{4,15}$');
