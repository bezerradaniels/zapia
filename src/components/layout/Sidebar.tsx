import { useState } from "react";
import { NavLink } from "react-router-dom";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  HomeIcon,
  InvoiceIcon,
  PackageIcon,
  UserGroupIcon,
  UserMultipleIcon,
  StoreLocationIcon,
  DiscountTagIcon,
  CreditCardIcon,
  HeadphonesIcon,
  LogoutIcon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Cancel01Icon,
  FolderOpenIcon,
  Globe02Icon,
} from "@hugeicons/core-free-icons";
import { ROUTES } from "@/config/routes";
import { useSignOut } from "@/features/auth";
import { useActiveStore, buildStoreUrl } from "@/lib/tenant";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: IconSvgElement;
  end?: boolean;
}

interface NavGroup {
  id: "catalog" | "products" | "people" | "admin";
  label: string;
  items: NavItem[];
}

const HOME_ITEM: NavItem = {
  to: ROUTES.dashboard,
  label: "Início",
  icon: HomeIcon,
  end: true,
};

const NAV_GROUPS: NavGroup[] = [
  {
    id: "catalog",
    label: "Catálogo",
    items: [
      {
        to: ROUTES.dashboardCatalog,
        label: "Personalizar",
        icon: StoreLocationIcon,
      },
    ],
  },
  {
    id: "products",
    label: "Produtos",
    items: [
      { to: ROUTES.dashboardOrders, label: "Pedidos", icon: InvoiceIcon },
      { to: ROUTES.dashboardProducts, label: "Produtos", icon: PackageIcon },
      { to: ROUTES.dashboardCoupons, label: "Cupons", icon: DiscountTagIcon },
    ],
  },
  {
    id: "people",
    label: "Pessoas",
    items: [
      { to: ROUTES.dashboardCustomers, label: "Clientes", icon: UserGroupIcon },
      {
        to: ROUTES.dashboardSellers,
        label: "Vendedores",
        icon: UserMultipleIcon,
      },
    ],
  },
  {
    id: "admin",
    label: "Adm",
    items: [
      {
        to: ROUTES.dashboardCategories,
        label: "Categorias",
        icon: FolderOpenIcon,
      },
      {
        to: ROUTES.dashboardBilling,
        label: "Assinatura",
        icon: CreditCardIcon,
      },
      { to: ROUTES.dashboardSupport, label: "Suporte", icon: HeadphonesIcon },
    ],
  },
];

interface SidebarProps {
  isMobileOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isMobileOpen = false, onClose }: SidebarProps) {
  const signOut = useSignOut();
  const { store } = useActiveStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<
    Record<NavGroup["id"], boolean>
  >({
    catalog: true,
    products: true,
    people: true,
    admin: true,
  });

  const toggleGroup = (groupId: NavGroup["id"]) => {
    setCollapsedGroups((current) => ({
      ...current,
      [groupId]: !current[groupId],
    }));
  };

  const renderNavItem = (item: NavItem) => (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.end}
      title={isCollapsed ? item.label : undefined}
      onClick={onClose}
      className={({ isActive }) =>
        cn(
          "group flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] transition-all",
          isActive
            ? "bg-violet-50/90 border border-violet-200/70 font-medium text-[rgb(24,24,26)]"
            : "border border-transparent font-medium text-[rgb(24,24,26)] hover:bg-neutral-100/60",
          isCollapsed && "lg:justify-center lg:px-0",
        )
      }
    >
      {() => (
        <>
          <HugeiconsIcon
            icon={item.icon}
            size={18}
            className="shrink-0 text-[rgb(24,24,26)] transition-colors"
          />
          <span className={cn("truncate text-[rgb(24,24,26)]", isCollapsed && "lg:hidden")}>
            {item.label}
          </span>
        </>
      )}
    </NavLink>
  );

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-neutral-900/20 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-screen shrink-0 flex-col overflow-visible border-r border-neutral-200/80 bg-[#fbfbfb] text-[rgb(24,24,26)] transition-all duration-300 ease-in-out",
          // Mobile: slide in/out
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop: sticky in layout, always visible
          "lg:sticky lg:top-0 lg:z-30 lg:translate-x-0",
          // Width: always 240px on mobile; collapsible on desktop
          isCollapsed ? "w-[240px] lg:w-[68px]" : "w-[240px]",
        )}
      >
        <div className="flex h-14 items-center justify-between px-4">
          {!isCollapsed && (
            <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap pl-1 font-semibold text-[rgb(24,24,26)]">
              <Logo height={42} className="w-[130px] max-w-[130px]" />
            </div>
          )}
          {isCollapsed && (
            <div className="mx-auto flex items-center justify-center">
              <Logo size="sm" dark />
            </div>
          )}

          {/* Close button on mobile */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar menu"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-[rgb(24,24,26)] lg:hidden"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={16} />
          </button>

          {/* Collapse toggle — desktop only */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? "Expandir menu" : "Recolher menu"}
            className={cn(
              "absolute -right-3 top-4 z-50 hidden h-6 w-6 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500 transition-transform hover:text-[rgb(24,24,26)] lg:flex",
            )}
          >
            <HugeiconsIcon
              icon={isCollapsed ? ArrowRight01Icon : ArrowLeft01Icon}
              size={13}
            />
          </button>
        </div>

        {store?.slug && (
          <div className="px-3 pt-2 pb-1">
            {!isCollapsed ? (
              <a
                href={buildStoreUrl(store.slug)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-xl border border-neutral-200/80 bg-white px-3 py-2 text-[12px] font-medium text-[rgb(24,24,26)] transition-all hover:border-emerald-300 hover:bg-emerald-50/40"
              >
                <span className="truncate">Acessar loja</span>
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={13}
                  className="shrink-0 text-[rgb(24,24,26)]"
                />
              </a>
            ) : (
              <a
                href={buildStoreUrl(store.slug)}
                target="_blank"
                rel="noopener noreferrer"
                title="Acessar loja"
                className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200/80 bg-white text-[rgb(24,24,26)] transition-all hover:border-emerald-300 hover:bg-emerald-50/40"
              >
                <HugeiconsIcon icon={Globe02Icon} size={16} className="text-emerald-600" />
              </a>
            )}
          </div>
        )}

        <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto px-3 py-3">
          {renderNavItem(HOME_ITEM)}

          {NAV_GROUPS.map((group) => {
            const groupIsCollapsed = collapsedGroups[group.id];
            return (
              <div key={group.id} className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className={cn(
                    "mt-2 flex items-center justify-between rounded-lg px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[rgb(24,24,26)] transition-colors hover:bg-neutral-100/60",
                    isCollapsed && "lg:hidden",
                  )}
                  aria-expanded={!groupIsCollapsed}
                >
                  <span>{group.label}</span>
                  <HugeiconsIcon
                    icon={groupIsCollapsed ? ArrowRight01Icon : ArrowLeft01Icon}
                    size={12}
                    className={cn(
                      "text-[rgb(24,24,26)] transition-transform",
                      !groupIsCollapsed && "-rotate-90",
                    )}
                  />
                </button>

                <div
                  className={cn(
                    "flex flex-col gap-0.5",
                    groupIsCollapsed && "hidden lg:flex",
                    groupIsCollapsed && !isCollapsed && "lg:hidden",
                  )}
                >
                  {group.items.map(renderNavItem)}
                </div>
              </div>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() => signOut.mutate()}
          title={isCollapsed ? "Sair" : undefined}
          className={cn(
            "mx-3 mb-4 flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-normal text-[rgb(24,24,26)]/80 transition-colors hover:bg-neutral-100/70 hover:text-[rgb(24,24,26)]",
            isCollapsed && "lg:justify-center lg:px-0",
          )}
        >
          <HugeiconsIcon
            icon={LogoutIcon}
            size={18}
            className="shrink-0 text-red-500"
          />
          <span className={cn(isCollapsed && "lg:hidden")}>Sair da conta</span>
        </button>
      </aside>
    </>
  );
}
