import type { PlanId } from "@/types/domain";

export type PlanConfig = {
  id: PlanId;
  name: string;
  priceInCents: number;
  priceInCentsAnnual: number;
  maxProducts: number | null;
  maxSellers: number;
  maxCoupons: number | null;
  hasFeaturedProducts: boolean;
  maxFeaturedProducts: number;
  hasPdfExport: boolean;
  hasCustomTheme: boolean;
  hasAiHelpers: boolean;
  stripePriceId: string;
  stripePriceIdAnnual: string;
};

export const PLANS: Record<PlanId, PlanConfig> = {
  basico: {
    id: "basico",
    name: "Básico",
    priceInCents: 990,
    priceInCentsAnnual: 8990,
    maxProducts: 10,
    maxSellers: 0,
    maxCoupons: 1,
    hasFeaturedProducts: false,
    maxFeaturedProducts: 0,
    hasPdfExport: false,
    hasCustomTheme: false,
    hasAiHelpers: false,
    stripePriceId: "",
    stripePriceIdAnnual: "",
  },
  avancado: {
    id: "avancado",
    name: "Avançado",
    priceInCents: 1490,
    priceInCentsAnnual: 13990,
    maxProducts: 100,
    maxSellers: 3,
    maxCoupons: 5,
    hasFeaturedProducts: true,
    maxFeaturedProducts: 4,
    hasPdfExport: true,
    hasCustomTheme: true,
    hasAiHelpers: true,
    stripePriceId: "",
    stripePriceIdAnnual: "",
  },
  full: {
    id: "full",
    name: "Full",
    priceInCents: 2990,
    priceInCentsAnnual: 19990,
    maxProducts: null,
    maxSellers: 50,
    maxCoupons: null,
    hasFeaturedProducts: true,
    maxFeaturedProducts: 8,
    hasPdfExport: true,
    hasCustomTheme: true,
    hasAiHelpers: true,
    stripePriceId: "",
    stripePriceIdAnnual: "",
  },
  // Aliases for backwards compatibility
  pro: {
    id: "pro",
    name: "Avançado",
    priceInCents: 1490,
    priceInCentsAnnual: 13990,
    maxProducts: 100,
    maxSellers: 3,
    maxCoupons: 5,
    hasFeaturedProducts: true,
    maxFeaturedProducts: 4,
    hasPdfExport: true,
    hasCustomTheme: true,
    hasAiHelpers: true,
    stripePriceId: "",
    stripePriceIdAnnual: "",
  },
  premium: {
    id: "premium",
    name: "Full",
    priceInCents: 2990,
    priceInCentsAnnual: 19990,
    maxProducts: null,
    maxSellers: 50,
    maxCoupons: null,
    hasFeaturedProducts: true,
    maxFeaturedProducts: 8,
    hasPdfExport: true,
    hasCustomTheme: true,
    hasAiHelpers: true,
    stripePriceId: "",
    stripePriceIdAnnual: "",
  },
  custom: {
    id: "custom",
    name: "Custom",
    priceInCents: 0,
    priceInCentsAnnual: 0,
    maxProducts: null,
    maxSellers: 50,
    maxCoupons: null,
    hasFeaturedProducts: true,
    maxFeaturedProducts: 8,
    hasPdfExport: true,
    hasCustomTheme: true,
    hasAiHelpers: true,
    stripePriceId: "",
    stripePriceIdAnnual: "",
  },
};
