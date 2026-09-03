import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export type SubdomainType = "site" | "admin" | "store";

function detectSubdomain(): SubdomainType {
  if (typeof window === "undefined") return "site";
  const { hostname, pathname } = window.location;

  if (hostname.startsWith("admin.")) return "admin";
  if (hostname.startsWith("site.")) return "site";

  // Route-based detection when running on root domain or localhost
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/nova-loja") ||
    pathname.startsWith("/entrar") ||
    pathname.startsWith("/cadastrar") ||
    pathname.startsWith("/recuperar-senha")
  ) {
    return "admin";
  }

  if (
    pathname === "/" ||
    pathname.startsWith("/precos") ||
    pathname.startsWith("/termos") ||
    pathname.startsWith("/privacidade") ||
    pathname.startsWith("/cadastrar-trial") ||
    pathname.startsWith("/lp")
  ) {
    return "site";
  }

  return "store";
}

export const usePageTracking = (subdomainOverride?: SubdomainType) => {
  const location = useLocation();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const subdomain = subdomainOverride || detectSubdomain();
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: "virtual_page_view",
        page_path: location.pathname + location.search,
        page_title: document.title,
        page_subdomain: subdomain,
      });
    }
  }, [location, subdomainOverride]);
};

export function PageTracker({
  subdomain,
}: {
  subdomain?: SubdomainType;
}) {
  usePageTracking(subdomain);
  return null;
}
