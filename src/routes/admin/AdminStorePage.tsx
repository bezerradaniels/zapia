import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  useAdminStore,
  StatCard,
  useGrantComplimentary,
} from "@/features/admin";
import { deleteAdminStore } from "@/features/admin/api/mutations";
import { deleteAllCustomers } from "@/features/customers";
import { ROUTES } from "@/config/routes";
import { buildStoreUrl } from "@/lib/tenant/resolveStore";

const PLAN_LABELS: Record<string, string> = {
  basico: "Básico",
  avancado: "Avançado",
  full: "Full",
  pro: "Avançado",
  premium: "Full",
  custom: "Custom",
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
  trialing: "Em trial",
  past_due: "Inadimplente",
  canceled: "Cancelado",
  inactive: "Inativo",
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  cancelled: "Cancelado",
  completed: "Concluído",
};

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

function formatBRL(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-[#5f6368]">{label}</p>
      <p className="mt-0.5 text-xs font-semibold text-[#202124]">{value || "—"}</p>
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[#dadce0] bg-white p-5 shadow-[0_1px_2px_0_rgba(60,64,67,0.06)]">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[#5f6368]">{title}</h3>
      {children}
    </div>
  );
}

export default function AdminStorePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error } = useAdminStore(id ?? "");
  const [isDeleting, setIsDeleting] = useState(false);

  // Gratuidade states
  const [grantType, setGrantType] = useState<"full" | "custom">("full");
  const [grantExpiry, setGrantExpiry] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split("T")[0];
  });
  const [grantNotes, setGrantNotes] = useState("");

  // Custom limits states
  const [customSellersEnabled, setCustomSellersEnabled] = useState(true);
  const [customSellers, setCustomSellers] = useState<number | "unlimited">(3);

  const [customProductsEnabled, setCustomProductsEnabled] = useState(true);
  const [customProducts, setCustomProducts] = useState<number | "unlimited">(50);

  const [customFeaturedEnabled, setCustomFeaturedEnabled] = useState(true);
  const [customFeatured, setCustomFeatured] = useState<4 | 8>(4);

  const [customCouponsEnabled, setCustomCouponsEnabled] = useState(true);
  const [customCoupons, setCustomCoupons] = useState<1 | 5 | "unlimited">(5);

  const [customPdfExport, setCustomPdfExport] = useState(true);

  const grantComplimentary = useGrantComplimentary();

  async function handleDeleteCustomers() {
    if (!id) return;
    if (
      !confirm(
        "Tem certeza que deseja excluir TODOS os clientes desta loja? Esta ação não pode ser desfeita.",
      )
    )
      return;
    try {
      setIsDeleting(true);
      await deleteAllCustomers(id);
      alert("Todos os clientes foram excluídos com sucesso.");
      window.location.reload();
    } catch (err) {
      alert("Erro ao excluir clientes: " + (err as Error).message);
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleDeleteStore() {
    if (!id) return;
    if (
      !confirm(
        "Tem certeza que deseja excluir esta loja? Esta ação NÃO pode ser desfeita e excluirá todos os dados da loja.",
      )
    )
      return;
    try {
      setIsDeleting(true);
      await deleteAdminStore(id);
      alert("Loja excluída com sucesso.");
      navigate(ROUTES.adminStores);
    } catch (err) {
      alert("Erro ao excluir loja: " + (err as Error).message);
    } finally {
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center text-xs text-[#5f6368]">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#1a73e8] border-t-transparent" />
          <span>Carregando dados da loja…</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-[#fce8e6] bg-[#fdf2f2] text-xs text-[#c5221f]">
        Erro ao carregar dados da loja.
      </div>
    );
  }

  const store = data.store as Record<string, string | null | undefined>;
  const owner = data.owner as Record<string, string | null | undefined> | null;
  const sub = data.subscription as Record<
    string,
    string | null | undefined
  > | null;
  const statusKey = (sub?.status ?? "inactive") as string;
  const orders = data.recent_orders as Record<string, unknown>[];

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        to={ROUTES.adminStores}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1a73e8] transition-colors hover:text-[#174ea6] hover:underline"
      >
        <span>←</span>
        <span>Voltar para todas as lojas</span>
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          {store.logo_url ? (
            <img
              src={store.logo_url}
              alt={store.name ?? ""}
              className="h-16 w-16 rounded-xl border border-[#dadce0] object-cover shadow-sm"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-[#dadce0] bg-[#f8f9fa] text-2xl font-bold text-[#5f6368] shadow-sm">
              {(store.name ?? "?")[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-[#202124] sm:text-2xl">
              {store.name}
            </h1>
            <a
              href={buildStoreUrl(store.slug ?? "")}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-medium text-[#1a73e8] hover:underline"
            >
              {buildStoreUrl(store.slug ?? "")} ↗
            </a>
            {store.slogan && (
              <p className="mt-1 text-xs italic text-[#5f6368]">
                "{store.slogan}"
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[statusKey] ?? STATUS_STYLES.inactive}`}
          >
            {STATUS_LABELS[statusKey] ?? statusKey}
          </span>
          <button
            type="button"
            onClick={handleDeleteCustomers}
            disabled={isDeleting}
            className="rounded-lg border border-[#dadce0] bg-white px-3 py-1.5 text-xs font-medium text-[#5f6368] transition-colors hover:bg-[#f1f3f4] disabled:opacity-50"
          >
            {isDeleting ? "..." : "Excluir clientes"}
          </button>
          <button
            type="button"
            onClick={handleDeleteStore}
            disabled={isDeleting}
            className="rounded-lg border border-transparent px-3 py-1.5 text-xs font-medium text-[#c5221f] transition-colors hover:bg-[#fce8e6] disabled:opacity-50"
          >
            {isDeleting ? "..." : "Excluir loja"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Produtos cadastrados" value={data.product_count} />
        <StatCard label="Vendedores" value={data.seller_count} />
        <StatCard label="Pedidos realizados" value={data.order_count} />
        <StatCard
          label="Receita total"
          value={formatBRL(data.total_revenue_cents)}
          badge="Faturamento"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Produtos ativos" value={data.active_product_count} />
        <StatCard label="Checkouts" value={data.checkout_count} />
        <StatCard label="Clientes" value={data.customer_count} />
      </div>

      {/* Detail cards */}
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {/* Store info */}
        <Card title="Dados da loja">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Categoria" value={store.category} />
            <Field label="Criada em" value={formatDate(store.created_at)} />
            <Field label="WhatsApp" value={store.whatsapp_phone} />
            <Field label="E-mail de contato" value={store.contact_email} />
            <Field
              label="Instagram"
              value={store.instagram ? `@${store.instagram}` : null}
            />
            <Field label="CNPJ" value={store.cnpj} />
          </div>
        </Card>

        {/* Address */}
        <Card title="Endereço">
          <div className="grid grid-cols-2 gap-3">
            <Field label="CEP" value={store.address_cep} />
            <Field label="UF" value={store.address_state} />
            <Field label="Cidade" value={store.address_city} />
            <Field label="Bairro" value={store.address_neighborhood} />
            <Field label="Rua" value={store.address_street} />
            <Field label="Número" value={store.address_number} />
          </div>
        </Card>

        {/* Owner */}
        <Card title="Lojista">
          <div className="grid grid-cols-1 gap-3">
            <Field label="Nome" value={owner?.name} />
            <Field label="E-mail" value={owner?.email} />
            <Field label="ID do usuário" value={store.owner_id} />
          </div>
        </Card>

        {/* Subscription */}
        <Card title="Assinatura">
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Plano"
              value={
                sub?.plan_id ? (PLAN_LABELS[sub.plan_id] ?? sub.plan_id) : "—"
              }
            />
            <Field
              label="Status"
              value={STATUS_LABELS[statusKey] ?? statusKey}
            />
            <Field
              label="Fim do trial"
              value={formatDate(sub?.trial_ends_at)}
            />
            <Field
              label="Fim do ciclo"
              value={formatDate(sub?.current_period_end)}
            />
            <Field label="Stripe customer" value={sub?.stripe_customer_id} />
            <Field
              label="Stripe subscription"
              value={sub?.stripe_subscription_id}
            />
          </div>
        </Card>

        {/* Catalog settings */}
        <Card title="Configurações do catálogo">
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Cor primária"
              value={
                store.primary_color ? (
                  <span className="flex items-center gap-1.5">
                    <span
                      className="inline-block h-3 w-3 rounded-full border border-[#dadce0]"
                      style={{ background: store.primary_color }}
                    />
                    {store.primary_color}
                  </span>
                ) : null
              }
            />
            <Field
              label="Carrinho"
              value={
                String(store.cart_enabled) === "true" ? "Ativado" : "Desativado"
              }
            />
            <Field label="Moeda" value={store.currency} />
            <Field label="GTM ID" value={store.gtm_id} />
          </div>
        </Card>
      </div>

      {/* Conceder gratuidade */}
      <Card title="Conceder gratuidade">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!id || !grantExpiry) return;

            if (grantType === "full") {
              grantComplimentary.mutate({
                storeId: id,
                planId: "full",
                expiresAt: grantExpiry,
                notes: grantNotes || undefined,
                customLimits: null,
              });
            } else {
              grantComplimentary.mutate({
                storeId: id,
                planId: "custom",
                expiresAt: grantExpiry,
                notes: grantNotes || undefined,
                customLimits: {
                  maxProducts: customProductsEnabled
                    ? customProducts === "unlimited"
                      ? null
                      : Number(customProducts)
                    : 10,
                  maxSellers: customSellersEnabled
                    ? customSellers === "unlimited"
                      ? null
                      : Number(customSellers)
                    : 0,
                  hasFeaturedProducts: customFeaturedEnabled,
                  maxFeaturedProducts: customFeaturedEnabled ? customFeatured : 0,
                  hasCoupons: customCouponsEnabled,
                  maxCoupons: customCouponsEnabled
                    ? customCoupons === "unlimited"
                      ? null
                      : Number(customCoupons)
                    : 0,
                  hasPdfExport: customPdfExport,
                },
              });
            }
          }}
          className="flex flex-col gap-4"
        >
          {/* Segmented control: Full vs Custom */}
          <div>
            <label className="mb-2 block text-xs font-semibold text-[#5f6368]">
              Tipo de gratuidade
            </label>
            <div className="inline-flex rounded-lg border border-[#dadce0] p-0.5 bg-[#f8f9fa]">
              <button
                type="button"
                onClick={() => setGrantType("full")}
                className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-all ${
                  grantType === "full"
                    ? "bg-white text-[#1a73e8] font-bold shadow-sm"
                    : "text-[#5f6368] hover:text-[#202124]"
                }`}
              >
                Full (Padrão)
              </button>
              <button
                type="button"
                onClick={() => setGrantType("custom")}
                className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-all ${
                  grantType === "custom"
                    ? "bg-white text-[#1a73e8] font-bold shadow-sm"
                    : "text-[#5f6368] hover:text-[#202124]"
                }`}
              >
                Personalizada (Custom)
              </button>
            </div>
            <p className="mt-1 text-[11px] text-[#80868b]">
              {grantType === "full"
                ? "Plano Full: todos os recursos e limites liberados sem restrição."
                : "Plano Custom: defina individualmente quais recursos e limites serão concedidos."}
            </p>
          </div>

          {/* Custom options if Personalizada */}
          {grantType === "custom" && (
            <div className="rounded-xl border border-[#dadce0] bg-[#f8f9fa] p-4 space-y-4">
              <p className="text-xs font-bold text-[#202124] uppercase tracking-wide">
                Limites e Recursos Personalizados
              </p>

              {/* 1. Vendedores */}
              <div className="flex flex-col gap-2 rounded-lg border border-[#e8eaed] bg-white p-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-semibold text-[#202124] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customSellersEnabled}
                      onChange={(e) => setCustomSellersEnabled(e.target.checked)}
                      className="h-4 w-4 rounded border-[#dadce0] text-[#1a73e8] focus:ring-[#1a73e8]"
                    />
                    <span>Vendedores</span>
                  </label>
                  <span className="text-[11px] text-[#5f6368]">
                    {customSellersEnabled ? "Ativado" : "Desativado (0)"}
                  </span>
                </div>
                {customSellersEnabled && (
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {([1, 3, 5, 10, "unlimited"] as const).map((opt) => (
                      <button
                        key={String(opt)}
                        type="button"
                        onClick={() => setCustomSellers(opt)}
                        className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
                          customSellers === opt
                            ? "border-[#1a73e8] bg-[#e8f0fe] font-bold text-[#1a73e8]"
                            : "border-[#dadce0] bg-white text-[#5f6368] hover:bg-[#f1f3f4]"
                        }`}
                      >
                        {opt === "unlimited" ? "Ilimitados" : `${opt} ${opt === 1 ? "vendedor" : "vendedores"}`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. Produtos */}
              <div className="flex flex-col gap-2 rounded-lg border border-[#e8eaed] bg-white p-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-semibold text-[#202124] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customProductsEnabled}
                      onChange={(e) => setCustomProductsEnabled(e.target.checked)}
                      className="h-4 w-4 rounded border-[#dadce0] text-[#1a73e8] focus:ring-[#1a73e8]"
                    />
                    <span>Produtos</span>
                  </label>
                  <span className="text-[11px] text-[#5f6368]">
                    {customProductsEnabled ? "Ativado" : "Padrão (10)"}
                  </span>
                </div>
                {customProductsEnabled && (
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {([10, 20, 30, 50, 100, "unlimited"] as const).map((opt) => (
                      <button
                        key={String(opt)}
                        type="button"
                        onClick={() => setCustomProducts(opt)}
                        className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
                          customProducts === opt
                            ? "border-[#1a73e8] bg-[#e8f0fe] font-bold text-[#1a73e8]"
                            : "border-[#dadce0] bg-white text-[#5f6368] hover:bg-[#f1f3f4]"
                        }`}
                      >
                        {opt === "unlimited" ? "Ilimitados" : `${opt} produtos`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. Destaques */}
              <div className="flex flex-col gap-2 rounded-lg border border-[#e8eaed] bg-white p-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-semibold text-[#202124] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customFeaturedEnabled}
                      onChange={(e) => setCustomFeaturedEnabled(e.target.checked)}
                      className="h-4 w-4 rounded border-[#dadce0] text-[#1a73e8] focus:ring-[#1a73e8]"
                    />
                    <span>Destaques</span>
                  </label>
                  <span className="text-[11px] text-[#5f6368]">
                    {customFeaturedEnabled ? "Ativado" : "Desativado (0)"}
                  </span>
                </div>
                {customFeaturedEnabled && (
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {([4, 8] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setCustomFeatured(opt)}
                        className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
                          customFeatured === opt
                            ? "border-[#1a73e8] bg-[#e8f0fe] font-bold text-[#1a73e8]"
                            : "border-[#dadce0] bg-white text-[#5f6368] hover:bg-[#f1f3f4]"
                        }`}
                      >
                        {`${opt} destaques`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. Cupons */}
              <div className="flex flex-col gap-2 rounded-lg border border-[#e8eaed] bg-white p-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-semibold text-[#202124] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customCouponsEnabled}
                      onChange={(e) => setCustomCouponsEnabled(e.target.checked)}
                      className="h-4 w-4 rounded border-[#dadce0] text-[#1a73e8] focus:ring-[#1a73e8]"
                    />
                    <span>Cupons</span>
                  </label>
                  <span className="text-[11px] text-[#5f6368]">
                    {customCouponsEnabled ? "Ativado" : "Desativado (0)"}
                  </span>
                </div>
                {customCouponsEnabled && (
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {([1, 5, "unlimited"] as const).map((opt) => (
                      <button
                        key={String(opt)}
                        type="button"
                        onClick={() => setCustomCoupons(opt)}
                        className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
                          customCoupons === opt
                            ? "border-[#1a73e8] bg-[#e8f0fe] font-bold text-[#1a73e8]"
                            : "border-[#dadce0] bg-white text-[#5f6368] hover:bg-[#f1f3f4]"
                        }`}
                      >
                        {opt === "unlimited" ? "Ilimitados" : `${opt} ${opt === 1 ? "cupom" : "cupons"}`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 5. Exportação PDF */}
              <div className="flex items-center justify-between rounded-lg border border-[#e8eaed] bg-white p-3">
                <div>
                  <p className="text-xs font-semibold text-[#202124]">Exportação PDF</p>
                  <p className="text-[11px] text-[#5f6368]">Gerar catálogo diagramado em PDF</p>
                </div>
                <div className="inline-flex rounded-md border border-[#dadce0] bg-[#f8f9fa] p-0.5">
                  <button
                    type="button"
                    onClick={() => setCustomPdfExport(true)}
                    className={`rounded px-2.5 py-1 text-xs transition-colors ${
                      customPdfExport
                        ? "bg-[#1a73e8] font-semibold text-white shadow-sm"
                        : "text-[#5f6368] hover:text-[#202124]"
                    }`}
                  >
                    Sim
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomPdfExport(false)}
                    className={`rounded px-2.5 py-1 text-xs transition-colors ${
                      !customPdfExport
                        ? "bg-[#5f6368] font-semibold text-white shadow-sm"
                        : "text-[#5f6368] hover:text-[#202124]"
                    }`}
                  >
                    Não
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Válido até + Observações */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#5f6368]">
                Válido até *
              </label>
              <input
                type="date"
                value={grantExpiry}
                onChange={(e) => setGrantExpiry(e.target.value)}
                required
                className="h-9 w-full rounded-lg border border-[#dadce0] bg-white px-3 text-xs text-[#202124] focus:border-[#1a73e8] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#5f6368]">
                Observações (opcional)
              </label>
              <input
                type="text"
                value={grantNotes}
                onChange={(e) => setGrantNotes(e.target.value)}
                placeholder="Ex: parceria, cortesia, influencer..."
                className="h-9 w-full rounded-lg border border-[#dadce0] bg-white px-3 text-xs text-[#202124] placeholder-[#80868b] focus:border-[#1a73e8] focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={grantComplimentary.isPending || !grantExpiry}
            className="self-start rounded-lg bg-[#1a73e8] px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#174ea6] disabled:opacity-50"
          >
            {grantComplimentary.isPending
              ? "Concedendo..."
              : `Conceder gratuidade ${grantType === "full" ? "Full" : "Custom"}`}
          </button>
        </form>
      </Card>

      {/* Recent orders */}
      <Card title={`Últimos pedidos (${orders.length})`}>
        {orders.length === 0 ? (
          <p className="text-xs text-[#80868b]">Nenhum pedido ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-xs">
              <thead>
                <tr className="border-b border-[#dadce0] pb-2 text-left text-[11px] font-semibold uppercase tracking-wider text-[#5f6368]">
                  {["Cliente", "Telefone", "Total", "Status", "Data"].map(
                    (h) => (
                      <th key={h} className="pb-2 font-semibold">
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f3f4]">
                {orders.map((order) => (
                  <tr key={String(order.id)} className="hover:bg-[#f8f9fa]">
                    <td className="py-2.5 font-medium text-[#202124]">
                      {String(order.customer_name ?? "—")}
                    </td>
                    <td className="py-2.5 text-[#5f6368]">
                      {String(order.customer_phone ?? "—")}
                    </td>
                    <td className="py-2.5 font-semibold text-[#202124]">
                      {formatBRL(Number(order.total_in_cents ?? 0))}
                    </td>
                    <td className="py-2.5">
                      <span className="inline-block rounded-full bg-[#f1f3f4] px-2 py-0.5 text-[10px] font-medium text-[#5f6368]">
                        {ORDER_STATUS_LABELS[String(order.status)] ??
                          String(order.status)}
                      </span>
                    </td>
                    <td className="py-2.5 text-[#5f6368]">
                      {formatDate(String(order.created_at ?? ""))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
