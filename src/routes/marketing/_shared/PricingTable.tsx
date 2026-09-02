import { useState } from "react";
import { Link } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon";
import StarIcon from "@hugeicons/core-free-icons/StarIcon";
import { BillingToggle } from "@/components/ui/BillingToggle";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { PLANS } from "@/config/plans";
import { formatMoney } from "@/lib/format/money";
import { ROUTES } from "@/config/routes";

type PlanCard = {
  id: "basico" | "avancado" | "full";
  tone: "neutral" | "lime" | "lilac";
  features: string[];
  subtitle: string;
  highlight?: boolean;
};

const cards: PlanCard[] = [
  {
    id: "basico",
    tone: "neutral",
    subtitle: "Ideal para começar",
    features: [
      "Até 10 produtos",
      "0 vendedores extras",
      "0 produtos em destaque",
      "1 cupom por vez",
      "Catálogo público online",
      "Pedidos direto no WhatsApp",
    ],
  },
  {
    id: "avancado",
    tone: "lime",
    subtitle: "Crescimento acelerado",
    features: [
      "Até 100 produtos",
      "Até 3 vendedores extras",
      "Até 4 produtos em destaque",
      "5 cupons por vez",
      "Exportação do catálogo em PDF",
      "Cores personalizadas",
    ],
    highlight: true,
  },
  {
    id: "full",
    tone: "lilac",
    subtitle: "Sem limites para escalar",
    features: [
      "Produtos ilimitados",
      "Até 50 vendedores extras",
      "Até 8 produtos em destaque",
      "Cupons ilimitados",
      "Exportação em PDF",
      "Cores personalizadas",
      "Assistente de IA",
    ],
  },
];

export function PricingTable() {
  const [period, setPeriod] = useState<"monthly" | "annual">("annual");

  return (
    <div>
      <div className="mb-8 flex justify-center">
        <BillingToggle value={period} onChange={setPeriod} />
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {cards.map((card) => {
          const plan = PLANS[card.id];
          const highlight = card.highlight;
          return (
            <div
              key={card.id}
              className={cn(
                "relative rounded-2xl bg-white p-7 transition-all",
                highlight
                  ? "border-2 border-z-ink shadow-z-pop md:-translate-y-2"
                  : "border border-z-border",
              )}
            >
              {highlight && (
                <div className="absolute -top-3.5 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-z-ink px-4 py-1 text-[11px] font-bold text-[#10b981]">
                  <HugeiconsIcon icon={StarIcon} size={12} />
                  Mais popular
                </div>
              )}
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-black">
                  Plano {plan.name}
                </h2>
                {period === "annual" && (
                  <span className="rounded-full bg-[#10b981]/10 px-2 py-0.5 text-[11px] font-bold text-[#10b981]">
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
              <p className="mt-1 text-sm text-z-text-muted">{card.subtitle}</p>
              <div className="mt-4">
                <span className="text-4xl font-extrabold tracking-tighter">
                  {period === "annual"
                    ? formatMoney(Math.round(plan.priceInCentsAnnual / 12))
                    : formatMoney(plan.priceInCents)}
                </span>
                <span className="ml-1 text-sm text-z-text-muted">/mês</span>
              </div>
              {period === "annual" && (
                <>
                  <p className="mt-0.5 text-xs font-semibold text-[#10b981]">
                    Economize{" "}
                    {formatMoney(
                      plan.priceInCents * 12 - plan.priceInCentsAnnual,
                    )}
                  </p>
                  <p className="mt-1 text-xs font-medium text-black">
                    Pagamento único por ano{" "}
                    {formatMoney(plan.priceInCentsAnnual)}
                  </p>
                </>
              )}
              {period === "monthly" && (
                <p className="mt-0.5 text-xs text-z-text-muted">
                  Cancele sem multa
                </p>
              )}
              <ul className="mt-6 flex flex-col gap-2.5">
                {card.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-2 text-sm text-z-text-muted"
                  >
                    <HugeiconsIcon
                      icon={Tick02Icon}
                      size={16}
                      className="shrink-0 text-[#10b981]"
                      strokeWidth={2.5}
                    />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                asChild
                variant={highlight ? "primary" : "ghost"}
                fullWidth
                className={cn(
                  "mt-7",
                  highlight
                    ? "text-z-ink"
                    : "bg-green-100 text-green-800 hover:bg-green-200",
                )}
              >
                <Link
                  id={`lp-pricing-btn-${card.id}`}
                  to={`${ROUTES.signup}?period=${period}&plan=${card.id}`}
                >
                  Começar grátis
                </Link>
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
