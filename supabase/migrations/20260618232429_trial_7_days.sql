-- Shorten the free trial from 14 to 7 days for new stores.
create or replace function public.start_store_trial()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.subscriptions
    (store_id, plan_id, status, trial_ends_at)
  values
    (new.id, 'pro', 'trialing', now() + interval '7 days')
  on conflict (store_id) do nothing;
  return new;
end $$;
