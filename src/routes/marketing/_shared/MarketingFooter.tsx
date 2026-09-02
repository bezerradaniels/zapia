import { Link } from "react-router-dom";
import { Logo } from "@/components/ui";
import { HugeiconsIcon } from "@hugeicons/react";
import { HeartCheckIcon } from "@hugeicons/core-free-icons";
import { ROUTES } from "@/config/routes";

export function MarketingFooter() {
  return (
    <footer className="border-t border-slate-200 bg-[#f8fafc] px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          {/* Col 1: Brand */}
          <div className="col-span-2 lg:col-span-2">
            <Logo variant="verde" height={42} />
            <p className="mt-3 max-w-sm text-xs leading-relaxed text-slate-500">
              A plataforma definitiva para criar catálogos digitais interativos,
              receber pedidos organizados no WhatsApp e escalar vendas com múltiplos vendedores.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <span>© 2026 Zapia · Feito com</span>
              <HugeiconsIcon
                icon={HeartCheckIcon}
                size={14}
                className="text-emerald-600"
              />
              <span>no Brasil</span>
            </div>
          </div>

          {/* Col 2: Produto */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-900">
              Produto
            </p>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <Link
                  to={ROUTES.home}
                  className="text-slate-600 transition-colors hover:text-slate-950"
                >
                  Catálogo Digital
                </Link>
              </li>
              <li>
                <Link
                  to={ROUTES.pricing}
                  className="text-slate-600 transition-colors hover:text-slate-950"
                >
                  Planos e Preços
                </Link>
              </li>
              <li>
                <Link
                  to={ROUTES.trialSignup}
                  className="text-slate-600 transition-colors hover:text-slate-950"
                >
                  Criar Loja Grátis
                </Link>
              </li>
              <li>
                <Link
                  to={ROUTES.login}
                  className="text-slate-600 transition-colors hover:text-slate-950"
                >
                  Acessar Painel
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Funcionalidades */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-900">
              Recursos
            </p>
            <ul className="mt-3 space-y-2 text-xs text-slate-600">
              <li>Pedidos no WhatsApp</li>
              <li>Múltiplos Vendedores</li>
              <li>Catálogo em PDF</li>
              <li>QR Code para Balcão</li>
              <li>Checkout Integrado</li>
            </ul>
          </div>

          {/* Col 4: Institucional & Legal */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-900">
              Legal & Contato
            </p>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <Link
                  to={ROUTES.terms}
                  className="text-slate-600 transition-colors hover:text-slate-950"
                >
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link
                  to={ROUTES.privacy}
                  className="text-slate-600 transition-colors hover:text-slate-950"
                >
                  Privacidade
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  className="bg-transparent text-slate-600 transition-colors hover:text-slate-950"
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent("zapia:cookie-consent-open"),
                    )
                  }
                >
                  Gerenciar Cookies
                </button>
              </li>
              <li>
                <a
                  href="mailto:contato@zapia.app"
                  className="text-slate-600 transition-colors hover:text-slate-950"
                >
                  contato@zapia.app
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
