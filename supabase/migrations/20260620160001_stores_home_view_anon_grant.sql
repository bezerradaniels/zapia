-- Expose the new home_view column to anonymous catalog visitors, same
-- scope as product_sort (20260529140000).

grant select (
  home_view
) on public.stores to anon;
