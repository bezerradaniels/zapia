import { Suspense, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { useSession } from "@/features/auth";
import { useMyStores } from "@/features/catalog";
import { useActiveStore } from "@/lib/tenant";
import { useOrderNotifications } from "@/features/orders";
import { useNotificationRealtime } from "@/features/notifications";
import { ROUTES } from "@/config/routes";
import { isAdminEmail } from "@/config/admin";
import { isAdminDomain } from "@/lib/tenant/resolveStore";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { BottomBar } from "@/components/layout/BottomBar";

export default function DashboardLayout() {
  const { session, isLoading } = useSession();
  const myStores = useMyStores(!!session);
  const { store } = useActiveStore();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { pathname } = useLocation();
  const hideBottomBar = pathname.startsWith("/dashboard/produtos/");

  // Live toast for new orders + bell-icon badge realtime invalidation.
  useOrderNotifications(store?.id);
  useNotificationRealtime(store?.id);

  // 1. Initial auth check - only block the whole screen here
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm text-z-text-muted">
        Carregando...
      </div>
    );
  }

  // 2. Redirect if no session
  if (!session) {
    return <Navigate to={ROUTES.login} replace />;
  }

  // 2.1. Admins on admin domain (or with admin email and no store) should go to the platform admin panel
  if (isAdminDomain() || (isAdminEmail(session.user?.email) && myStores.data?.length === 0)) {
    return <Navigate to={ROUTES.admin} replace />;
  }

  // 3. Keep layout visible while myStores loads
  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto px-4 py-4 pb-24 lg:px-6 lg:py-6 lg:pb-6">
          {myStores.isLoading ? (
            <div className="flex h-64 items-center justify-center text-sm text-z-text-muted">
              Carregando dados da loja...
            </div>
          ) : myStores.isError ? (
            <div className="flex h-64 flex-col gap-4 items-center justify-center text-sm text-z-text-muted">
              <p>Ocorreu um erro ao carregar os dados. O banco de dados pode estar indisponível.</p>
              <button className="px-4 py-2 bg-z-ink text-white rounded" onClick={() => window.location.reload()}>Tentar novamente</button>
            </div>
          ) : myStores.data && (myStores.data.length === 0 || !myStores.data.some((s) => s.onboarding_completed)) ? (
            <Navigate to={ROUTES.onboarding} replace />
          ) : (
            <Suspense
              fallback={
                <div className="flex h-64 items-center justify-center text-sm text-z-text-muted">
                  Carregando...
                </div>
              }
            >
              <Outlet />
            </Suspense>
          )}
        </main>
      </div>
      {!hideBottomBar && <BottomBar />}
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          classNames: {
            toast:
              "rounded-2xl border border-z-border bg-white shadow-z-lg font-sans",
          },
        }}
      />
    </div>
  );
}
