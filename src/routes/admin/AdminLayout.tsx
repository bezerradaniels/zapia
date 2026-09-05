import { Suspense } from "react";
import { Link, NavLink, Navigate, Outlet, useNavigate } from "react-router-dom";
import { Toaster } from "sonner";
import { useSession } from "@/features/auth";
import { createBrowserClient } from "@/lib/supabase";
import { ROUTES } from "@/config/routes";
import { isAdminEmail, PRIMARY_ADMIN_EMAIL } from "@/config/admin";

export default function AdminLayout() {
  const { session, isLoading } = useSession();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f9fa] text-sm text-[#5f6368]">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#1a73e8] border-t-transparent" />
          <span>Carregando...</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to={ROUTES.login} replace />;
  }

  if (!isAdminEmail(session.user.email)) {
    window.location.replace("https://painel.zapia.app/dashboard");
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8f9fa] text-center p-6">
        <h1 className="text-xl font-bold text-[#202124]">Acesso Exclusivo para Administradores</h1>
        <p className="mt-2 text-sm text-[#5f6368]">Redirecionando para o painel da sua loja...</p>
      </div>
    );
  }

  async function handleSignOut() {
    await createBrowserClient().auth.signOut();
    navigate(ROUTES.login);
  }

  return (
    <div className="flex min-h-screen bg-[#fafafa] font-sans text-neutral-900 antialiased">
      {/* Sidebar */}
      <aside className="flex w-60 shrink-0 flex-col border-r border-neutral-200/80 bg-[#fbfbfb] px-3 py-4 select-none">
        {/* Logo / Brand Header */}
        <Link
          to={ROUTES.admin}
          className="mb-6 flex items-center gap-2.5 px-3 py-1 text-inherit transition-opacity hover:opacity-90"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-900 text-white shadow-sm">
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-semibold tracking-tight text-[rgb(24,24,26)]">
                Zapia
              </span>
              <span className="rounded bg-violet-50 border border-violet-200/70 px-1.5 py-0.5 text-[9.5px] font-medium text-violet-800">
                Admin
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">Super Admin</p>
          </div>
        </Link>

        {/* Navigation Items */}
        <nav className="flex flex-1 flex-col gap-1">
          <NavLink
            to={ROUTES.admin}
            end
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] transition-all ${
                isActive
                  ? "bg-violet-50/90 border border-violet-200/70 text-[rgb(24,24,26)] font-medium"
                  : "border border-transparent text-[rgb(24,24,26)] font-medium hover:bg-neutral-100/60"
              }`
            }
          >
            {() => (
              <>
                <svg className="h-4 w-4 text-[rgb(24,24,26)] transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>Visão Geral</span>
              </>
            )}
          </NavLink>

          <NavLink
            to={ROUTES.adminStores}
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] transition-all ${
                isActive
                  ? "bg-violet-50/90 border border-violet-200/70 text-[rgb(24,24,26)] font-medium"
                  : "border border-transparent text-[rgb(24,24,26)] font-medium hover:bg-neutral-100/60"
              }`
            }
          >
            {() => (
              <>
                <svg className="h-4 w-4 text-[rgb(24,24,26)] transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span>Lojas</span>
              </>
            )}
          </NavLink>
        </nav>

        {/* Footer / User & Logout */}
        <div className="mt-auto border-t border-neutral-200/80 pt-3">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[12.5px] font-normal text-[rgb(24,24,26)]/80 transition-colors hover:bg-neutral-100/60 hover:text-[rgb(24,24,26)]"
          >
            <svg className="h-4 w-4 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Sair da conta</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Navigation Bar */}
        <header className="flex h-[52px] items-center justify-between border-b border-neutral-200/80 bg-white/95 px-6 backdrop-blur-md">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-[12px] text-neutral-500 font-normal">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
              <span className="font-semibold text-[rgb(24,24,26)]">Zapia Platform</span>
              <span className="text-neutral-300">/</span>
              <span>Painel Executivo</span>
            </div>
          </div>

          {/* User Profile Info */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-neutral-200/80 bg-neutral-50 py-1 pl-1.5 pr-3">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900 text-[10px] font-semibold text-white">
                {(session.user.email?.[0] || "A").toUpperCase()}
              </div>
              <span className="text-[11.5px] text-neutral-700 font-medium">
                {session.user.email || PRIMARY_ADMIN_EMAIL}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-[#fafafa] p-6 lg:p-8">
          <Suspense
            fallback={
              <div className="flex h-48 items-center justify-center text-xs text-neutral-400">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-900 border-t-transparent" />
                  <span>Carregando dados...</span>
                </div>
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>

      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}
