-- Friendly, SEO-stable slug for products, used in the public catalog URL
-- (/produto/{slug}). Generated automatically from the product name on
-- creation and kept stable across renames so shared links never break.
-- Unique per store; soft-deleted products free up their slug for reuse.

create extension if not exists "unaccent";

alter table public.products
  add column if not exists slug text;

create or replace function public.products_generate_slug()
returns trigger
language plpgsql
as $$
declare
  base_slug text;
  candidate text;
  suffix int := 1;
begin
  -- Only fill in a missing slug. Once set, it never changes automatically,
  -- so editing a product's name later doesn't break links already shared.
  if new.slug is not null and length(trim(new.slug)) > 0 then
    return new;
  end if;

  base_slug := lower(regexp_replace(
    unaccent(coalesce(new.name, 'produto')),
    '[^a-zA-Z0-9]+', '-', 'g'
  ));
  base_slug := trim(both '-' from base_slug);
  base_slug := substring(base_slug from 1 for 60);
  base_slug := trim(both '-' from base_slug);
  if base_slug = '' then
    base_slug := 'produto';
  end if;

  candidate := base_slug;
  while exists (
    select 1 from public.products
    where store_id = new.store_id
      and slug = candidate
      and id is distinct from new.id
  ) loop
    suffix := suffix + 1;
    candidate := substring(base_slug from 1 for 60 - length(suffix::text) - 1) || '-' || suffix;
  end loop;

  new.slug := candidate;
  return new;
end;
$$;

drop trigger if exists products_set_slug on public.products;
create trigger products_set_slug
  before insert or update on public.products
  for each row
  execute function public.products_generate_slug();

-- Backfill existing rows: a no-op column touch re-runs the trigger above,
-- which fills `slug` for every row that doesn't have one yet.
update public.products set name = name where slug is null;

alter table public.products
  alter column slug set not null;

alter table public.products
  drop constraint if exists products_slug_format;
alter table public.products
  add constraint products_slug_format
  check (slug ~ '^[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?$');

create unique index if not exists products_store_slug_udx
  on public.products (store_id, slug) where deleted_at is null;
