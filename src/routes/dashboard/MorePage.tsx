import { Link } from "react-router-dom";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  CreditCardIcon,
  HeadphonesIcon,
  Logout01Icon,
  PaintBrush01Icon,
  Settings01Icon,
  UserSwitchIcon,
} from "@hugeicons/core-free-icons";
import { ROUTES } from "@/config/routes";
import { useSignOut } from "@/features/auth";
import { usePlanLimits } from "@/features/billing";
import { useMembers } from "@/features/sellers";
import { useActiveStore } from "@/lib/tenant";

type MoreItem = {
  label: string;
  description: string;
  icon: IconSvgElement;
  to: string;
};

export default function MorePage() {
  const { store } = useActiveStore();
  const planLimits = usePlanLimits(store?.id);
  const members = useMembers(store?.id);
  const signOut = useSignOut();

  const sellerCount = members.data?.length ?? 0;
  const sellerDescription =
    sellerCount === 1 ? "1 vendedor ativo" : `${sellerCount} vendedores ativos`;
  const isTrialing = planLimits.subscription?.status === "trialing";
  const planName = planLimits.plan?.name ?? "Gratuito";
  const planDescription = isTrialing
    ? `Plano ${planName} · trial`
    : `Plano ${planName}`;

  const items: MoreItem[] = [
    {
      label: "Personalizar catálogo",
      description: "Logo, cores, categorias, contatos",
      icon: PaintBrush01Icon,
      to: ROUTES.dashboardCatalog,
    },
    {
      label: "Vendedores",
      description: members.isLoading
        ? "Carregando vendedores"
        : sellerDescription,
      icon: UserSwitchIcon,
      to: ROUTES.dashboardSellers,
    },
    {
      label: "Assinatura",
      description: planDescription,
      icon: CreditCardIcon,
      to: ROUTES.dashboardBilling,
    },
    {
      label: "Suporte",
      description: "Fale com a equipe Zapable",
      icon: HeadphonesIcon,
      to: ROUTES.dashboardSupport,
    },
    {
      label: "Configurações",
      description: "Dados da loja e da conta",
      icon: Settings01Icon,
      to: ROUTES.dashboardProfile,
    },
  ];

  async function handleSignOut() {
    await signOut.mutateAsync();
    window.location.href = ROUTES.home;
  }

  return (
    <div className="mx-auto flex w-full max-w-[430px] flex-col px-1 pb-12 pt-1 sm:px-0 lg:max-w-none">
      <h1 className="mb-4 text-xl font-bold tracking-tight text-[rgb(24,24,26)]">
        Mais opções
      </h1>

      <section className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white divide-y divide-neutral-100">
        {items.map((item) => (
          <Link
            key={item.label}
            to={item.to}
            className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-neutral-50/80"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-100/90 text-neutral-700">
              <HugeiconsIcon icon={item.icon} size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold text-[rgb(24,24,26)]">
                {item.label}
              </span>
              <span className="block truncate text-[12px] font-normal text-neutral-400 mt-0.5">
                {item.description}
              </span>
            </span>
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              size={15}
              className="shrink-0 text-neutral-300"
            />
          </Link>
        ))}
      </section>

      <button
        type="button"
        onClick={handleSignOut}
        disabled={signOut.isPending}
        className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-neutral-200/80 bg-white text-[13px] font-semibold text-[rgb(24,24,26)] transition-colors hover:bg-neutral-50 hover:text-red-600 disabled:opacity-60"
      >
        <HugeiconsIcon icon={Logout01Icon} size={16} />
        {signOut.isPending ? "Saindo..." : "Sair da conta"}
      </button>

      <p className="mt-6 text-center text-[11px] text-neutral-400">
        Zapia · Plataforma de Catálogo
      </p>
    </div>
  );
}
