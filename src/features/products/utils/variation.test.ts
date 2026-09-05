import { describe, it, expect } from "vitest";
import {
  generateCartesianVariants,
  getVariationPrice,
  checkValueAvailability,
  getTotalVariationStock,
  inferAxesFromExisting,
} from "./variation";
import type { VariationOption } from "@/types/domain";

describe("inferAxesFromExisting", () => {
  it("reconstructs multi-axis from options with attributes", () => {
    const options: VariationOption[] = [
      { name: "Preto / P", attributes: { Cor: "Preto", Tamanho: "P" } },
      { name: "Preto / M", attributes: { Cor: "Preto", Tamanho: "M" } },
      { name: "Branco / P", attributes: { Cor: "Branco", Tamanho: "P" } },
    ];
    const axes = inferAxesFromExisting(null, null, options);
    expect(axes).toHaveLength(2);
    expect(axes[0].name).toBe("Cor");
    expect(axes[0].values).toEqual(["Preto", "Branco"]);
    expect(axes[1].name).toBe("Tamanho");
    expect(axes[1].values).toEqual(["P", "M"]);
  });

  it("handles legacy 1-axis options without attributes", () => {
    const options: VariationOption[] = [
      { name: "Vermelho" },
      { name: "Azul" },
    ];
    const axes = inferAxesFromExisting("color", "Cor", options);
    expect(axes).toHaveLength(1);
    expect(axes[0].name).toBe("Cor");
    expect(axes[0].values).toEqual(["Vermelho", "Azul"]);
  });
});


describe("generateCartesianVariants", () => {
  it("generates combinations for single axis", () => {
    const axes = [{ name: "Cor", values: ["Preto", "Branco"] }];
    const variants = generateCartesianVariants(axes, null, 5000, 10);

    expect(variants).toHaveLength(2);
    expect(variants[0].name).toBe("Preto");
    expect(variants[0].attributes).toEqual({ Cor: "Preto" });
    expect(variants[0].price_in_cents).toBe(5000);
    expect(variants[0].stock).toBe(10);
    expect(variants[0].is_active).toBe(true);

    expect(variants[1].name).toBe("Branco");
    expect(variants[1].attributes).toEqual({ Cor: "Branco" });
  });

  it("generates combinations for multiple axes (Cartesian product)", () => {
    const axes = [
      { name: "Cor", values: ["Preto", "Branco"] },
      { name: "Tamanho", values: ["P", "M", "G"] },
    ];
    const variants = generateCartesianVariants(axes);

    expect(variants).toHaveLength(6);
    expect(variants.map((v) => v.name)).toEqual([
      "Preto / P",
      "Preto / M",
      "Preto / G",
      "Branco / P",
      "Branco / M",
      "Branco / G",
    ]);
    expect(variants[0].attributes).toEqual({ Cor: "Preto", Tamanho: "P" });
  });

  it("preserves existing customized variant properties when regenerating", () => {
    const existing: VariationOption[] = [
      {
        name: "Preto / P",
        attributes: { Cor: "Preto", Tamanho: "P" },
        stock: 3,
        price_in_cents: 8900,
        sku: "CAM-PRT-P",
        is_active: false,
      },
    ];

    const axes = [
      { name: "Cor", values: ["Preto"] },
      { name: "Tamanho", values: ["P", "M"] },
    ];

    const variants = generateCartesianVariants(axes, existing);
    expect(variants).toHaveLength(2);

    const pretoP = variants.find((v) => v.name === "Preto / P")!;
    expect(pretoP.stock).toBe(3);
    expect(pretoP.price_in_cents).toBe(8900);
    expect(pretoP.sku).toBe("CAM-PRT-P");
    expect(pretoP.is_active).toBe(false);

    const pretoM = variants.find((v) => v.name === "Preto / M")!;
    expect(pretoM.stock).toBeNull();
    expect(pretoM.is_active).toBe(true);
  });
});

describe("getVariationPrice", () => {
  it("uses base product price when variation has no custom price", () => {
    const product = {
      price_in_cents: 10000,
      promo_price_in_cents: 8000,
      variation_options: [{ name: "P", stock: 5 }],
    };

    const result = getVariationPrice(product, "P");
    expect(result.price).toBe(8000);
    expect(result.originalPrice).toBe(10000);
    expect(result.hasPromo).toBe(true);
  });

  it("uses variant custom price when specified", () => {
    const product = {
      price_in_cents: 10000,
      promo_price_in_cents: null,
      variation_options: [
        { name: "G", stock: 5, price_in_cents: 12000, promo_price_in_cents: 11000 },
      ],
    };

    const result = getVariationPrice(product, "G");
    expect(result.price).toBe(11000);
    expect(result.originalPrice).toBe(12000);
    expect(result.hasPromo).toBe(true);
  });
});

describe("checkValueAvailability (preventing dead ends)", () => {
  const options: VariationOption[] = [
    { name: "Preto / P", attributes: { Cor: "Preto", Tamanho: "P" }, stock: 5, is_active: true },
    { name: "Preto / M", attributes: { Cor: "Preto", Tamanho: "M" }, stock: 0, is_active: true },
    { name: "Branco / P", attributes: { Cor: "Branco", Tamanho: "P" }, stock: 2, is_active: true },
    // Notice: "Branco / M" was disabled or omitted (sparse matrix)
    { name: "Branco / M", attributes: { Cor: "Branco", Tamanho: "M" }, stock: 0, is_active: false },
  ];

  it("allows selectable values with stock", () => {
    // User selected "Preto"
    const selection = { Cor: "Preto" };
    const pStatus = checkValueAvailability(options, selection, "Tamanho", "P");
    expect(pStatus.isSelectable).toBe(true);
    expect(pStatus.hasStock).toBe(true);

    const mStatus = checkValueAvailability(options, selection, "Tamanho", "M");
    expect(mStatus.isSelectable).toBe(true);
    expect(mStatus.hasStock).toBe(false); // In stock = false
  });

  it("marks impossible combination as not selectable", () => {
    // User selected "Branco"
    const selection = { Cor: "Branco" };
    const mStatus = checkValueAvailability(options, selection, "Tamanho", "M");
    // "Branco / M" is inactive -> not selectable!
    expect(mStatus.isSelectable).toBe(false);
  });
});

describe("getTotalVariationStock", () => {
  it("ignores inactive variants from total stock", () => {
    const product = {
      variation_options: [
        { name: "A", stock: 10, is_active: true },
        { name: "B", stock: 20, is_active: false },
        { name: "C", stock: 5, is_active: true },
      ],
    };
    expect(getTotalVariationStock(product)).toBe(15);
  });
});
