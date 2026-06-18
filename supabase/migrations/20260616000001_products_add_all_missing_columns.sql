-- Adds all product columns that exist in application code / database.ts but
-- were never added through a migration file (added directly in Supabase
-- dashboard or in migrations that were not pushed to remote).
-- All statements use IF NOT EXISTS so this is safe to re-run.

-- is_featured (missing from the init migration)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;

-- category + promo_price (from products_add_category_and_promo)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS category             text,
  ADD COLUMN IF NOT EXISTS promo_price_in_cents integer;

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_promo_price_check;
ALTER TABLE public.products
  ADD CONSTRAINT products_promo_price_check
  CHECK (promo_price_in_cents IS NULL OR (promo_price_in_cents >= 0 AND promo_price_in_cents < price_in_cents));

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_category_check;
ALTER TABLE public.products
  ADD CONSTRAINT products_category_check
  CHECK (category IS NULL OR char_length(category) BETWEEN 1 AND 40);

-- brand / unit / barcode (from products_add_brand_unit_barcode)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS brand   text,
  ADD COLUMN IF NOT EXISTS unit    text,
  ADD COLUMN IF NOT EXISTS barcode text;

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_brand_check;
ALTER TABLE public.products
  ADD CONSTRAINT products_brand_check
  CHECK (brand IS NULL OR char_length(brand) BETWEEN 1 AND 60);

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_unit_check;
ALTER TABLE public.products
  ADD CONSTRAINT products_unit_check
  CHECK (unit IS NULL OR char_length(unit) BETWEEN 1 AND 30);

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_barcode_check;
ALTER TABLE public.products
  ADD CONSTRAINT products_barcode_check
  CHECK (barcode IS NULL OR char_length(barcode) BETWEEN 4 AND 20);

-- extended fields (from products_add_extended_fields)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS sku               text,
  ADD COLUMN IF NOT EXISTS auto_sku          boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS barcode_type      text,
  ADD COLUMN IF NOT EXISTS condition         text    NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS purchase_recurrence text,
  ADD COLUMN IF NOT EXISTS subcategory       text,
  ADD COLUMN IF NOT EXISTS has_no_brand      boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cost_in_cents     integer,
  ADD COLUMN IF NOT EXISTS has_variations    boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS variation_type    text,
  ADD COLUMN IF NOT EXISTS variation_label   text,
  ADD COLUMN IF NOT EXISTS variation_options jsonb;

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_condition_check;
ALTER TABLE public.products
  ADD CONSTRAINT products_condition_check
  CHECK (condition IN ('new', 'used', 'refurbished'));

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_variation_type_check;
ALTER TABLE public.products
  ADD CONSTRAINT products_variation_type_check
  CHECK (variation_type IS NULL OR variation_type IN ('color', 'size', 'other'));

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_cost_check;
ALTER TABLE public.products
  ADD CONSTRAINT products_cost_check
  CHECK (cost_in_cents IS NULL OR cost_in_cents >= 0);

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_sku_length;
ALTER TABLE public.products
  ADD CONSTRAINT products_sku_length
  CHECK (sku IS NULL OR (char_length(sku) BETWEEN 1 AND 40));

-- installment fields (from add_installment_fields_to_products)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS installment_count          smallint,
  ADD COLUMN IF NOT EXISTS installment_total_in_cents integer;

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_installment_count_check;
ALTER TABLE public.products
  ADD CONSTRAINT products_installment_count_check
  CHECK (installment_count IS NULL OR installment_count BETWEEN 2 AND 24);

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_installment_total_check;
ALTER TABLE public.products
  ADD CONSTRAINT products_installment_total_check
  CHECK (installment_total_in_cents IS NULL OR installment_total_in_cents > 0);
