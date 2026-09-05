import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  InvoiceIcon,
  WhatsappIcon,
  PlusSignIcon,
  SearchIcon,
  Delete02Icon,
} from "@hugeicons/core-free-icons";
import { useActiveStore } from "@/lib/tenant";
import {
  useOrders,
  useOrder,
  useUpdateOrderStatus,
  useDeleteOrder,
} from "@/features/orders";
import { ROUTES } from "@/config/routes";
import { formatMoney } from "@/lib/format";
import { fromE164BR } from "@/lib/br";
import { Badge, Skeleton, Sheet } from "@/components/ui";
import { EmptyState } from "@/components/feedback";
import { cn } from "@/lib/utils";
import type { OrderStatus, OrderWithItems } from "@/types/domain";

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
};

const STATUS_TONE: Record<
  OrderStatus,
  React.ComponentProps<typeof Badge>["tone"]
> = {
  pending: "sky",
  confirmed: "violet",
  completed: "emerald",
  cancelled: "rose",
};

const STATUS_OPTIONS: OrderStatus[] = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
];

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

export default function OrdersPage() {
  const { store } = useActiveStore();
  const orders = useOrders(store?.id);
  const [searchParams] = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const deleteOrder = useDeleteOrder(store?.id);
  const orderFromSearch = searchParams.get("order");

  // Open the order referenced by the `?order=` param. Synced during render
  // (not in an effect) so it reacts to URL changes without an extra pass.
  const [prevOrderFromSearch, setPrevOrderFromSearch] = useState<string | null>(
    null,
  );
  if (orderFromSearch && orderFromSearch !== prevOrderFromSearch) {
    setPrevOrderFromSearch(orderFromSearch);
    setSelectedId(orderFromSearch);
  }

  const allOrders = orders.data ?? [];
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");

  const PAGE_SIZE = 25;
  const [currentPage, setCurrentPage] = useState(1);

  const q = search.trim().toLowerCase();
  const list = allOrders.filter((o) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (
      q &&
      !o.customer_name.toLowerCase().includes(q) &&
      !String(o.order_number).includes(q)
    ) {
      return false;
    }
    return true;
  });

  const [prevFilter, setPrevFilter] = useState({ search, statusFilter });
  if (
    prevFilter.search !== search ||
    prevFilter.statusFilter !== statusFilter
  ) {
    setPrevFilter({ search, statusFilter });
    setCurrentPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const paginatedOrders = list.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold tracking-tight text-[rgb(24,24,26)]">
          Pedidos
        </h1>
        <Link
          to={ROUTES.dashboardOrdersNew}
          className="flex items-center gap-1.5 rounded-xl bg-violet-400 px-3.5 py-2 text-xs font-medium text-white transition-all hover:bg-violet-500"
        >
          <HugeiconsIcon icon={PlusSignIcon} size={15} />
          Novo pedido
        </Link>
      </header>

      {/* Search */}
      <div className="flex h-10 items-center gap-2.5 rounded-xl border border-neutral-200/80 bg-white px-3.5 focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-400/20">
        <HugeiconsIcon
          icon={SearchIcon}
          size={16}
          className="shrink-0 text-neutral-400"
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar pedido ou cliente"
          className="min-w-0 flex-1 bg-transparent text-xs text-[rgb(24,24,26)] outline-none placeholder:text-neutral-400"
        />
      </div>

      {/* Filter chips */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {STATUS_FILTERS.map((f) => {
          const active = statusFilter === f.value;
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all",
                active
                  ? "bg-violet-400 text-neutral-950 font-semibold"
                  : "border border-neutral-200/80 bg-white text-neutral-600 hover:bg-violet-50/50 hover:text-neutral-900",
              )}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {orders.isLoading ? (
        <div className="flex flex-col gap-2.5">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[78px] rounded-2xl" />
          ))}
        </div>
      ) : allOrders.length === 0 ? (
        <EmptyState
          icon={InvoiceIcon}
          title="Nenhum pedido ainda"
          description="Quando um cliente finalizar o checkout, o pedido aparecerá aqui — mesmo que a mensagem do WhatsApp não seja enviada."
        />
      ) : list.length === 0 ? (
        <EmptyState
          icon={SearchIcon}
          title="Nenhum pedido encontrado"
          description="Tente outro filtro ou busca."
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {paginatedOrders.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => setSelectedId(o.id)}
              className="flex flex-col gap-2.5 rounded-2xl border border-neutral-200/80 bg-white p-3.5 text-left transition-colors hover:bg-neutral-50/80 active:bg-neutral-50"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[13px] font-semibold text-[rgb(24,24,26)]">
                  {o.customer_name}
                </span>
                <Badge tone={STATUS_TONE[o.status]}>
                  {STATUS_LABEL[o.status]}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-xs text-neutral-400">
                  #{o.order_number} · {formatDateTime(o.created_at)}
                </span>
                <span className="shrink-0 text-[13px] font-semibold tabular-nums text-[rgb(24,24,26)]">
                  {formatMoney(o.total_in_cents)}
                </span>
              </div>
            </button>
          ))}

          {totalPages > 1 && (
            <div className="mt-2 flex items-center justify-between border-t border-z-border pt-4 text-xs font-semibold text-z-text-muted">
              <span>
                Página {currentPage} de {totalPages} ({list.length} pedidos)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-z-border bg-white px-3 py-1.5 font-medium text-z-text transition-colors hover:bg-z-bg disabled:opacity-40"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-lg border border-z-border bg-white px-3 py-1.5 font-medium text-z-text transition-colors hover:bg-z-bg disabled:opacity-40"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {selectedId && (
        <OrderDetailModal
          id={selectedId}
          onClose={() => setSelectedId(null)}
          onDeleted={() => setSelectedId(null)}
          deleteOrder={deleteOrder}
        />
      )}
    </div>
  );
}

const STATUS_FILTERS: { value: OrderStatus | "all"; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "pending", label: "Novos" },
  { value: "confirmed", label: "Em atendimento" },
  { value: "completed", label: "Concluídos" },
  { value: "cancelled", label: "Cancelados" },
];

function OrderDetailModal({
  id,
  onClose,
  onDeleted,
  deleteOrder,
}: {
  id: string;
  onClose: () => void;
  onDeleted: () => void;
  deleteOrder: ReturnType<typeof useDeleteOrder>;
}) {
  const order = useOrder(id);
  const updateStatus = useUpdateOrderStatus();

  return (
    <Sheet
      open
      onOpenChange={(open) => !open && onClose()}
      className="sm:max-w-lg"
    >
      {order.isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-2/3 rounded-lg" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      ) : order.data ? (
        <OrderDetailContent
          order={order.data}
          updateStatus={updateStatus}
          deleteOrder={deleteOrder}
          onDeleted={onDeleted}
        />
      ) : (
        <div>
          <h2 className="mb-2 text-base font-bold">Pedido não encontrado</h2>
          <p className="text-sm text-z-text-muted">
            Não foi possível carregar as informações do pedido.
          </p>
        </div>
      )}
    </Sheet>
  );
}

function OrderDetailContent({
  order: o,
  updateStatus,
  deleteOrder,
  onDeleted,
}: {
  order: OrderWithItems;
  updateStatus: ReturnType<typeof useUpdateOrderStatus>;
  deleteOrder: ReturnType<typeof useDeleteOrder>;
  onDeleted: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-col gap-4">
      <header>
        <h2 className="truncate text-lg font-bold">{o.customer_name}</h2>
        <p className="text-xs text-z-text-muted">
          {formatDateTime(o.created_at)}
        </p>
      </header>

      <div className="flex min-h-0 flex-col gap-4">
        <div className="flex flex-col gap-1.5 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-z-text-muted">WhatsApp:</span>
            <a
              href={`https://wa.me/${o.customer_phone.replace("+", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-black hover:underline"
            >
              <HugeiconsIcon icon={WhatsappIcon} size={14} />
              {fromE164BR(o.customer_phone)}
            </a>
          </div>
          {o.customer_notes && (
            <div className="rounded-lg bg-z-bg2 p-3">
              <div className="mb-1 text-xs font-medium text-z-text-hint">
                Observações
              </div>
              <p className="whitespace-pre-line text-sm">{o.customer_notes}</p>
            </div>
          )}
        </div>

        <div>
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-z-text-hint">
            Itens
          </h3>
          <ul className="flex flex-col gap-1.5 text-sm">
            {o.items.map((i) => (
              <li key={i.id} className="flex justify-between gap-2">
                <span className="truncate text-z-text-muted">
                  {i.quantity}× {i.product_name}
                </span>
                <span className="shrink-0 font-semibold tabular-nums">
                  {formatMoney(i.price_in_cents * i.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between border-t border-z-border pt-3 font-bold">
            <span>Total</span>
            <span className="tabular-nums text-black">
              {formatMoney(o.total_in_cents)}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-z-text-hint">
            Status do pedido
          </label>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_OPTIONS.map((status) => (
              <button
                key={status}
                type="button"
                disabled={updateStatus.isPending || o.status === status}
                onClick={() =>
                  updateStatus.mutate({ id: o.id, status, oldStatus: o.status })
                }
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-all disabled:opacity-60",
                  o.status === status
                    ? "border-violet-500 bg-violet-500 text-white font-medium"
                    : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50",
                )}
              >
                {STATUS_LABEL[status]}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          disabled={deleteOrder.isPending}
          onClick={() => {
            if (!confirm(`Excluir pedido de "${o.customer_name}"?`)) return;
            deleteOrder.mutate(o.id, { onSuccess: onDeleted });
          }}
          className="flex items-center justify-center gap-2 rounded-xl border border-z-border py-3 text-sm font-semibold text-z-red transition-colors hover:bg-z-rose/40 disabled:opacity-50"
        >
          <HugeiconsIcon icon={Delete02Icon} size={16} />
          Excluir pedido
        </button>
      </div>
    </div>
  );
}
