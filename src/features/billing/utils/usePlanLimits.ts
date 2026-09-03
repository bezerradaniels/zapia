import { useMemo } from "react";
import { PLANS } from "@/config/plans";
import type { PlanFeatures, Subscription } from "@/types/domain";
import { useSubscription } from "../hooks/useSubscription";
import { usePlanFeatures } from "../hooks/usePlanFeatures";

export type PlanLimits = {
  /** Effective plan in use right now (subscription's plan_id, or null if no sub yet). */
  plan: PlanFeatures | null;
  subscription: Subscription | null;
  isLoading: boolean;
  /** True when the feature is allowed under the current plan. */
  canUse: (feature: "pdf" | "theme" | "ai" | "featured" | "gallery") => boolean;
  /** Number of products allowed; null = unlimited. */
  productLimit: number | null;
  /** Number of sellers allowed; null = unlimited. */
  sellerLimit: number | null;
  /** Number of coupons allowed; null = unlimited. */
  couponLimit: number | null;
};

/**
 * Single source of truth for plan-gated UI. Components should read from this
 * instead of hardcoding plan IDs.
 */
export function usePlanLimits(storeId: string | undefined): PlanLimits {
  const sub = useSubscription(storeId);
  const plans = usePlanFeatures();

  return useMemo<PlanLimits>(() => {
    const subscription = sub.data ?? null;
    const planId = subscription?.plan_id;
    // `plan_features` (DB) only carries the limits read at the SQL/RPC layer
    // (max_products, has_ai_helpers, has_custom_theme); the rest of the
    // feature gates live in the static `PLANS` config per CLAUDE.md §13.12
    // ("never hardcode plan limits in components — import from
    // src/config/plans.ts or query plan_features").
    const plan = (planId && plans.data?.find((p) => p.id === planId)) ?? null;
    const isTrialActive =
      subscription?.status === "trialing" &&
      (!subscription.trial_ends_at ||
        new Date(subscription.trial_ends_at).getTime() > Date.now());

    const isSubscriptionActive =
      subscription?.status === "active" || isTrialActive;

    const custom = subscription?.custom_limits;

    if (isSubscriptionActive && (planId === "custom" || !!custom)) {
      return {
        plan: plan ?? {
          id: "custom",
          name: "Custom",
          price_in_cents: 0,
          max_products: custom?.maxProducts ?? 9999,
          max_sellers: custom?.maxSellers ?? 99,
          has_ai_helpers: true,
          has_pdf_export: custom?.hasPdfExport ?? true,
          has_custom_theme: true,
          stripe_price_id: null,
          stripe_price_monthly: null,
          stripe_price_annual: null,
        },
        subscription,
        isLoading: sub.isLoading || plans.isLoading,
        canUse: (feature) => {
          if (feature === "pdf") return custom?.hasPdfExport ?? true;
          if (feature === "theme") return true;
          if (feature === "ai") return true;
          if (feature === "featured") return custom?.hasFeaturedProducts ?? true;
          if (feature === "gallery") return true;
          return false;
        },
        productLimit: custom?.maxProducts ?? null,
        sellerLimit:
          custom && typeof custom.maxSellers === "number"
            ? custom.maxSellers
            : null,
        couponLimit:
          custom && typeof custom.maxCoupons === "number"
            ? custom.maxCoupons
            : null,
      };
    }

    const config = isTrialActive
      ? PLANS.full
      : isSubscriptionActive && planId && PLANS[planId]
        ? PLANS[planId]
        : null;

    return {
      plan,
      subscription,
      isLoading: sub.isLoading || plans.isLoading,
      canUse: (feature) => {
        if (!config) return false;
        if (feature === "pdf") return config.hasPdfExport;
        if (feature === "theme") return config.hasCustomTheme;
        if (feature === "ai") return config.hasAiHelpers;
        if (feature === "featured") return config.hasFeaturedProducts;
        if (feature === "gallery") return config.hasCustomTheme;
        return false;
      },
      productLimit: config?.maxProducts ?? null,
      sellerLimit:
        config && Number.isFinite(config.maxSellers) ? config.maxSellers : null,
      couponLimit:
        config && Number.isFinite(config.maxCoupons) ? config.maxCoupons : null,
    };
  }, [sub.data, sub.isLoading, plans.data, plans.isLoading]);
}
