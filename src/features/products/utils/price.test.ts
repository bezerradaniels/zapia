import { describe, expect, it } from "vitest";
import {
  discountPercent,
  effectivePrice,
  getPromoPaymentMethodLabel,
} from "./price";

describe("effectivePrice", () => {
  it("returns the regular price when there is no promo", () => {
    expect(
      effectivePrice({ price_in_cents: 1000, promo_price_in_cents: null }),
    ).toBe(1000);
  });

  it("returns the promo price when it is lower", () => {
    expect(
      effectivePrice({ price_in_cents: 1000, promo_price_in_cents: 700 }),
    ).toBe(700);
  });

  it("ignores a promo that is not actually cheaper", () => {
    expect(
      effectivePrice({ price_in_cents: 1000, promo_price_in_cents: 1000 }),
    ).toBe(1000);
    expect(
      effectivePrice({ price_in_cents: 1000, promo_price_in_cents: 1200 }),
    ).toBe(1000);
  });

  it("returns variant price override when variation is specified", () => {
    const product = {
      price_in_cents: 1000,
      promo_price_in_cents: null,
      variation_options: [
        { name: "P", price_in_cents: 1500, promo_price_in_cents: 1200 },
        { name: "M", price_in_cents: 1400 },
      ],
    };
    expect(effectivePrice(product, "P")).toBe(1200);
    expect(effectivePrice(product, "M")).toBe(1400);
    expect(effectivePrice(product, "G")).toBe(1000); // fallback to base
    expect(effectivePrice(product)).toBe(1000);
  });
});

describe("discountPercent", () => {
  it("returns null when there is no active promo", () => {
    expect(
      discountPercent({ price_in_cents: 1000, promo_price_in_cents: null }),
    ).toBeNull();
    expect(
      discountPercent({ price_in_cents: 1000, promo_price_in_cents: 1000 }),
    ).toBeNull();
  });

  it("returns the rounded discount percentage", () => {
    expect(
      discountPercent({ price_in_cents: 1000, promo_price_in_cents: 700 }),
    ).toBe(30);
    expect(
      discountPercent({ price_in_cents: 1000, promo_price_in_cents: 666 }),
    ).toBe(33);
  });

  it("returns null for a non-positive price", () => {
    expect(
      discountPercent({ price_in_cents: 0, promo_price_in_cents: 0 }),
    ).toBeNull();
  });
});

describe("getPromoPaymentMethodLabel", () => {
  it("returns null for empty or null method", () => {
    expect(getPromoPaymentMethodLabel(null)).toBeNull();
    expect(getPromoPaymentMethodLabel(undefined)).toBeNull();
    expect(getPromoPaymentMethodLabel("")).toBeNull();
  });

  it("returns correct formatted label for each valid option", () => {
    expect(getPromoPaymentMethodLabel("pix")).toBe("no Pix");
    expect(getPromoPaymentMethodLabel("dinheiro")).toBe("no Dinheiro");
    expect(getPromoPaymentMethodLabel("pix_dinheiro")).toBe(
      "no Pix ou Dinheiro",
    );
  });
});
