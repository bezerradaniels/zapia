-- Delivery area scope: where a store is willing to ship/serve orders.

do $$ begin
  create type public.delivery_area_scope as enum (
    'city_only', 'state_only', 'brazil', 'worldwide', 'digital_only', 'custom'
  );
exception when duplicate_object then null; end $$;

alter table public.stores
  add column if not exists delivery_area_scope public.delivery_area_scope not null default 'city_only',
  add column if not exists delivery_area_custom_locations text[] not null default array[]::text[];
