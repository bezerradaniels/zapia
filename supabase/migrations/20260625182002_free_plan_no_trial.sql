update public.plan_features
set
  name = 'Gratuito',
  price_in_cents = 0,
  max_products = 10,
  max_sellers = 0,
  has_ai_helpers = false,
  has_pdf_export = false,
  has_custom_theme = false,
  stripe_price_id = null,
  stripe_price_monthly = null,
  stripe_price_annual = null
where plan_id = 'basico';

alter table public.subscriptions
  alter column plan_id set default 'basico',
  alter column status set default 'active';

update public.subscriptions
set
  plan_id = 'basico',
  status = 'active',
  trial_ends_at = null,
  current_period_end = null,
  cancel_at_period_end = false
where status = 'trialing';

drop trigger if exists stores_start_trial on public.stores;
drop trigger if exists stores_start_free_plan on public.stores;
drop function if exists public.start_store_trial();

create or replace function public.start_store_free_plan()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.subscriptions
    (store_id, plan_id, status, trial_ends_at)
  values
    (new.id, 'basico', 'active', null)
  on conflict (store_id) do nothing;
  return new;
end $$;

create trigger stores_start_free_plan
  after insert on public.stores
  for each row execute function public.start_store_free_plan();

insert into public.subscriptions (store_id, plan_id, status, trial_ends_at)
select s.id, 'basico', 'active', null
from public.stores s
left join public.subscriptions sub on sub.store_id = s.id
where s.deleted_at is null
  and sub.store_id is null;

create or replace function public.enforce_product_plan_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  product_limit integer;
  current_count integer;
begin
  select pf.max_products
  into product_limit
  from public.subscriptions sub
  join public.plan_features pf on pf.plan_id = sub.plan_id
  where sub.store_id = new.store_id;

  if not found then
    product_limit := 10;
  end if;

  if product_limit is null then
    return new;
  end if;

  select count(*)::integer
  into current_count
  from public.products p
  where p.store_id = new.store_id
    and p.deleted_at is null
    and p.id is distinct from new.id;

  if current_count >= product_limit then
    raise exception using errcode = 'check_violation', message = 'product_limit_reached';
  end if;

  return new;
end $$;

drop trigger if exists products_enforce_plan_limit on public.products;
create trigger products_enforce_plan_limit
  before insert or update of store_id, deleted_at on public.products
  for each row
  when (new.deleted_at is null)
  execute function public.enforce_product_plan_limit();

create or replace function public.admin_get_platform_stats()
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  result jsonb;
begin
  if not public.is_admin() then
    raise exception 'Acesso negado';
  end if;

  select jsonb_build_object(
    'total_users',       (select count(*) from public.profiles),
    'total_stores',      (select count(*) from public.stores where deleted_at is null),
    'total_products',    (select count(*) from public.products where deleted_at is null),
    'total_sellers',     (select count(*) from public.seller_catalogs),
    'free_customers',    (select count(*) from public.subscriptions where status = 'active' and plan_id = 'basico'),
    'paying_customers',  (select count(*) from public.subscriptions where status = 'active' and plan_id in ('pro', 'premium')),
    'trial_customers',   (select count(*) from public.subscriptions where status = 'trialing'),

    'cities_with_stores', (
      select coalesce(jsonb_agg(row_to_json(t) order by (row_to_json(t)->>'count')::int desc), '[]'::jsonb)
      from (
        select address_city as city, count(*)::int as count
        from public.stores
        where deleted_at is null and address_city is not null and address_city <> ''
        group by address_city
        order by count desc
        limit 10
      ) t
    ),

    'states_with_stores', (
      select coalesce(jsonb_agg(row_to_json(t) order by (row_to_json(t)->>'count')::int desc), '[]'::jsonb)
      from (
        select address_state as state, count(*)::int as count
        from public.stores
        where deleted_at is null and address_state is not null and address_state <> ''
        group by address_state
        order by count desc
      ) t
    ),

    'sectors_with_stores', (
      select coalesce(jsonb_agg(row_to_json(t) order by (row_to_json(t)->>'count')::int desc), '[]'::jsonb)
      from (
        select category as sector, count(*)::int as count
        from public.stores
        where deleted_at is null and category is not null and category <> ''
        group by category
        order by count desc
        limit 10
      ) t
    ),

    'stores_per_month', (
      select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb)
      from (
        select to_char(date_trunc('month', created_at), 'YYYY-MM') as month,
               count(*)::int as count
        from public.stores
        where deleted_at is null
          and created_at >= now() - interval '12 months'
        group by month
        order by month
      ) t
    ),

    'revenue_per_month', (
      select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb)
      from (
        select to_char(date_trunc('month', paid_at), 'YYYY-MM') as month,
               sum(amount_in_cents)::bigint as amount
        from public.invoices
        where status = 'paid'
          and paid_at is not null
          and paid_at >= now() - interval '12 months'
        group by month
        order by month
      ) t
    )
  ) into result;

  return result;
end;
$$;
