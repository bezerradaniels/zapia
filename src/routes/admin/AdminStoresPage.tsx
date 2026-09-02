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
  active: "bg-[#e6f4ea] text-[#137333] border border-[#ceead6]",
  trialing: "bg-[#fef7e0] text-[#b06000] border border-[#feefc3]",
  past_due: "bg-[#fce8e6] text-[#c5221f] border border-[#fad2cf]",
  canceled: "bg-[#f1f3f4] text-[#5f6368] border border-[#dadce0]",
  inactive: "bg-[#f1f3f4] text-[#5f6368] border border-[#dadce0]",
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
    <div className="space-y-6">
      {/* Top Header & Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[#202124] sm:text-2xl">
            Lojas cadastradas
          </h1>
          <p className="mt-0.5 text-xs text-[#5f6368]">
            {stores
              ? `${stores.length} loja${stores.length !== 1 ? "s" : ""} registrada${stores.length !== 1 ? "s" : ""} no sistema`
              : "Carregando contagem..."}
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <input
            type="search"
            placeholder="Buscar por nome, slug ou e-mail…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[#dadce0] bg-white px-3.5 py-2 text-xs text-[#202124] placeholder-[#80868b] shadow-[0_1px_2px_0_rgba(60,64,67,0.06)] transition-all focus:border-[#1a73e8] focus:outline-none focus:ring-1 focus:ring-[#1a73e8]"
          />
        </div>
      </div>

      {isLoading && (
        <div className="flex h-48 items-center justify-center text-xs text-[#5f6368]">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#1a73e8] border-t-transparent" />
            <span>Carregando lista de lojas…</span>
          </div>
        </div>
      )}

      {error && (
        <div className="flex h-48 items-center justify-center rounded-xl border border-[#fce8e6] bg-[#fdf2f2] text-xs text-[#c5221f]">
          Erro ao carregar lojas. Verifique as permissões.
        </div>
      )}

      {!isLoading && !error && (
        <div className="overflow-hidden rounded-xl border border-[#dadce0] bg-white shadow-[0_1px_2px_0_rgba(60,64,67,0.06)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-xs">
              <thead>
                <tr className="border-b border-[#dadce0] bg-[#f8f9fa]">
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
                      className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#5f6368]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f3f4] bg-white">
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-4 py-12 text-center text-xs text-[#80868b]"
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
    <tr className="transition-colors hover:bg-[#f8f9fa]">
      <td className="px-4 py-3">
        <div className="font-semibold text-[#202124]">{store.name}</div>
        <a
          href={`https://zapia.app/${store.slug}`}
          target="_blank"
          rel="noreferrer"
          className="text-[11px] font-medium text-[#1a73e8] hover:underline"
        >
          zapia.app/{store.slug} ↗
        </a>
      </td>

      <td className="px-4 py-3">
        <div className="font-medium text-[#202124]">
          {store.owner_name ?? "—"}
        </div>
        <div className="text-[11px] text-[#5f6368]">{store.owner_email}</div>
      </td>

      <td className="px-4 py-3 text-[#5f6368]">
        {formatDate(store.created_at)}
      </td>

      <td className="px-4 py-3 font-medium text-[#3c4043]">
        {store.plan_id ? (PLAN_LABELS[store.plan_id] ?? store.plan_id) : "—"}
      </td>

      <td className="px-4 py-3">
        <span
          className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-medium ${statusStyle}`}
        >
          {statusLabel}
        </span>
      </td>

      <td className="px-4 py-3 text-[#5f6368]">
        {days !== null ? (
          <span
            className={
              days === 0
                ? "font-semibold text-[#c5221f]"
                : days <= 3
                  ? "font-semibold text-[#b06000]"
                  : "text-[#3c4043]"
            }
          >
            {days}d
          </span>
        ) : (
          "—"
        )}
      </td>

      <td className="px-4 py-3 text-[#5f6368]">
        {formatDate(store.last_payment_at)}
      </td>

      <td className="px-4 py-3 font-medium text-[#202124]">
        {store.product_count}
      </td>

      <td className="px-4 py-3 font-medium text-[#202124]">
        {store.seller_count}
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1.5">
          <Link
            to={ROUTES.adminStore.replace(":id", store.id)}
            className="rounded-lg border border-[#dadce0] bg-white px-2.5 py-1 text-xs font-medium text-[#1a73e8] transition-colors hover:bg-[#e8f0fe] hover:border-[#1a73e8]"
          >
            Ver
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="rounded-lg border border-transparent px-2.5 py-1 text-xs font-medium text-[#c5221f] transition-colors hover:bg-[#fce8e6] disabled:opacity-50"
          >
            {isDeleting ? "..." : "Excluir"}
          </button>
        </div>
      </td>
    </tr>
  );
}
