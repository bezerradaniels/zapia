import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  SearchIcon,
  ArrowDown01Icon,
  User02Icon,
  Logout01Icon,
  Cancel01Icon,
  PackageIcon,
  UserGroupIcon,
  InvoiceIcon,
  Globe02Icon,
} from "@hugeicons/core-free-icons";
import { useSignOut } from "@/features/auth";
import { useActiveStore, buildStoreUrl } from "@/lib/tenant";
import { NotificationsBell } from "@/features/notifications";
import { ROUTES } from "@/config/routes";
import { useProducts } from "@/features/products";
import { useCustomers } from "@/features/customers";
import { useOrders } from "@/features/orders";
import { usePlanLimits } from "@/features/billing";
import { formatMoney } from "@/lib/format";

function initialsFrom(name?: string | null): string {
  if (!name) return "Z";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Topbar() {
  const navigate = useNavigate();
  const { store } = useActiveStore();
  const signOut = useSignOut();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const products = useProducts(store?.id);
  const customers = useCustomers(store?.id);
  const orders = useOrders(store?.id);
  const limits = usePlanLimits(store?.id);

  const storeInitials = initialsFrom(store?.name);
  const query = search.trim().toLowerCase();
  const isTrialing = limits.subscription?.status === "trialing";
  const planLabel = isTrialing
    ? `Trial · ${limits.plan?.name ?? "Pro"}`
    : limits.plan?.name
      ? `Plano ${limits.plan.name}`
      : "Sua loja";

  const searchResults = useMemo(() => {
    if (!query) return [];

    const productResults = (products.data ?? [])
      .filter((product) =>
        [product.name, product.sku, product.category, product.brand]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query)),
      )
      .slice(0, 4)
      .map((product) => ({
        id: `product-${product.id}`,
        icon: PackageIcon,
        title: product.name,
        description: [
          product.category,
          formatMoney(product.promo_price_in_cents ?? product.price_in_cents),
        ]
          .filter(Boolean)
          .join(" · "),
        href: `${ROUTES.dashboardProducts}/${product.id}`,
      }));

    const customerResults = (customers.data ?? [])
      .filter((customer) =>
        [
          customer.name,
          customer.email,
          customer.whatsapp_phone,
          customer.secondary_phone,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query)),
      )
      .slice(0, 4)
      .map((customer) => ({
        id: `customer-${customer.id}`,
        icon: UserGroupIcon,
        title: customer.name,
        description: customer.email ?? customer.whatsapp_phone,
        href: `${ROUTES.dashboardCustomers}/${customer.id}`,
      }));

    const orderResults = (orders.data ?? [])
      .filter((order) =>
        [order.customer_name, order.customer_phone, order.id]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query)),
      )
      .slice(0, 4)
      .map((order) => ({
        id: `order-${order.id}`,
        icon: InvoiceIcon,
        title: `Pedido de ${order.customer_name}`,
        description: formatMoney(order.total_in_cents),
        href: `${ROUTES.dashboardOrders}?order=${order.id}`,
      }));

    return [...productResults, ...customerResults, ...orderResults].slice(0, 8);
  }, [customers.data, orders.data, products.data, query]);

  useEffect(() => {
    if (!isSearchOpen) return;
    const timeout = window.setTimeout(() => inputRef.current?.focus(), 0);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsSearchOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isSearchOpen]);

  const handleSignOut = async () => {
    await signOut.mutateAsync();
    window.location.href = ROUTES.home;
  };

  return (
    <>
      <header className="sticky top-0 z-20 flex h-[52px] items-center justify-between gap-4 border-b border-neutral-200/80 bg-white/95 px-4 backdrop-blur-md lg:px-6">
        {/* Store identity — avatar + name + plan (opens user menu) */}
        <div className="relative flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            aria-label="Menu da conta"
            className="flex items-center gap-3 rounded-lg px-2.5 py-1.5 text-left transition-colors hover:bg-neutral-100/60"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-900 text-[12px] font-semibold text-white">
              {storeInitials}
            </span>
            <span className="flex min-w-0 flex-col gap-1">
              <span className="truncate text-[13px] font-semibold text-[rgb(24,24,26)] leading-tight">
                {store?.name ?? "Sua loja"}
              </span>
              <span className="w-fit truncate rounded-md border border-violet-200/70 bg-violet-50/90 px-1.5 py-0.5 text-[9.5px] font-medium text-violet-800 leading-none">
                {planLabel}
              </span>
            </span>
            <HugeiconsIcon
              icon={ArrowDown01Icon}
              size={13}
              className="hidden text-neutral-400 lg:block"
            />
          </button>

          {/* User dropdown menu */}
          {isUserMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsUserMenuOpen(false)}
              />
              <div className="absolute left-0 top-full z-20 mt-1.5 w-52 rounded-xl border border-neutral-200/80 bg-white p-1">
                {store?.slug && (
                  <a
                    href={buildStoreUrl(store.slug)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-[12.5px] font-normal text-[rgb(24,24,26)] hover:bg-neutral-100/70"
                  >
                    <HugeiconsIcon icon={Globe02Icon} size={15} className="text-neutral-500" />
                    Acessar loja
                  </a>
                )}
                <Link
                  to={ROUTES.dashboardProfile}
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-[12.5px] font-normal text-[rgb(24,24,26)] hover:bg-neutral-100/70"
                >
                  <HugeiconsIcon icon={User02Icon} size={15} className="text-neutral-500" />
                  Meu perfil
                </Link>
                <button
                  onClick={handleSignOut}
                  disabled={signOut.isPending}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[12.5px] font-normal text-[rgb(24,24,26)] hover:bg-neutral-100/70 disabled:opacity-50"
                >
                  <HugeiconsIcon icon={Logout01Icon} size={15} className="text-red-500" />
                  {signOut.isPending ? "Saindo..." : "Sair"}
                </button>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Buscar"
            onClick={() => setIsSearchOpen(true)}
            className="flex h-8 items-center gap-2 rounded-lg border border-neutral-200/80 bg-neutral-50 px-2.5 text-[12px] text-neutral-400 transition-colors hover:border-violet-300 hover:bg-violet-50/40 hover:text-violet-700"
          >
            <HugeiconsIcon icon={SearchIcon} size={15} className="text-violet-500" />
            <span className="hidden sm:inline text-neutral-400 font-normal">Buscar...</span>
          </button>

          <NotificationsBell storeId={store?.id} />
        </div>
      </header>
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-z-ink/20 px-4 py-20 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            onClick={() => setIsSearchOpen(false)}
          />
          <div className="relative mx-auto w-full max-w-xl rounded-xl border border-z-border bg-white">
            <div className="flex items-center gap-3 border-b border-z-border px-4 py-3">
              <HugeiconsIcon
                icon={SearchIcon}
                size={18}
                className="text-z-text-hint"
              />
              <input
                ref={inputRef}
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && searchResults[0]) {
                    navigate(searchResults[0].href);
                    setIsSearchOpen(false);
                  }
                }}
                placeholder="Buscar produtos, clientes ou pedidos"
                className="h-10 min-w-0 flex-1 bg-transparent text-sm text-z-text outline-none placeholder:text-z-text-hint"
              />
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                aria-label="Fechar busca"
                className="flex h-8 w-8 items-center justify-center rounded-full text-z-text-muted hover:bg-z-bg2"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={16} />
              </button>
            </div>

            <div className="max-h-[420px] overflow-y-auto p-2">
              {!query ? (
                <div className="px-3 py-8 text-center text-sm text-z-text-muted">
                  Digite para pesquisar no dashboard.
                </div>
              ) : searchResults.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {searchResults.map((result) => (
                    <SearchResultLink
                      key={result.id}
                      result={result}
                      onClick={() => setIsSearchOpen(false)}
                    />
                  ))}
                </div>
              ) : (
                <div className="px-3 py-8 text-center text-sm text-z-text-muted">
                  Nenhum resultado encontrado.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

type SearchResult = {
  id: string;
  icon: IconSvgElement;
  title: string;
  description: string;
  href: string;
};

function SearchResultLink({
  result,
  onClick,
}: {
  result: SearchResult;
  onClick: () => void;
}) {
  return (
    <Link
      to={result.href}
      onClick={onClick}
      className="flex items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-violet-50/50"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
        <HugeiconsIcon icon={result.icon} size={20} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-z-text">
          {result.title}
        </span>
        <span className="mt-0.5 block truncate text-xs text-z-text-muted">
          {result.description}
        </span>
      </span>
    </Link>
  );
}
