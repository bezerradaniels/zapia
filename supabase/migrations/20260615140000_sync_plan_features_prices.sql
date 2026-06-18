-- SYNC (billing): align plan_features with src/config/plans.ts (the source of
-- truth that matches the public pricing UI). The DB had stale monthly prices
-- (R$4,99 / 9,99 / 29,99) and no annual price IDs, which made the dashboard
-- show wrong values and the annual checkout fall back to the monthly price.
--
-- Monthly: R$ 9,90 / 19,90 / 29,90  ·  Annual (total/year): R$ 106,92 / 191,04 / 251,16
update public.plan_features set
  price_in_cents       = 990,
  stripe_price_id      = 'price_1TbMQb1oLw5d2Hz3YJfgWwv9',
  stripe_price_monthly = 'price_1TbMQb1oLw5d2Hz3YJfgWwv9',
  stripe_price_annual  = 'price_1TbMQg1oLw5d2Hz3SXpCAriP'
where plan_id = 'basico';

update public.plan_features set
  price_in_cents       = 1990,
  stripe_price_id      = 'price_1TbMQb1oLw5d2Hz3pvTSPKMz',
  stripe_price_monthly = 'price_1TbMQb1oLw5d2Hz3pvTSPKMz',
  stripe_price_annual  = 'price_1TbMQg1oLw5d2Hz34oXnpGtp'
where plan_id = 'pro';

update public.plan_features set
  price_in_cents       = 2990,
  stripe_price_id      = 'price_1TbMQb1oLw5d2Hz3Fl8g9l6B',
  stripe_price_monthly = 'price_1TbMQb1oLw5d2Hz3Fl8g9l6B',
  stripe_price_annual  = 'price_1TbMQh1oLw5d2Hz3cls8wmCQ'
where plan_id = 'premium';
