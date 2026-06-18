-- FIX (billing): stripe-checkout-session reads `stripe_price_monthly` and
-- `stripe_price_annual` from plan_features as a fallback when the
-- STRIPE_PRICE_* env vars are absent, but those columns never existed — the
-- query errored at runtime and checkout failed with `plan_not_configured`.
--
-- Add the two nullable columns and backfill the monthly price from the existing
-- single `stripe_price_id` so monthly checkout keeps working via the DB path.
alter table public.plan_features
  add column if not exists stripe_price_monthly text,
  add column if not exists stripe_price_annual  text;

update public.plan_features
   set stripe_price_monthly = coalesce(stripe_price_monthly, stripe_price_id)
 where stripe_price_id is not null;
