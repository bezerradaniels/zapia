import type { Product } from "@/types/domain";

/**
 * Price the customer actually pays for this product right now.
 * Falls back to the regular price when there's no active promotion.
 */
export function effectivePrice(
  p: Pick<Product, "price_in_cents" | "promo_price_in_cents"> & {
    variation_options?: import("@/types/domain").VariationOption[] | null;
  },
  selectedVariation?: string | null,
): number {
  if (selectedVariation && p.variation_options) {
    const opt = p.variation_options.find((o) => o.name === selectedVariation);
    if (opt) {
      if (
        opt.promo_price_in_cents != null &&
        opt.price_in_cents != null &&
        opt.promo_price_in_cents < opt.price_in_cents
      ) {
        return opt.promo_price_in_cents;
      }
      if (opt.price_in_cents != null) {
        return opt.price_in_cents;
      }
    }
  }
  if (
    p.promo_price_in_cents != null &&
    p.promo_price_in_cents < p.price_in_cents
  ) {
    return p.promo_price_in_cents;
  }
  return p.price_in_cents;
}

/**
 * Profit margin as a percentage of the selling price. Returns 100 when a price
 * is set but no cost is known, and null when there is no price to base it on.
 */
export function marginPercent(
  priceCents: number,
  costCents: number | null | undefined,
): number | null {
  if (costCents && costCents > 0 && priceCents > 0) {
    return ((priceCents - costCents) / priceCents) * 100;
  }
  return priceCents > 0 ? 100 : null;
}

/** Discount percentage (0-100) when there's an active promo, otherwise null. */
export function discountPercent(
  p: Pick<Product, "price_in_cents" | "promo_price_in_cents">,
): number | null {
  if (p.promo_price_in_cents == null || p.price_in_cents <= 0) return null;
  if (p.promo_price_in_cents >= p.price_in_cents) return null;
  return Math.round((1 - p.promo_price_in_cents / p.price_in_cents) * 100);
}

/** Label for the payment method condition attached to a promotional discount. */
export function getPromoPaymentMethodLabel(
  method: string | null | undefined,
): string | null {
  if (!method) return null;
  if (method === "pix") return "no Pix";
  if (method === "dinheiro") return "no Dinheiro";
  if (method === "pix_dinheiro") return "no Pix ou Dinheiro";
  return null;
}
