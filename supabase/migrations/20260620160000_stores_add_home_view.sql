-- Home view: which content shows at the store's root URL ("/") —
-- the product catalog or the "about" page. The other view is always
-- reachable at its own dedicated path (/catalogo, /sobre).

do $$ begin
  create type public.store_home_view as enum ('catalog', 'about');
exception when duplicate_object then null; end $$;

alter table public.stores
  add column if not exists home_view public.store_home_view not null default 'catalog';
