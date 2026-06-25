import { NavLink } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  HomeIcon,
  PackageIcon,
  InvoiceIcon,
  Menu01Icon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons'
import { ROUTES } from '@/config/routes'
import { cn } from '@/lib/utils'

export function BottomBar() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex h-[76px] items-stretch border-t border-z-border bg-white/95 px-2 backdrop-blur lg:hidden">
      <NavLink
        to={ROUTES.dashboard}
        end
        className={({ isActive }) =>
          cn(
            'flex min-w-0 flex-1 flex-col items-center justify-center gap-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-2 text-[11px] font-extrabold leading-none transition-colors',
            isActive ? 'text-[#10b981]' : 'text-z-text-hint',
          )
        }
      >
        <HugeiconsIcon icon={HomeIcon} size={24} />
        Início
      </NavLink>

      <NavLink
        to={ROUTES.dashboardOrders}
        className={({ isActive }) =>
          cn(
            'flex min-w-0 flex-1 flex-col items-center justify-center gap-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-2 text-[11px] font-extrabold leading-none transition-colors',
            isActive ? 'text-[#10b981]' : 'text-z-text-hint',
          )
        }
      >
        <HugeiconsIcon icon={InvoiceIcon} size={24} />
        Pedidos
      </NavLink>

      <NavLink
        to={ROUTES.dashboardProducts}
        className={({ isActive }) =>
          cn(
            'flex min-w-0 flex-1 flex-col items-center justify-center gap-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-2 text-[11px] font-extrabold leading-none transition-colors',
            isActive ? 'text-[#10b981]' : 'text-z-text-hint',
          )
        }
      >
        <HugeiconsIcon icon={PackageIcon} size={24} />
        Produtos
      </NavLink>

      <NavLink
        to={ROUTES.dashboardCustomers}
        className={({ isActive }) =>
          cn(
            'flex min-w-0 flex-1 flex-col items-center justify-center gap-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-2 text-[11px] font-extrabold leading-none transition-colors',
            isActive ? 'text-[#10b981]' : 'text-z-text-hint',
          )
        }
      >
        <HugeiconsIcon icon={UserGroupIcon} size={24} />
        Clientes
      </NavLink>

      <NavLink
        to={ROUTES.dashboardMore}
        aria-label="Mais opções"
        className={({ isActive }) =>
          cn(
            'flex min-w-0 flex-1 flex-col items-center justify-center gap-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-2 text-[11px] font-extrabold leading-none transition-colors',
            isActive ? 'text-[#10b981]' : 'text-z-text-hint',
          )
        }
      >
        <HugeiconsIcon icon={Menu01Icon} size={24} />
        Mais
      </NavLink>
    </nav>
  )
}
