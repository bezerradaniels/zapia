-- Add promo_payment_method to products
-- Allows specifying payment method condition for promotional price (e.g. 'pix', 'dinheiro', 'pix_dinheiro')

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS promo_payment_method text NULL;

COMMENT ON COLUMN products.promo_payment_method IS 'Condition to activate promotional discount: pix, dinheiro, pix_dinheiro, or NULL.';
