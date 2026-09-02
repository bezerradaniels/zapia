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
    return <Navigate to={ROUTES.dashboard} replace />;
  }

  async function handleSignOut() {
    await createBrowserClient().auth.signOut();
    navigate(ROUTES.login);
  }

  return (
    <div className="flex min-h-screen bg-[#f8f9fa] font-sans text-[#202124] antialiased">
      {/* Sidebar */}
      <aside className="flex w-60 shrink-0 flex-col border-r border-[#dadce0] bg-white px-3 py-4 select-none">
        {/* Logo / Brand Header */}
        <Link
          to={ROUTES.admin}
          className="mb-6 flex items-center gap-2.5 px-3 py-1 text-inherit transition-opacity hover:opacity-90"
        >
          {/* GA4-style Logo Mark */}
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1a73e8] text-white shadow-sm">
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M5 9.2h3V19H5zM10.5 5h3v14h-3zM16 13h3v6h-3z" />
            </svg>
          </div>
          <div className="leading-none">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold tracking-tight text-[#202124]">
                Zapia
              </span>
              <span className="rounded bg-[#e8f0fe] px-1.5 py-0.5 text-[10px] font-medium text-[#1a73e8]">
                Admin
              </span>
            </div>
            <p className="mt-1 text-[11px] text-[#5f6368]">Analytics & Gestão</p>
          </div>
        </Link>

        {/* Navigation Items */}
        <nav className="flex flex-1 flex-col gap-1">
          <NavLink
            to={ROUTES.admin}
            end
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-full px-3.5 py-2 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-[#e8f0fe] text-[#1a73e8] font-semibold"
                  : "text-[#3c4043] hover:bg-[#f1f3f4] hover:text-[#202124]"
              }`
            }
          >
            {/* Home/Overview Icon */}
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>Visão Geral</span>
          </NavLink>

          <NavLink
            to={ROUTES.adminStores}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-full px-3.5 py-2 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-[#e8f0fe] text-[#1a73e8] font-semibold"
                  : "text-[#3c4043] hover:bg-[#f1f3f4] hover:text-[#202124]"
              }`
            }
          >
            {/* Stores/Reports Icon */}
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span>Lojas</span>
          </NavLink>
        </nav>

        {/* Footer / User & Logout */}
        <div className="mt-auto border-t border-[#dadce0] pt-3">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-2.5 rounded-full px-3.5 py-2 text-left text-xs font-medium text-[#5f6368] transition-colors hover:bg-[#f1f3f4] hover:text-[#202124]"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* GA4-style Top Navigation Bar */}
        <header className="flex h-14 items-center justify-between border-b border-[#dadce0] bg-white px-6">
          {/* Breadcrumb / Property Selector */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-lg border border-[#dadce0] bg-[#f8f9fa] px-3 py-1.5 text-xs font-medium text-[#3c4043] shadow-[0_1px_2px_0_rgba(60,64,67,0.04)]">
              <span className="text-[#5f6368]">Todas as contas</span>
              <span className="text-[#80868b]">›</span>
              <span className="font-semibold text-[#202124]">Zapia Platform</span>
              <svg className="h-3.5 w-3.5 text-[#5f6368]" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          {/* User Profile Info */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-[#dadce0] bg-[#f8f9fa] py-1 pl-2 pr-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1a73e8] text-[11px] font-semibold text-white">
                {(session.user.email?.[0] || "A").toUpperCase()}
              </div>
              <span className="text-xs text-[#3c4043]">
                {session.user.email || PRIMARY_ADMIN_EMAIL}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-[#f8f9fa] p-6 lg:p-8">
          <Suspense
            fallback={
              <div className="flex h-48 items-center justify-center text-sm text-[#5f6368]">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#1a73e8] border-t-transparent" />
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
