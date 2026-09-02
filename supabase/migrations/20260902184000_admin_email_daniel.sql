-- Update is_admin() function to include daniel.ddsb@gmail.com
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public, auth
as $$
  select
    lower(coalesce(auth.email(), '')) in ('daniel.ddsb@gmail.com', 'manager@zapia.app')
    or exists (
      select 1 from public.platform_admins pa
      where pa.user_id = auth.uid()
    )
$$;
