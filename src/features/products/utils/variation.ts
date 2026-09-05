import type { Product, VariationOption } from "@/types/domain";

export function getVariationOption(
  product: Pick<Product, "variation_options">,
  selectedVariation?: string | null,
): VariationOption | null {
  if (!selectedVariation) return null;
  return (
    (product.variation_options ?? []).find(
      (option) => option.name === selectedVariation,
    ) ?? null
  );
}

export function getVariationImage(
  product: Pick<Product, "variation_options" | "images">,
  selectedVariation?: string | null,
): string | null {
  const option = getVariationOption(product, selectedVariation);
  return option?.image_url ?? product.images[0] ?? null;
}

export function getVariationStock(
  product: Pick<Product, "has_variations" | "variation_options" | "stock">,
  selectedVariation?: string | null,
): number | null {
  if (!product.has_variations) return product.stock ?? null;
  const option = getVariationOption(product, selectedVariation);
  return option?.stock ?? null;
}

export function getTotalVariationStock(
  product: Pick<Product, "variation_options">,
): number | null {
  const stocks = (product.variation_options ?? [])
    .filter((option) => option.is_active !== false)
    .map((option) => option.stock)
    .filter((stock): stock is number => stock != null);

  if (stocks.length === 0) return null;
  return stocks.reduce((sum, stock) => sum + stock, 0);
}

/**
 * Returns the effective price and promo price for a product, taking into account
 * any price override defined on the selected variation option.
 */
export function getVariationPrice(
  product: Pick<Product, "price_in_cents" | "promo_price_in_cents" | "variation_options">,
  selectedVariation?: string | null,
): { price: number; originalPrice: number; hasPromo: boolean } {
  const option = getVariationOption(product, selectedVariation);
  const basePrice = product.price_in_cents;
  const basePromo = product.promo_price_in_cents;

  const regularPrice = option?.price_in_cents ?? basePrice;
  const promoPrice = option?.promo_price_in_cents ?? basePromo;
  const hasPromo = promoPrice != null && promoPrice < regularPrice;

  return {
    price: hasPromo ? promoPrice! : regularPrice,
    originalPrice: regularPrice,
    hasPromo,
  };
}

export type VariationAxisInput = {
  name: string;
  values: string[];
};

/**
 * Generates Cartesian product combinations from an array of variation axes.
 * Preserves existing variant properties (stock, price, SKU, image, active status)
 * when a matching combination already exists in existingOptions.
 */
export function generateCartesianVariants(
  axes: VariationAxisInput[],
  existingOptions?: VariationOption[] | null,
  basePriceCents?: number,
  baseStock?: number | null,
): VariationOption[] {
  const validAxes = axes
    .map((a) => ({
      name: a.name.trim(),
      values: a.values.map((v) => v.trim()).filter(Boolean),
    }))
    .filter((a) => a.name && a.values.length > 0);

  if (validAxes.length === 0) return [];

  // Cartesian product calculation
  let combinations: Array<Record<string, string>> = [{}];

  for (const axis of validAxes) {
    const next: Array<Record<string, string>> = [];
    for (const combo of combinations) {
      for (const val of axis.values) {
        next.push({ ...combo, [axis.name]: val });
      }
    }
    combinations = next;
  }

  const existingMap = new Map<string, VariationOption>();
  (existingOptions ?? []).forEach((opt) => {
    if (opt.attributes && Object.keys(opt.attributes).length > 0) {
      const key = Object.entries(opt.attributes)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}:${v}`)
        .join("|");
      existingMap.set(key, opt);
    } else {
      existingMap.set(opt.name, opt);
    }
  });

  return combinations.map((combo) => {
    const name = validAxes.map((a) => combo[a.name]).join(" / ");
    const key = Object.entries(combo)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join("|");

    const existing = existingMap.get(key) ?? existingMap.get(name);

    if (existing) {
      return {
        ...existing,
        name,
        attributes: combo,
        is_active: existing.is_active ?? true,
      };
    }

    return {
      name,
      attributes: combo,
      stock: baseStock ?? null,
      price_in_cents: basePriceCents ?? null,
      promo_price_in_cents: null,
      sku: null,
      is_active: true,
    };
  });
}

/**
 * Computes predictive availability for a candidate value given the user's current partial selection.
 * Used by storefront to disable impossible combinations before the user clicks.
 */
export function checkValueAvailability(
  options: VariationOption[],
  currentSelection: Record<string, string>,
  targetAxis: string,
  candidateValue: string,
  fallbackLabel: string = "Variação",
): { isSelectable: boolean; hasStock: boolean } {
  const hypothetical = {
    ...currentSelection,
    [targetAxis]: candidateValue,
  };

  const activeOptions = options.filter((o) => o.is_active !== false);

  const matches = activeOptions.filter((opt) => {
    const attrs = opt.attributes && Object.keys(opt.attributes).length > 0
      ? opt.attributes
      : { [fallbackLabel]: opt.name };

    return Object.entries(hypothetical).every(([axis, selectedVal]) => {
      if (!selectedVal) return true;
      return attrs[axis] === selectedVal;
    });
  });

  return {
    isSelectable: matches.length > 0,
    hasStock: matches.some((o) => o.stock == null || o.stock > 0),
  };
}

/**
 * Reconstructs axis definitions from existing variation options or product metadata.
 * Useful when opening the variation modal in edit mode or converting legacy variants.
 */
export function inferAxesFromExisting(
  initialType?: string | null,
  initialLabel?: string | null,
  initialOptions?: VariationOption[] | null,
): VariationAxisInput[] {
  const defaultMainLabel =
    initialType === "color"
      ? "Cor"
      : initialType === "size"
        ? "Tamanho"
        : initialLabel && initialLabel !== "Outro tipo"
          ? initialLabel.trim()
          : "Opção";

  const hasNonEmptyOptions = (initialOptions ?? []).some(
    (o) =>
      o.name?.trim() ||
      (o.attributes && Object.keys(o.attributes).length > 0),
  );

  if (!hasNonEmptyOptions) {
    return [{ name: defaultMainLabel, values: [] }];
  }

  // Check if options have attributes
  const axisLabels: string[] = [];
  const axisValuesMap = new Map<string, Set<string>>();

  initialOptions!.forEach((opt) => {
    if (opt.attributes && Object.keys(opt.attributes).length > 0) {
      Object.entries(opt.attributes).forEach(([k, v]) => {
        const trimmedK = k.trim();
        const trimmedV = v?.trim();
        if (trimmedK) {
          if (!axisValuesMap.has(trimmedK)) {
            axisLabels.push(trimmedK);
            axisValuesMap.set(trimmedK, new Set());
          }
          if (trimmedV) {
            axisValuesMap.get(trimmedK)!.add(trimmedV);
          }
        }
      });
    }
  });

  if (axisLabels.length > 0) {
    const existingAxes = axisLabels.map((label) => ({
      name: label,
      values: Array.from(axisValuesMap.get(label) || []),
    }));

    // If user clicked a specific type (e.g. "Tamanho" or "Cor") that isn't among existing axes,
    // and we have room (< 3 axes), append it so it's immediately ready to configure!
    if (
      defaultMainLabel &&
      defaultMainLabel !== "Opção" &&
      existingAxes.length < 3 &&
      !existingAxes.some(
        (a) => a.name.toLowerCase() === defaultMainLabel.toLowerCase(),
      )
    ) {
      existingAxes.push({ name: defaultMainLabel, values: [] });
    }

    return existingAxes;
  }

  // Legacy fallback: single axis with option names
  const legacyValues = initialOptions!
    .map((o) => o.name.trim())
    .filter(Boolean);

  return [{ name: defaultMainLabel, values: legacyValues }];
}


