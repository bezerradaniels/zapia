import { useState } from "react";
import { Link } from "react-router-dom";
import { useAdminStores } from "@/features/admin";
import { deleteAdminStore } from "@/features/admin/api/mutations";
import type { AdminStoreRow } from "@/features/admin";
import { ROUTES } from "@/config/routes";

const PLAN_LABELS: Record<string, string> = {
  basico: "Gratuito",
  pro: "Pro",
  premium: "Premium",
};

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-800 border border-emerald-200/80",
  trialing: "bg-sky-50 text-sky-800 border border-sky-200/80",
  past_due: "bg-rose-50 text-rose-800 border border-rose-200/80",
  canceled: "bg-neutral-100 text-neutral-600 border border-neutral-200/80",
  inactive: "bg-neutral-100 text-neutral-600 border border-neutral-200/80",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Ativo",
  trialing: "Trial",
  past_due: "Inadimplente",
  canceled: "Cancelado",
  inactive: "Inativo",
};

function trialDaysLeft(endsAt: string | null): number | null {
  if (!endsAt) return null;
  const diff = new Date(endsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(iso));
}

export default function AdminStoresPage() {
  const { data: stores, isLoading, error, refetch } = useAdminStores();
  const [search, setSearch] = useState("");

  const filtered = (stores ?? []).filter((s) => {
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.slug.toLowerCase().includes(q) ||
      s.owner_email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      {/* Top Header & Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-neutral-900 sm:text-xl">
            Lojas cadastradas
          </h1>
          <p className="text-[12px] text-neutral-400 font-normal">
            {stores
              ? `${stores.length} loja${stores.length !== 1 ? "s" : ""} registrada${stores.length !== 1 ? "s" : ""} no sistema`
              : "Carregando contagem..."}
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <input
            type="search"
            placeholder="Buscar loja, slug ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-neutral-200/80 bg-white px-3 py-1.5 text-xs text-neutral-900 placeholder:text-neutral-400 shadow-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 focus:outline-none"
          />
        </div>
      </div>

      {isLoading && (
        <div className="flex h-48 items-center justify-center text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
            <span>Carregando lista de lojas...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="flex h-36 items-center justify-center rounded-xl border border-rose-200/80 bg-rose-50/50 text-xs text-rose-700">
          Erro ao carregar lojas. Verifique as permissões de acesso.
        </div>
      )}

      {!isLoading && !error && (
        <div className="overflow-hidden rounded-xl border border-neutral-200/80 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-200/80 bg-neutral-50/80">
                  {[
                    "Loja",
                    "Proprietário",
                    "Criada em",
                    "Plano",
                    "Status",
                    "Trial",
                    "Último pgto.",
                    "Produtos",
                    "Vendedores",
                    "",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-neutral-400"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white">
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-4 py-12 text-center text-xs text-neutral-400"
                    >
                      Nenhuma loja encontrada para os termos pesquisados.
                    </td>
                  </tr>
                ) : (
                  filtered.map((store) => (
                    <StoreRow key={store.id} store={store} onDeleted={refetch} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StoreRow({
  store,
  onDeleted,
}: {
  store: AdminStoreRow;
  onDeleted: () => void;
}) {
  const days = trialDaysLeft(store.trial_ends_at);
  const statusKey = store.plan_status ?? "inactive";
  const statusStyle = STATUS_STYLES[statusKey] ?? STATUS_STYLES.inactive;
  const statusLabel = STATUS_LABELS[statusKey] ?? statusKey;
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (
      !confirm(
        `Excluir permanentemente a loja "${store.name}"? Esta ação não pode ser desfeita.`,
      )
    )
      return;
    try {
      setIsDeleting(true);
      await deleteAdminStore(store.id);
      onDeleted();
    } catch (err) {
      alert("Erro ao excluir loja: " + (err as Error).message);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <tr className="transition-colors hover:bg-neutral-50/60">
      <td className="px-4 py-2.5">
        <div className="font-medium text-neutral-900">{store.name}</div>
        <a
          href={`https://zapia.app/${store.slug}`}
          target="_blank"
          rel="noreferrer"
          className="text-[11px] font-normal text-neutral-400 hover:text-neutral-900 transition-colors"
        >
          zapia.app/{store.slug} ↗
        </a>
      </td>

      <td className="px-4 py-2.5">
        <div className="font-medium text-neutral-800">
          {store.owner_name ?? "—"}
        </div>
        <div className="text-[11px] text-neutral-400">{store.owner_email}</div>
      </td>

      <td className="px-4 py-2.5 text-neutral-500">
        {formatDate(store.created_at)}
      </td>

      <td className="px-4 py-2.5 font-medium text-neutral-700">
        {store.plan_id ? (PLAN_LABELS[store.plan_id] ?? store.plan_id) : "—"}
      </td>

      <td className="px-4 py-2.5">
        <span
          className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${statusStyle}`}
        >
          {statusLabel}
        </span>
      </td>

      <td className="px-4 py-2.5 text-neutral-500">
        {days !== null ? (
          <span
            className={
              days === 0
                ? "font-medium text-rose-600"
                : days <= 3
                  ? "font-medium text-amber-700"
                  : "text-neutral-700"
            }
          >
            {days}d
          </span>
        ) : (
          "—"
        )}
      </td>

      <td className="px-4 py-2.5 text-neutral-500">
        {formatDate(store.last_payment_at)}
      </td>

      <td className="px-4 py-2.5 font-medium text-neutral-900">
        {store.product_count}
      </td>

      <td className="px-4 py-2.5 font-medium text-neutral-900">
        {store.seller_count}
      </td>

      <td className="px-4 py-2.5">
        <div className="flex items-center justify-end gap-1.5">
          <Link
            to={ROUTES.adminStore.replace(":id", store.id)}
            className="rounded-lg border border-neutral-200/80 bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
          >
            Ver
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="rounded-lg border border-transparent px-2.5 py-1 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50"
          >
            {isDeleting ? "..." : "Excluir"}
          </button>
        </div>
      </td>
    </tr>
  );
}
