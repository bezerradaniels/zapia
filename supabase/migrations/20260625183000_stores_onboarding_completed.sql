alter table public.stores add column if not exists onboarding_completed boolean not null default false;
update public.stores set onboarding_completed = true; -- assume existing stores are completed
