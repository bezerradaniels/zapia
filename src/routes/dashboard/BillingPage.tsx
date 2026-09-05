import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Tick02Icon,
  InvoiceIcon,
  QrCodeIcon,
  ArrowDown01Icon,
} from "@hugeicons/core-free-icons";
import { Badge, BillingToggle, Button } from "@/components/ui";
import {
  useInvoices,
  useSubscription,
  DowngradeProductSelector,
  PixPaymentModal,
  createMercadoPagoPix,
  type PixPaymentResponse,
} from "@/features/billing";
import { useProducts } from "@/features/products";
import { useActiveStore } from "@/lib/tenant";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PLANS } from "@/config/plans";
import { track, trackSubscriptionPurchase } from "@/features/analytics";
import type { PlanId, SubscriptionStatus } from "@/types/domain";

const DISPLAY_PLANS: PlanId[] = ["basico", "avancado", "full"];

const PLAN_FEATURE_TEXT: Record<PlanId, string[]> = {
  basico: [
    "Até 10 produtos",
    "0 vendedores extras",
    "0 produtos em destaque",
    "1 cupom por vez",
    "Catálogo público",
    "Pedidos via WhatsApp",
  ],
  avancado: [
    "Até 100 produtos",
    "Até 3 vendedores extras",
    "Até 4 produtos em destaque",
    "5 cupons por vez",
    "Exportação em PDF",
    "Cores personalizadas",
    "Assistente de IA",
  ],
  full: [
    "Produtos ilimitados",
    "Até 50 vendedores extras",
    "Até 8 produtos em destaque",
    "Cupons ilimitados",
    "Exportação em PDF",
    "Cores personalizadas",
    "Assistente de IA",
  ],
  pro: [
    "Até 100 produtos",
    "Até 3 vendedores extras",
    "Até 4 produtos em destaque",
    "5 cupons por vez",
    "Exportação em PDF",
    "Cores personalizadas",
    "Assistente de IA",
  ],
  premium: [
    "Produtos ilimitados",
    "Até 50 vendedores extras",
    "Até 8 produtos em destaque",
    "Cupons ilimitados",
    "Exportação em PDF",
    "Cores personalizadas",
    "Assistente de IA",
  ],
  custom: [
    "Recursos e limites personalizados",
    "Configurado pelo suporte / administrador",
  ],
};


const STATUS_TONE: Record<
  SubscriptionStatus,
  { tone: React.ComponentProps<typeof Badge>["tone"]; label: string }
> = {
  none: { tone: "neutral", label: "Sem assinatura" },
  trialing: { tone: "lilac", label: "Trial (7 dias grátis)" },
  active: { tone: "green", label: "Ativa" },
  past_due: { tone: "amber", label: "Pagamento pendente" },
  canceled: { tone: "rose", label: "Cancelada" },
  unpaid: { tone: "rose", label: "Inadimplente" },
  incomplete: { tone: "amber", label: "Incompleta" },
  incomplete_expired: { tone: "rose", label: "Expirada" },
  paused: { tone: "neutral", label: "Pausada" },
};

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
  }).format(new Date(iso));
}

export default function BillingPage() {
  const { store } = useActiveStore();
  const subscription = useSubscription(store?.id);
  const invoices = useInvoices(store?.id);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    track("pricing_page_viewed", { store_id: store?.id });
  }, [store?.id]);

  useEffect(() => {
    if (searchParams.get("checkout") !== "success") return;
    const planId = sessionStorage.getItem("zapia_checkout_plan");
    if (planId) {
      const priceMap: Record<string, number> = {
        basico: 9.9,
        avancado: 14.9,
        full: 29.9,
        pro: 14.9,
        premium: 29.9,
      };
      const planValue = priceMap[planId] ?? 14.9;
      const txId = `stripe_${store?.id ?? "sub"}_${Date.now()}`;

      trackSubscriptionPurchase({
        transactionId: txId,
        planId,
        planName: `Plano ${planId.charAt(0).toUpperCase() + planId.slice(1)}`,
        value: planValue,
        storeId: store?.id,
        paymentMethod: "stripe",
      });

      track("subscription_started", {
        store_id: store?.id,
        plan_tier: planId,
        value: planValue,
      });
      sessionStorage.removeItem("zapia_checkout_plan");
    }
    setSearchParams(
      (params) => {
        params.delete("checkout");
        return params;
      },
      { replace: true },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const sub = subscription.data;
  const status = sub?.status ?? "none";
  const statusUi = STATUS_TONE[status];
  const currentPlanId = sub?.plan_id ?? null;

  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">(
    "annual",
  );
  const [pendingPlanId, setPendingPlanId] = useState<PlanId | null>(null);
  const [pixModalOpen, setPixModalOpen] = useState(false);
  const [pixLoading, setPixLoading] = useState(false);
  const [pixData, setPixData] = useState<PixPaymentResponse | null>(null);
  const [pixError, setPixError] = useState<string | null>(null);
  const [expandedPlans, setExpandedPlans] = useState<Record<string, boolean>>({});

  const togglePlanDetails = (planId: string) => {
    setExpandedPlans((prev) => ({
      ...prev,
      [planId]: !prev[planId],
    }));
  };

  const products = useProducts(store?.id);

  const proceedToPix = async (planId: PlanId) => {
    if (!store) return;
    setPendingPlanId(null);
    setPixModalOpen(true);
    setPixLoading(true);
    setPixError(null);

    try {
      const res = await createMercadoPagoPix(store.id, planId, billingPeriod);
      setPixData(res);
      const amountReais = (res.amountInCents ?? 0) / 100;
      track("pix_generated", {
        store_id: store.id,
        plan_tier: planId,
        billing_period: billingPeriod,
        value: amountReais,
      });
    } catch (err) {
      const e = err as { detail?: string; message?: string };
      setPixError(e?.detail || e?.message || "Erro ao gerar PIX");
    } finally {
      setPixLoading(false);
    }
  };

  const handleStartPayment = (planId: PlanId) => {
    if (!store) return;
    const priceMap: Record<string, number> = {
      basico: 9.9,
      avancado: 14.9,
      full: 29.9,
      pro: 14.9,
      premium: 29.9,
    };
    track("begin_checkout", {
      store_id: store.id,
      plan_tier: planId,
      billing_period: billingPeriod,
      value: priceMap[planId] ?? 14.9,
    });
    setPendingPlanId(planId);
    const targetLimit = PLANS[planId]?.maxProducts ?? null;
    const activeCount = (products.data ?? []).filter(
      (p) => p.is_active && !p.deleted_at,
    ).length;

    if (targetLimit !== null && activeCount > targetLimit) {
      // Show downgrade product selector
      return;
    }

    proceedToPix(planId);
  };

  const activeProducts = (products.data ?? []).filter(
    (p) => p.is_active && !p.deleted_at,
  );

  const showDowngradeModal =
    pendingPlanId !== null &&
    (() => {
      const targetLimit = PLANS[pendingPlanId]?.maxProducts ?? null;
      return targetLimit !== null && activeProducts.length > targetLimit;
    })();

  return (
    <>
      {showDowngradeModal && pendingPlanId && (
        <DowngradeProductSelector
          storeId={store!.id}
          activeProducts={activeProducts}
          newLimit={PLANS[pendingPlanId]?.maxProducts ?? 10}
          onConfirm={() => proceedToPix(pendingPlanId)}
          onCancel={() => setPendingPlanId(null)}
        />
      )}

      {/* PIX Payment Modal */}
      <PixPaymentModal
        open={pixModalOpen}
        onClose={() => {
          setPixModalOpen(false);
          setPixData(null);
          subscription.refetch();
        }}
        storeId={store?.id ?? ""}
        pixData={pixData}
        isLoading={pixLoading}
        billingPeriod={billingPeriod}
        planId={pendingPlanId || undefined}
        onSuccess={() => {
          subscription.refetch();
        }}
      />

      <div className="flex flex-col gap-6">
        {/* Header Area */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold tracking-tight text-[rgb(24,24,26)]">
              Assinatura
            </h1>
            <Badge tone={statusUi.tone}>{statusUi.label}</Badge>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-neutral-600">
              {status === "trialing"
                ? "Trial expira em"
                : sub?.current_period_end
                  ? "Vencimento em"
                  : "Status:"}{" "}
              <strong className="font-semibold text-neutral-900">
                {sub?.current_period_end ? formatDate(sub.current_period_end) : "—"}
              </strong>
            </span>
            <button
              type="button"
              onClick={() => handleStartPayment(currentPlanId ?? "avancado")}
              className="inline-flex items-center justify-center rounded-lg bg-[#10b981] hover:bg-[#059669] px-3 py-1.5 text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              Assinar agora
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-neutral-600">
              Plano atual:{" "}
              <strong className="font-semibold text-neutral-900">
                {currentPlanId && PLANS[currentPlanId]
                  ? PLANS[currentPlanId].name
                  : "Full"}
              </strong>
            </span>
            <span className="text-neutral-300">•</span>
            <button
              type="button"
              onClick={() => {
                document.getElementById("planos-section")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-xs font-medium text-violet-600 hover:text-violet-700 underline underline-offset-2 transition-colors cursor-pointer"
            >
              Trocar plano e assinar
            </button>
          </div>
        </div>

        {pixError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
            {pixError}
          </div>
        )}

        {/* Plans */}
        <div id="planos-section" className="flex items-center justify-between pt-1">
          <h2 className="text-sm md:text-base font-semibold text-neutral-900">Planos disponíveis</h2>
          <BillingToggle value={billingPeriod} onChange={setBillingPeriod} />
        </div>
        <section className="grid gap-3 md:grid-cols-3">
          {DISPLAY_PLANS.map((planId) => {
            const plan = PLANS[planId];
            const isCurrent = planId === currentPlanId && status === "active";
            const features = PLAN_FEATURE_TEXT[planId];
            const isExpanded = !!expandedPlans[planId];
            const annualDiscount = Math.round(
              ((plan.priceInCents * 12 - plan.priceInCentsAnnual) /
                (plan.priceInCents * 12)) *
                100,
            );

            return (
              <div
                key={planId}
                className={cn(
                  "flex flex-col gap-3 rounded-2xl border bg-white p-4 transition-colors",
                  isCurrent
                    ? "border-violet-400 ring-1 ring-violet-400"
                    : "border-neutral-200/80",
                )}
              >
                {/* Header: Title + discount + "Quero este" button (space-between) */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                    <h3 className="text-sm font-bold text-neutral-900 truncate">
                      Plano {plan.name}
                    </h3>
                    {billingPeriod === "annual" && (
                      <span className="shrink-0 rounded-md bg-neutral-900 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        -{annualDiscount}%
                      </span>
                    )}
                    {isCurrent && (
                      <span className="shrink-0 rounded-md bg-violet-50 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700 border border-violet-200">
                        Atual
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleStartPayment(planId)}
                    className="shrink-0 rounded-[10px] bg-violet-400 hover:bg-violet-500 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors cursor-pointer"
                  >
                    Contrate agora
                  </button>
                </div>

                {/* Price info */}
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl md:text-2xl font-bold tracking-tight text-neutral-900">
                      {billingPeriod === "annual"
                        ? formatMoney(Math.round(plan.priceInCentsAnnual / 12))
                        : formatMoney(plan.priceInCents)}
                    </span>
                    <span className="text-xs text-neutral-500">/mês</span>
                  </div>
                  {billingPeriod === "annual" ? (
                    <p className="mt-0.5 text-[11px] font-medium text-emerald-600">
                      Economize {formatMoney(plan.priceInCents * 12 - plan.priceInCentsAnnual)} no anual
                    </p>
                  ) : (
                    <p className="mt-0.5 text-[11px] text-neutral-500">
                      Pagamento mensal via PIX
                    </p>
                  )}
                </div>

                {/* Collapsible features toggle */}
                <div className="pt-2 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={() => togglePlanDetails(planId)}
                    className="flex w-full items-center justify-between text-xs font-medium text-neutral-500 hover:text-neutral-900 transition-colors py-0.5 cursor-pointer"
                  >
                    <span>{isExpanded ? "Ocultar detalhes" : "Mais detalhes"}</span>
                    <HugeiconsIcon
                      icon={ArrowDown01Icon}
                      size={14}
                      className={cn(
                        "transition-transform duration-200",
                        isExpanded && "rotate-180",
                      )}
                    />
                  </button>
                  {isExpanded && (
                    <ul className="mt-2.5 flex flex-col gap-1.5 text-xs text-neutral-600">
                      {features.map((f: string) => (
                        <li key={f} className="flex items-start gap-2">
                          <HugeiconsIcon
                            icon={Tick02Icon}
                            size={14}
                            className="mt-0.5 shrink-0 text-neutral-900"
                          />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            );
          })}
        </section>

        {/* Invoices */}
        <section className="rounded-2xl border border-neutral-200/80 bg-white p-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm md:text-base font-semibold text-neutral-900">
            <HugeiconsIcon icon={InvoiceIcon} size={18} />
            Histórico de Pagamentos PIX
          </h2>
          {invoices.isLoading ? (
            <p className="text-sm text-z-text-muted">Carregando faturas...</p>
          ) : !invoices.data || invoices.data.length === 0 ? (
            <p className="text-sm text-z-text-muted">
              Seus comprovantes de pagamento aparecerão aqui assim que a primeira fatura for gerada.
            </p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {invoices.data.map((inv) => (
                <li
                  key={inv.id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-black">
                      {formatMoney(inv.amount_in_cents)}
                    </div>
                    <div className="text-xs text-z-text-muted">
                      {formatDate(inv.created_at)} ·{" "}
                      <span
                        className={cn(
                          "font-medium",
                          inv.status === "paid"
                            ? "text-emerald-600"
                            : "text-amber-600",
                        )}
                      >
                        {inv.status === "paid" ? "Pago" : "Pendente"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {inv.status === "pending" && inv.pix_qr_code && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs gap-1"
                        onClick={() => {
                          setPixData({
                            invoiceId: inv.id,
                            mpPaymentId: inv.mp_payment_id || "",
                            qrCode: inv.pix_qr_code || "",
                            qrCodeBase64: inv.pix_qr_code_base64 || "",
                            expiresAt: inv.pix_expires_at || null,
                            amountInCents: inv.amount_in_cents,
                            planName: inv.plan_id ? PLANS[inv.plan_id]?.name : "Plano",
                            billingPeriod: (inv.billing_period as "monthly" | "annual") || "monthly",
                          });
                          setPixModalOpen(true);
                        }}
                      >
                        <HugeiconsIcon icon={QrCodeIcon} size={13} />
                        Ver PIX
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

