import { useState } from "react";
import { Link } from "react-router-dom";
import { useAdminStats, StatCard, MiniBarChart } from "@/features/admin";
import { ROUTES } from "@/config/routes";

function formatBRL(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-3">
      <h2 className="text-sm font-semibold tracking-tight text-[#202124]">
        {title}
      </h2>
      {subtitle && <p className="text-xs text-[#5f6368]">{subtitle}</p>}
    </div>
  );
}

function GaCard({
  title,
  subtitle,
  actionText,
  actionTo,
  badge,
  children,
}: {
  title: string;
  subtitle?: string;
  actionText?: string;
  actionTo?: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-[#dadce0] bg-white p-5 shadow-[0_1px_2px_0_rgba(60,64,67,0.06)] transition-all hover:border-[#bdc1c6] hover:shadow-[0_1px_3px_1px_rgba(60,64,67,0.1)]">
      <div>
        <div className="mb-4 flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-[#202124]">{title}</h3>
            {subtitle && (
              <p className="mt-0.5 text-xs text-[#5f6368]">{subtitle}</p>
            )}
          </div>
          {badge && (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#ceead6] bg-[#e6f4ea] px-2 py-0.5 text-[10px] font-medium text-[#137333]">
              <svg
                className="h-3 w-3 fill-current"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              {badge}
            </span>
          )}
        </div>
        {children}
      </div>

      {actionText && (
        <div className="mt-5 border-t border-[#f1f3f4] pt-3">
          {actionTo ? (
            <Link
              to={actionTo}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#1a73e8] transition-colors hover:text-[#174ea6] hover:underline"
            >
              <span>{actionText}</span>
              <span>→</span>
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-[#1a73e8]">
              <span>{actionText}</span>
              <span>→</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function RankTable({
  rows,
  labelKey,
  countKey,
  headerLabel = "ITEM",
  valueLabel = "TOTAL",
}: {
  rows: Record<string, unknown>[];
  labelKey: string;
  countKey: string;
  headerLabel?: string;
  valueLabel?: string;
}) {
  if (!rows.length) {
    return (
      <div className="py-6 text-center text-xs text-[#80868b]">
        Sem dados registrados
      </div>
    );
  }
  const max = Math.max(...rows.map((r) => Number(r[countKey])), 1);
  return (
    <div className="space-y-3">
      {/* Table Header GA4 Style */}
      <div className="flex items-center justify-between border-b border-[#dadce0] pb-1.5 text-[10px] font-semibold tracking-wider text-[#5f6368]">
        <span className="border-b border-dotted border-[#80868b]">
          {headerLabel}
        </span>
        <span className="border-b border-dotted border-[#80868b]">
          {valueLabel}
        </span>
      </div>

      <div className="space-y-2.5">
        {rows.map((row, i) => {
          const label = String(row[labelKey] ?? "—");
          const count = Number(row[countKey]);
          const pct = (count / max) * 100;
          return (
            <div key={i} className="group flex items-center justify-between gap-3 text-xs">
              <span className="w-28 shrink-0 truncate text-[#3c4043] font-medium" title={label}>
                {label}
              </span>
              <div className="flex-1 rounded-full bg-[#f1f3f4]">
                <div
                  className="h-1.5 rounded-full bg-[#1a73e8] transition-all duration-300"
                  style={{ width: `${Math.max(pct, 4)}%` }}
                />
              </div>
              <span className="w-8 text-right font-medium text-[#202124]">
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminHomePage() {
  const { data: stats, isLoading, error } = useAdminStats();
  const [activeMetricTab, setActiveMetricTab] = useState<"stores" | "revenue">(
    "stores",
  );

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-[#5f6368]">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#1a73e8] border-t-transparent" />
          <span>Carregando dados da plataforma...</span>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-[#fce8e6] bg-[#fdf2f2] p-6 text-center text-sm text-[#c5221f]">
        <p className="font-semibold">Erro ao carregar dados analíticos</p>
        <p className="mt-1 text-xs text-[#5f6368]">
          Verifique as permissões de administrador no Supabase.
        </p>
      </div>
    );
  }

  const totalSubscribed = stats.free_customers + stats.paying_customers;
  const storeGrowthData = (stats.stores_per_month ?? []).map((d) => ({
    label: d.month.slice(5),
    value: d.count,
  }));
  const revenueGrowthData = (stats.revenue_per_month ?? []).map((d) => ({
    label: d.month.slice(5),
    value: d.amount,
  }));

  return (
    <div className="space-y-6">
      {/* Top Title & Filters Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[#202124] sm:text-2xl">
            Página inicial
          </h1>
          <p className="mt-0.5 text-xs text-[#5f6368]">
            Dados consolidados de toda a plataforma Zapia
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full border border-[#dadce0] bg-white px-3 py-1 text-xs font-medium text-[#3c4043] shadow-[0_1px_2px_0_rgba(60,64,67,0.06)]">
            <span className="h-2 w-2 rounded-full bg-[#137333]" />
            <span>Todos os dados</span>
          </div>
          <div className="flex items-center gap-1 rounded-full border border-[#dadce0] bg-white px-3 py-1 text-xs font-medium text-[#3c4043] shadow-[0_1px_2px_0_rgba(60,64,67,0.06)]">
            <span>Últimos meses</span>
            <svg className="h-3.5 w-3.5 text-[#5f6368]" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>

      {/* Main KPI Row (Cards brancos com tipografia limpa GA4) */}
      <section>
        <SectionHeader title="Métricas principais" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <StatCard
            label="Usuários"
            value={stats.total_users}
            badge="Ativo"
          />
          <StatCard
            label="Lojas criadas"
            value={stats.total_stores}
            badge="Total"
          />
          <StatCard
            label="Produtos cadastrados"
            value={stats.total_products}
          />
          <StatCard
            label="Vendedores"
            value={stats.total_sellers}
          />
          <StatCard
            label="Clientes pagantes"
            value={stats.paying_customers}
            badge={stats.paying_customers > 0 ? "Receita ativa" : undefined}
          />
        </div>
      </section>

      {/* Hero Analytics Widget & Assinaturas Realtime */}
      <section className="grid gap-4 lg:grid-cols-3">
        {/* Left: Interactive GA4 Line/Area Hero Chart (2 cols) */}
        <div className="flex flex-col justify-between rounded-xl border border-[#dadce0] bg-white p-5 shadow-[0_1px_2px_0_rgba(60,64,67,0.06)] lg:col-span-2">
          <div>
            {/* Header Tabs GA4 style */}
            <div className="flex items-center gap-6 border-b border-[#dadce0] pb-3">
              <button
                type="button"
                onClick={() => setActiveMetricTab("stores")}
                className={`relative pb-1 text-left transition-colors ${
                  activeMetricTab === "stores"
                    ? "text-[#1a73e8]"
                    : "text-[#5f6368] hover:text-[#202124]"
                }`}
              >
                <p className="text-[11px] font-medium uppercase tracking-wide">
                  Novas lojas
                </p>
                <p className="mt-0.5 text-2xl font-semibold text-[#202124]">
                  {stats.total_stores}
                </p>
                {activeMetricTab === "stores" && (
                  <span className="absolute -bottom-3 left-0 right-0 h-0.5 bg-[#1a73e8]" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveMetricTab("revenue")}
                className={`relative pb-1 text-left transition-colors ${
                  activeMetricTab === "revenue"
                    ? "text-[#1a73e8]"
                    : "text-[#5f6368] hover:text-[#202124]"
                }`}
              >
                <p className="text-[11px] font-medium uppercase tracking-wide">
                  Receita mensal
                </p>
                <p className="mt-0.5 text-2xl font-semibold text-[#202124]">
                  {formatBRL(
                    revenueGrowthData.length > 0
                      ? revenueGrowthData[revenueGrowthData.length - 1].value
                      : 0,
                  )}
                </p>
                {activeMetricTab === "revenue" && (
                  <span className="absolute -bottom-3 left-0 right-0 h-0.5 bg-[#1a73e8]" />
                )}
              </button>
            </div>

            {/* Chart Area */}
            <div className="mt-6">
              {activeMetricTab === "stores" ? (
                <MiniBarChart
                  data={storeGrowthData}
                  height={180}
                  type="line"
                  color="#1a73e8"
                  emptyMessage="Nenhuma loja registrada no histórico mensal"
                />
              ) : (
                <MiniBarChart
                  data={revenueGrowthData}
                  height={180}
                  type="line"
                  color="#1a73e8"
                  formatValue={(v) => formatBRL(v)}
                  emptyMessage="Nenhuma receita registrada no histórico mensal"
                />
              )}
            </div>
          </div>

          <div className="mt-5 border-t border-[#f1f3f4] pt-3">
            <Link
              to={ROUTES.adminStores}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#1a73e8] transition-colors hover:text-[#174ea6] hover:underline"
            >
              <span>Ver resumo de lojas</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* Right: Subscriptions & Conversion Breakdown Card (1 col) */}
        <div className="flex flex-col justify-between rounded-xl border border-[#dadce0] bg-white p-5 shadow-[0_1px_2px_0_rgba(60,64,67,0.06)]">
          <div>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-[#5f6368]">
                  Assinaturas da plataforma
                </p>
                <p className="mt-1 text-3xl font-semibold text-[#202124]">
                  {totalSubscribed}
                </p>
                <p className="mt-0.5 text-xs text-[#5f6368]">
                  {stats.total_stores > 0
                    ? `${Math.round((totalSubscribed / stats.total_stores) * 100)}% das lojas ativas`
                    : "Nenhuma loja cadastrada"}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border border-[#ceead6] bg-[#e6f4ea] px-2 py-0.5 text-[10px] font-medium text-[#137333]">
                <svg className="h-3 w-3 fill-current" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Ativado
              </span>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-[#5f6368]">Gratuitos</span>
                  <span className="text-[#202124]">{stats.free_customers}</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full rounded-full bg-[#f1f3f4]">
                  <div
                    className="h-1.5 rounded-full bg-[#1a73e8]"
                    style={{
                      width: `${
                        totalSubscribed > 0
                          ? (stats.free_customers / totalSubscribed) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-[#5f6368]">Pagantes (ativos)</span>
                  <span className="text-[#202124]">{stats.paying_customers}</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full rounded-full bg-[#f1f3f4]">
                  <div
                    className="h-1.5 rounded-full bg-[#137333]"
                    style={{
                      width: `${
                        totalSubscribed > 0
                          ? (stats.paying_customers / totalSubscribed) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-[#f1f3f4] pt-3">
            <Link
              to={ROUTES.adminStores}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#1a73e8] transition-colors hover:text-[#174ea6] hover:underline"
            >
              <span>Ver detalhes de assinaturas</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Crescimento em Barras / Detalhe */}
      <section>
        <SectionHeader title="Crescimento detalhado" />
        <div className="grid gap-4 lg:grid-cols-2">
          <GaCard
            title="Novas lojas por mês"
            actionText="Ver resumo de lojas"
            actionTo={ROUTES.adminStores}
            badge="Ativado"
          >
            <MiniBarChart
              data={storeGrowthData}
              type="bar"
              color="#1a73e8"
              height={140}
            />
          </GaCard>

          <GaCard
            title="Receita de assinaturas por mês (R$)"
            actionText="Ver faturamento"
            actionTo={ROUTES.adminStores}
            badge="Ativado"
          >
            <MiniBarChart
              data={revenueGrowthData}
              type="bar"
              color="#1a73e8"
              height={140}
              formatValue={(v) => formatBRL(v)}
            />
          </GaCard>
        </div>
      </section>

      {/* Distribuição Geográfica e Setorial */}
      <section>
        <SectionHeader title="Distribuição demográfica e por setor" />
        <div className="grid gap-4 lg:grid-cols-3">
          <GaCard
            title="Top cidades"
            subtitle="Concentração de lojistas por município"
            badge="Ativado"
          >
            <RankTable
              rows={
                (stats.cities_with_stores ?? []) as Record<string, unknown>[]
              }
              labelKey="city"
              countKey="count"
              headerLabel="CIDADE"
              valueLabel="LOJAS"
            />
          </GaCard>

          <GaCard
            title="Estados (UF)"
            subtitle="Presença territorial por estado"
            badge="Ativado"
          >
            <RankTable
              rows={
                (stats.states_with_stores ?? []) as Record<string, unknown>[]
              }
              labelKey="state"
              countKey="count"
              headerLabel="ESTADO"
              valueLabel="LOJAS"
            />
          </GaCard>

          <GaCard
            title="Ramo de atuação"
            subtitle="Segmentos de produtos das lojas"
            badge="Ativado"
          >
            <RankTable
              rows={
                (stats.sectors_with_stores ?? []) as Record<string, unknown>[]
              }
              labelKey="sector"
              countKey="count"
              headerLabel="RAMO"
              valueLabel="LOJAS"
            />
          </GaCard>
        </div>
      </section>
    </div>
  );
}
