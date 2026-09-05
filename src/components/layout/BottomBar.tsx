import { NavLink } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  HomeIcon,
  PackageIcon,
  InvoiceIcon,
  Menu01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { ROUTES } from "@/config/routes";
import { cn } from "@/lib/utils";

export function BottomBar() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex h-14 items-stretch border-t border-neutral-200/80 bg-white/95 px-2 backdrop-blur-md lg:hidden pb-[env(safe-area-inset-bottom)]">
      <NavLink
        to={ROUTES.dashboard}
        end
        className={({ isActive }) =>
          cn(
            "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium leading-none transition-colors",
            isActive
              ? "text-[rgb(24,24,26)] font-semibold"
              : "text-neutral-400 hover:text-[rgb(24,24,26)]",
          )
        }
      >
        {({ isActive }) => (
          <>
            <HugeiconsIcon
              icon={HomeIcon}
              size={19}
              className={isActive ? "text-violet-500" : "text-neutral-400"}
            />
            Início
          </>
        )}
      </NavLink>

      <NavLink
        to={ROUTES.dashboardOrders}
        className={({ isActive }) =>
          cn(
            "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium leading-none transition-colors",
            isActive
              ? "text-[rgb(24,24,26)] font-semibold"
              : "text-neutral-400 hover:text-[rgb(24,24,26)]",
          )
        }
      >
        {({ isActive }) => (
          <>
            <HugeiconsIcon
              icon={InvoiceIcon}
              size={19}
              className={isActive ? "text-violet-500" : "text-neutral-400"}
            />
            Pedidos
          </>
        )}
      </NavLink>

      <NavLink
        to={ROUTES.dashboardProducts}
        className={({ isActive }) =>
          cn(
            "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium leading-none transition-colors",
            isActive
              ? "text-[rgb(24,24,26)] font-semibold"
              : "text-neutral-400 hover:text-[rgb(24,24,26)]",
          )
        }
      >
        {({ isActive }) => (
          <>
            <HugeiconsIcon
              icon={PackageIcon}
              size={19}
              className={isActive ? "text-violet-500" : "text-neutral-400"}
            />
            Produtos
          </>
        )}
      </NavLink>

      <NavLink
        to={ROUTES.dashboardCustomers}
        className={({ isActive }) =>
          cn(
            "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium leading-none transition-colors",
            isActive
              ? "text-[rgb(24,24,26)] font-semibold"
              : "text-neutral-400 hover:text-[rgb(24,24,26)]",
          )
        }
      >
        {({ isActive }) => (
          <>
            <HugeiconsIcon
              icon={UserGroupIcon}
              size={19}
              className={isActive ? "text-violet-500" : "text-neutral-400"}
            />
            Clientes
          </>
        )}
      </NavLink>

      <NavLink
        to={ROUTES.dashboardMore}
        aria-label="Mais opções"
        className={({ isActive }) =>
          cn(
            "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium leading-none transition-colors",
            isActive
              ? "text-[rgb(24,24,26)] font-semibold"
              : "text-neutral-400 hover:text-[rgb(24,24,26)]",
          )
        }
      >
        {({ isActive }) => (
          <>
            <HugeiconsIcon
              icon={Menu01Icon}
              size={19}
              className={isActive ? "text-violet-500" : "text-neutral-400"}
            />
            Mais
          </>
        )}
      </NavLink>
    </nav>
  );
}
