-- REBRAND: update the hardcoded admin e-mail gate from the old Lapa Marketplace
-- address to the controlled Zapable domain (manager@zapable.com.br).
--
-- Editing the original migration file does NOT change an already-applied
-- database, so this forward migration redefines is_admin() to take effect.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public, auth
as $$
  select
    lower(coalesce(auth.email(), '')) = 'manager@zapable.com.br'
    or exists (
      select 1 from public.platform_admins pa
      where pa.user_id = auth.uid()
    )
$$;
