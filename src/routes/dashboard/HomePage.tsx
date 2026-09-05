import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  InvoiceIcon,
  CreditCardIcon,
  PackageIcon,
  UserGroupIcon,
  ArrowRightIcon,
  Add01Icon,
  Share01Icon,
  ShoppingBag03Icon,
} from "@hugeicons/core-free-icons";
import { useActiveStore } from "@/lib/tenant";
import { useOrders } from "@/features/orders";
import { useProducts } from "@/features/products";
import { useCustomers } from "@/features/customers";
import { useSession } from "@/features/auth";
import { formatMoney } from "@/lib/format";
import { ROUTES } from "@/config/routes";
import { Button, Skeleton } from "@/components/ui";
import type { Order } from "@/types/domain";
import { cn } from "@/lib/utils";

function getGreeting(): string {
  const h = parseInt(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Sao_Paulo",
      hour: "numeric",
      hour12: false,
    }).format(new Date()),
  );
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function WelcomeModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50/80 p-4">
      <div className="w-full max-w-md rounded-2xl border border-z-border bg-white p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white">
          <HugeiconsIcon icon={ShoppingBag03Icon} size={30} />
        </div>
        <h2 className="text-xl font-bold">Sua loja está pronta!</h2>
        <p className="mt-2 text-sm text-z-text-muted">
          Agora é hora de adicionar seus primeiros produtos para que seus
          clientes possam ver e comprar.
        </p>
        <div className="mt-6 flex flex-col gap-2.5">
          <Button
            fullWidth
            size="lg"
            onClick={() => {
              onClose();
              navigate(ROUTES.dashboardProducts + "/novo");
            }}
          >
            <HugeiconsIcon icon={Add01Icon} size={16} />
            Adicionar primeiro produto
          </Button>
          <Button variant="ghost" fullWidth onClick={onClose}>
            Explorar o dashboard primeiro
          </Button>
        </div>
      </div>
    </div>
  );
}

function startOfTodaySP(): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return new Date(`${parts}T00:00:00-03:00`);
}

function startOfMonthSP(): Date {
  const today = startOfTodaySP();
  return new Date(today.getFullYear(), today.getMonth(), 1);
}

const STATUS_LABEL: Record<Order["status"], string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
};

export default function HomePage() {
  const { store } = useActiveStore();
  const { session } = useSession();
  const orders = useOrders(store?.id);
  const products = useProducts(store?.id);
  const customers = useCustomers(store?.id);
  const [searchParams, setSearchParams] = useSearchParams();
  const [showWelcome, setShowWelcome] = useState(
    searchParams.get("welcome") === "1",
  );

  useEffect(() => {
    if (searchParams.get("welcome") === "1") {
      setSearchParams({}, { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const firstName =
    (session?.user.user_metadata?.name as string | undefined)?.split(" ")[0] ??
    store?.name?.split(" ")[0] ??
    "você";

  const list = orders.data ?? [];
  const todayStart = startOfTodaySP().getTime();
  const monthStart = startOfMonthSP().getTime();

  const billable = list.filter((o) => o.status !== "cancelled");
  const todayOrders = billable.filter(
    (o) => new Date(o.created_at).getTime() >= todayStart,
  );
  const monthOrders = billable.filter(
    (o) => new Date(o.created_at).getTime() >= monthStart,
  );
  const monthRevenue = monthOrders.reduce(
    (sum, o) => sum + o.total_in_cents,
    0,
  );
  const pendingCount = list.filter((o) => o.status === "pending").length;
  const activeProducts = (products.data ?? []).filter(
    (p) => p.is_active,
  ).length;
  const customerCount = (customers.data ?? []).length;

  const recent = list.slice(0, 5);

  return (
    <div className="flex flex-col gap-5">
      {showWelcome && <WelcomeModal onClose={() => setShowWelcome(false)} />}

      {/* Greeting */}
      <div className="flex flex-col gap-0.5">
        <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-neutral-900">
          {getGreeting()}, {firstName}
        </h1>
        <p className="text-[12px] text-neutral-400 font-normal">
          Aqui está o resumo da sua loja hoje.
        </p>
      </div>

      {/* Quick actions — single line */}
      <div className="grid grid-cols-3 gap-2">
        {[
          {
            label: "Produtos",
            icon: PackageIcon,
            href: ROUTES.dashboardProducts,
            iconClass: "bg-emerald-50 text-emerald-800 border border-emerald-200/60 group-hover:bg-emerald-100",
          },
          {
            label: "Pedidos",
            icon: InvoiceIcon,
            href: ROUTES.dashboardOrders,
            iconClass: "bg-sky-50 text-sky-800 border border-sky-200/60 group-hover:bg-sky-100",
          },
          {
            label: "Personalizar",
            icon: Share01Icon,
            href: ROUTES.dashboardCatalog,
            iconClass: "bg-violet-50 text-violet-800 border border-violet-200/60 group-hover:bg-violet-100",
          },
        ].map((action) => (
          <Link
            key={action.label}
            to={action.href}
            className="group flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl border border-neutral-200/80 bg-white px-2 py-2 sm:px-3 sm:py-2 transition-all hover:border-neutral-300 hover:bg-neutral-50/70"
          >
            <div className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition-colors", action.iconClass)}>
              <HugeiconsIcon icon={action.icon} size={14} />
            </div>
            <span className="truncate text-[12px] font-medium text-[rgb(24,24,26)]">
              {action.label}
            </span>
          </Link>
        ))}
      </div>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
        <StatCard
          label="Pedidos hoje"
          value={todayOrders.length.toString()}
          sub={
            pendingCount > 0
              ? `${pendingCount} pendente${pendingCount === 1 ? "" : "s"}`
              : "Tudo em dia"
          }
          subPositive={pendingCount > 0}
          icon={InvoiceIcon}
        />
        <StatCard
          label="Receita do mês"
          value={formatMoney(monthRevenue)}
          sub="Exclui cancelados"
          icon={CreditCardIcon}
        />
        <StatCard
          label="Produtos ativos"
          value={activeProducts.toString()}
          sub={`${(products.data ?? []).length} no total`}
          icon={PackageIcon}
        />
        <StatCard
          label="Clientes"
          value={customerCount.toString()}
          sub="Cadastrados"
          icon={UserGroupIcon}
        />
      </section>

      {/* Chart + recent orders */}
      <section className="grid gap-3.5 lg:grid-cols-[1fr_1.4fr]">
        <div className="rounded-xl border border-neutral-200/80 bg-white p-4 sm:p-5">
          <div className="mb-0.5 text-[13px] font-semibold text-neutral-900">
            Pedidos dos últimos dias
          </div>
          <div className="mb-3 text-[11px] text-neutral-400">
            {billable.length} pedido{billable.length === 1 ? "" : "s"} no total
          </div>
          <WeeklyBars orders={list} />
        </div>

        <div className="rounded-xl border border-neutral-200/80 bg-white p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[13px] font-semibold text-neutral-900">
              Últimos pedidos
            </div>
            <Link
              to={ROUTES.dashboardOrders}
              className="inline-flex items-center gap-1 text-[11.5px] font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              Ver todos
              <HugeiconsIcon icon={ArrowRightIcon} size={11} />
            </Link>
          </div>
          {orders.isLoading ? (
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-9 rounded-lg" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <div className="flex flex-col items-center gap-2.5 rounded-lg border border-dashed border-neutral-200 py-8 text-center">
              <HugeiconsIcon
                icon={PackageIcon}
                size={26}
                className="text-neutral-300"
              />
              <p className="text-xs text-neutral-400">Nenhum pedido ainda.</p>
              <Link
                to={ROUTES.dashboardCatalog}
                className="text-xs font-medium text-neutral-900 hover:underline"
              >
                Compartilhar catálogo →
              </Link>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-neutral-100">
              {recent.map((o) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between gap-2 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-medium text-neutral-900">
                      {o.customer_name}
                    </p>
                    <p className="text-[10.5px] text-neutral-400">
                      {new Intl.DateTimeFormat("pt-BR", {
                        timeZone: "America/Sao_Paulo",
                        dateStyle: "short",
                        timeStyle: "short",
                      }).format(new Date(o.created_at))}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-0.5">
                    <span className="text-[12.5px] font-semibold text-neutral-900 tabular-nums">
                      {formatMoney(o.total_in_cents)}
                    </span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700">
                      {STATUS_LABEL[o.status]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  subPositive,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  subPositive?: boolean;
  icon: IconSvgElement;
}) {
  return (
    <div className="rounded-xl border border-neutral-200/80 bg-white p-3.5 sm:p-4 transition-all hover:border-neutral-300">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold text-[rgb(24,24,26)]">{label}</span>
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-neutral-100 text-neutral-600">
          <HugeiconsIcon icon={icon} size={13} />
        </div>
      </div>
      <div className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-900 leading-none">
        {value}
      </div>
      {sub && (
        <div
          className={cn(
            "mt-1.5 text-[10.5px]",
            subPositive
              ? "font-medium text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.2 rounded-md w-fit"
              : "text-neutral-400",
          )}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

function WeeklyBars({ orders }: { orders: Order[] }) {
  const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  const today = startOfTodaySP();
  const counts = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(today);
    day.setDate(today.getDate() - (6 - i));
    const start = day.getTime();
    const end = start + 24 * 60 * 60 * 1000;
    return orders.filter((o) => {
      if (o.status === "cancelled") return false;
      const t = new Date(o.created_at).getTime();
      return t >= start && t < end;
    }).length;
  });

  const labels = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(today);
    day.setDate(today.getDate() - (6 - i));
    const dow = day.getDay();
    return days[(dow + 6) % 7];
  });

  const max = Math.max(...counts, 1);

  return (
    <div className="flex h-28 items-end gap-1.5 px-1">
      {counts.map((v, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
          <div
            className={cn(
              "w-full rounded-t-lg transition-colors",
              i === counts.length - 1 ? "bg-[#a78bfa]" : "bg-neutral-100 hover:bg-neutral-200/80",
            )}
            style={{ height: `${(v / max) * 88 + 4}px` }}
            title={`${v} pedido${v === 1 ? "" : "s"}`}
          />
          <span
            className={cn(
              "text-[10px]",
              i === counts.length - 1
                ? "font-semibold text-violet-900"
                : "text-neutral-400",
            )}
          >
            {labels[i]}
          </span>
        </div>
      ))}
    </div>
  );
}
