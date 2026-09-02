-- Track when the store slug was last changed (used by the storefront to decide
-- whether to show a "this store moved" notice, and by SEO for canonical URL management).

alter table public.stores
  add column if not exists slug_last_updated_at timestamptz;

grant select (slug_last_updated_at) on public.stores to anon;
