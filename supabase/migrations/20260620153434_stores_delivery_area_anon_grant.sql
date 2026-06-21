-- Expose the new delivery-area columns to anonymous catalog visitors,
-- same scope as accepted_shipping_methods/delivery_hours (20260529140000).

grant select (
  delivery_area_scope,
  delivery_area_custom_locations
) on public.stores to anon;
