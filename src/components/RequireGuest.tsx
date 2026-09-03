import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useSession } from "@/features/auth";
import { ROUTES } from "@/config/routes";
import { isAdminEmail } from "@/config/admin";
import { isAdminDomain } from "@/lib/tenant/resolveStore";

/** Redirects already-authenticated users away from guest-only pages (signup, login). */
export function RequireGuest({ children }: { children: ReactNode }) {
  const { session, isLoading } = useSession();

  if (isLoading) return null;
  if (session) {
    if (isAdminEmail(session.user?.email)) {
      return <Navigate to={ROUTES.admin} replace />;
    }
    // If on admin domain but not an admin, navigate to painel
    if (isAdminDomain()) {
      window.location.replace("https://painel.zapia.app/dashboard");
      return null;
    }
    return <Navigate to={ROUTES.dashboard} replace />;
  }

  return children;
}
