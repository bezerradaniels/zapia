import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Tick02Icon,
  InvoiceIcon,
  QrCodeIcon,
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
import { track } from "@/features/analytics";
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

const PLAN_SUBTITLE: Record<PlanId, string> = {
  basico: "Ideal para começar",
  avancado: "Crescimento acelerado",
  full: "Sem limites para escalar",
  pro: "Crescimento acelerado",
  premium: "Sem limites para escalar",
  custom: "Plano sob medida",
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
    if (searchParams.get("checkout") !== "success") return;
    const planId = sessionStorage.getItem("zapia_checkout_plan");
    if (planId) {
      track("subscription_started", { store_id: store?.id, plan_tier: planId });
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
      track("pix_generated", { store_id: store.id, plan_tier: planId, billing_period: billingPeriod });
    } catch (err: any) {
      setPixError(err?.detail || err?.message || "Erro ao gerar PIX");
    } finally {
      setPixLoading(false);
    }
  };

  const handleStartPayment = (planId: PlanId) => {
    if (!store) return;
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
        onSuccess={() => {
          subscription.refetch();
        }}
      />

      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-1">
          <h1 className="text-[22px] font-bold tracking-tighter">Assinatura</h1>
          <p className="text-sm text-z-text-muted">
            Gerencie seu plano Zapia com pagamento direto via PIX.
          </p>
        </header>

        {pixError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            {pixError}
          </div>
        )}

        {/* Current state */}
        <div className="flex flex-col gap-4 rounded-2xl border border-z-border bg-white p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Badge tone={statusUi.tone}>{statusUi.label}</Badge>
              {sub?.current_period_end && (
                <span className="text-sm text-z-text-muted">
                  {status === "trialing"
                    ? "Trial expira em"
                    : "Vencimento em"}{" "}
                  <strong className="text-z-text">
                    {formatDate(sub.current_period_end)}
                  </strong>
                </span>
              )}
            </div>
            <div className="text-lg font-semibold">
              Plano atual:{" "}
              <span className="text-black">
                {currentPlanId && PLANS[currentPlanId]
                  ? PLANS[currentPlanId].name
                  : "—"}
              </span>
            </div>
            <div className="text-sm text-z-text-muted">
              {status === "active"
                ? "Sua assinatura está ativa e em dia."
                : status === "trialing"
                  ? "Aproveite todos os recursos liberados durante o período de teste."
                  : "Assine um plano via PIX para manter sua loja no ar e vendendo."}
            </div>
          </div>
          <Button
            onClick={() => handleStartPayment(currentPlanId ?? "avancado")}
            className="shrink-0 gap-2 bg-slate-900 text-white hover:bg-slate-800"
          >
            <HugeiconsIcon icon={QrCodeIcon} size={16} />
            {status === "active" ? "Renovar / Alterar via PIX" : "Pagar via PIX"}
          </Button>
        </div>

        {/* Plans */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Planos disponíveis</h2>
          <BillingToggle value={billingPeriod} onChange={setBillingPeriod} />
        </div>
        <section className="grid gap-4 md:grid-cols-3">
          {DISPLAY_PLANS.map((planId) => {
            const plan = PLANS[planId];
            const isCurrent = planId === currentPlanId && status === "active";
            const features = PLAN_FEATURE_TEXT[planId];
            return (
              <div
                key={planId}
                className={cn(
                  "flex flex-col gap-4 rounded-2xl border bg-white p-6 transition-shadow hover:shadow-sm",
                  isCurrent
                    ? "border-z-green ring-2 ring-z-green/20"
                    : "border-z-border",
                )}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-black">
                      Plano {plan.name}
                    </h2>
                    {billingPeriod === "annual" && (
                      <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[11px] font-bold text-white">
                        -
                        {Math.round(
                          ((plan.priceInCents * 12 - plan.priceInCentsAnnual) /
                            (plan.priceInCents * 12)) *
                            100,
                        )}
                        %
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-z-text-muted">
                    {PLAN_SUBTITLE[planId]}
                  </p>
                  {isCurrent && (
                    <Badge tone="green" className="mt-2 inline-block">
                      Plano Atual
                    </Badge>
                  )}
                </div>
                <div>
                  <span className="text-3xl font-bold tracking-tighter text-black">
                    {billingPeriod === "annual"
                      ? formatMoney(Math.round(plan.priceInCentsAnnual / 12))
                      : formatMoney(plan.priceInCents)}
                  </span>
                  <span className="text-sm text-z-text-muted">/mês</span>
                  {billingPeriod === "annual" && (
                    <>
                      <p className="mt-0.5 text-xs font-semibold text-emerald-600">
                        Economize{" "}
                        {formatMoney(
                          plan.priceInCents * 12 - plan.priceInCentsAnnual,
                        )}
                      </p>
                      <p className="mt-1 text-xs font-medium text-z-text-muted">
                        Pagamento anual à vista via PIX:{" "}
                        <strong className="text-black">
                          {formatMoney(plan.priceInCentsAnnual)}
                        </strong>
                      </p>
                    </>
                  )}
                  {billingPeriod === "monthly" && (
                    <p className="mt-0.5 text-xs text-z-text-muted">
                      Pagamento mensal via PIX
                    </p>
                  )}
                </div>
                <ul className="flex flex-col gap-2 text-sm">
                  {features.map((f: string) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-z-text-muted"
                    >
                      <HugeiconsIcon
                        icon={Tick02Icon}
                        size={15}
                        className="mt-0.5 shrink-0 text-black"
                      />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant={isCurrent ? "outline" : "primary"}
                  fullWidth
                  onClick={() => handleStartPayment(planId)}
                  className={cn(
                    "mt-auto gap-1.5",
                    !isCurrent
                      ? "bg-slate-900 text-white hover:bg-slate-800"
                      : "border-z-border text-z-text",
                  )}
                >
                  <HugeiconsIcon icon={QrCodeIcon} size={15} />
                  {isCurrent ? "Renovar via PIX" : "Assinar com PIX"}
                </Button>
              </div>
            );
          })}
        </section>

        {/* Invoices */}
        <section className="rounded-2xl border border-z-border bg-white p-6">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
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
            <ul className="divide-y divide-z-border">
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

