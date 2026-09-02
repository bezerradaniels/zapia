-- =============================================================================
-- Migration: Mercado Pago PIX Billing & Updated Plans (Basico, Avancado, Full)
-- =============================================================================

-- 1. Convert plan_id columns to TEXT to allow flexible plan names without enum transaction locks
alter table if exists public.subscriptions alter column plan_id drop default;
alter table if exists public.subscriptions alter column plan_id type text using plan_id::text;
alter table if exists public.subscriptions alter column plan_id set default 'full';

alter table if exists public.plan_features alter column plan_id type text using plan_id::text;

-- 2. Update plan_features table with new plans & pricing
insert into public.plan_features
  (plan_id, name, price_in_cents, max_products, max_sellers,
   has_ai_helpers, has_pdf_export, has_custom_theme)
values
  ('basico',   'Básico',    990,  10,   0,  false, false, false),
  ('avancado', 'Avançado', 1490,  100,  3,  true,  true,  true),
  ('full',     'Full',     2990,  null, 50, true,  true,  true)
on conflict (plan_id) do update set
  name             = excluded.name,
  price_in_cents   = excluded.price_in_cents,
  max_products     = excluded.max_products,
  max_sellers      = excluded.max_sellers,
  has_ai_helpers   = excluded.has_ai_helpers,
  has_pdf_export   = excluded.has_pdf_export,
  has_custom_theme = excluded.has_custom_theme;

-- Also maintain aliases for pro / premium
insert into public.plan_features
  (plan_id, name, price_in_cents, max_products, max_sellers,
   has_ai_helpers, has_pdf_export, has_custom_theme)
values
  ('pro',     'Avançado', 1490, 100,  3,  true, true, true),
  ('premium', 'Full',     2990, null, 50, true, true, true)
on conflict (plan_id) do update set
  name             = excluded.name,
  price_in_cents   = excluded.price_in_cents,
  max_products     = excluded.max_products,
  max_sellers      = excluded.max_sellers,
  has_ai_helpers   = excluded.has_ai_helpers,
  has_pdf_export   = excluded.has_pdf_export,
  has_custom_theme = excluded.has_custom_theme;

-- 3. Extend subscriptions table
alter table public.subscriptions
  add column if not exists gateway text not null default 'mercadopago',
  add column if not exists mp_payment_id text;

alter table public.subscriptions
  alter column status set default 'trialing';

-- 4. Extend invoices table for Mercado Pago PIX
alter table public.invoices
  alter column stripe_invoice_id drop not null;

alter table public.invoices
  add column if not exists gateway text not null default 'mercadopago',
  add column if not exists plan_id text,
  add column if not exists billing_period text not null default 'monthly',
  add column if not exists mp_payment_id text,
  add column if not exists pix_qr_code text,
  add column if not exists pix_qr_code_base64 text,
  add column if not exists pix_expires_at timestamptz;

create index if not exists invoices_mp_payment_id_idx on public.invoices (mp_payment_id);
create index if not exists invoices_store_status_idx on public.invoices (store_id, status);

-- 5. Re-establish 7-day Trial on store creation
drop trigger if exists stores_start_free_plan on public.stores;
drop function if exists public.start_store_free_plan();

create or replace function public.start_store_trial()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.subscriptions
    (store_id, plan_id, status, trial_ends_at, current_period_end, gateway)
  values
    (new.id, 'full', 'trialing', now() + interval '7 days', now() + interval '7 days', 'mercadopago')
  on conflict (store_id) do update set
    plan_id = 'full',
    status = 'trialing',
    trial_ends_at = coalesce(public.subscriptions.trial_ends_at, now() + interval '7 days'),
    current_period_end = coalesce(public.subscriptions.current_period_end, now() + interval '7 days');
  return new;
end $$;

drop trigger if exists stores_start_trial on public.stores;
create trigger stores_start_trial
  after insert on public.stores
  for each row execute function public.start_store_trial();

-- 6. Helper function: apply_plan_product_limits
-- Automatically pauses oldest active products if store exceeds plan limits
create or replace function public.apply_plan_product_limits(target_store uuid, max_allowed integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if max_allowed is null then
    return;
  end if;

  with ranked_products as (
    select id, row_number() over (order by created_at desc) as rn
    from public.products
    where store_id = target_store
      and deleted_at is null
      and is_active = true
  )
  update public.products
  set is_active = false
  where id in (
    select id from ranked_products where rn > max_allowed
  );
end $$;

-- 7. Public store catalog status gate
create or replace function public.store_catalog_status(target_store uuid)
returns table (
  status public.subscription_status,
  trial_ends_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  sub record;
begin
  select s.status, s.trial_ends_at, s.current_period_end
  into sub
  from public.subscriptions s
  where s.store_id = target_store;

  if not found then
    return query select 'none'::public.subscription_status, null::timestamptz;
    return;
  end if;

  -- If in trial and trial is expired, return paused
  if sub.status = 'trialing' and sub.trial_ends_at is not null and sub.trial_ends_at < now() then
    return query select 'paused'::public.subscription_status, sub.trial_ends_at;
    return;
  end if;

  -- If active and current_period_end is expired, return past_due or paused
  if sub.status = 'active' and sub.current_period_end is not null and sub.current_period_end < now() then
    return query select 'past_due'::public.subscription_status, sub.trial_ends_at;
    return;
  end if;

  return query select sub.status, sub.trial_ends_at;
end $$;
