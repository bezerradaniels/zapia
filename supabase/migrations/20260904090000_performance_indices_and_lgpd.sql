-- Phase 3: Performance indices on foreign keys and LGPD anonymization procedure

-- 1. Index on order_items(product_id) to prevent full-table scans when updating or deleting products
create index if not exists order_items_product_id_idx
  on public.order_items (product_id)
  where product_id is not null;

-- 2. Composite index on orders(store_id, customer_phone) to speed up customer order lookups
create index if not exists orders_store_customer_phone_idx
  on public.orders (store_id, customer_phone);

-- 3. Composite index on store_coupons(store_id, expires_at) for coupon expiration filtering
create index if not exists store_coupons_store_expires_at_idx
  on public.store_coupons (store_id, expires_at)
  where expires_at is not null;

-- 4. LGPD customer anonymization procedure (Right to be Forgotten)
-- Anonymizes PII in historical orders while preserving financial and inventory metrics,
-- then deletes the customer profile record.
create or replace function public.anonymize_customer_data(
  target_customer_id uuid,
  target_store_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  cust public.customers%rowtype;
begin
  -- Validate that caller has member privileges for target_store_id
  if not public.is_store_member(target_store_id) then
    raise exception using errcode = 'insufficient_privilege', message = 'not_authorized';
  end if;

  select * into cust
  from public.customers
  where id = target_customer_id and store_id = target_store_id;

  if not found then
    return false;
  end if;

  -- Anonymize customer identifiable data in past orders
  update public.orders
  set customer_name = 'Cliente Anonimizado',
      customer_phone = '+5500000000000',
      customer_notes = null
  where store_id = target_store_id
    and customer_phone = cust.whatsapp_phone;

  -- Delete the customer CRM record
  delete from public.customers
  where id = target_customer_id and store_id = target_store_id;

  return true;
end $$;

grant execute on function public.anonymize_customer_data(uuid, uuid) to authenticated;
