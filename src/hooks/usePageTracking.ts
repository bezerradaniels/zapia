import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export type SubdomainType = "marketing" | "painel" | "admin" | "store";

function detectSubdomain(): SubdomainType {
  if (typeof window === "undefined") return "marketing";
  const { hostname, pathname } = window.location;

  if (hostname.startsWith("admin.")) return "admin";
  if (
    hostname.startsWith("painel.") ||
    hostname.startsWith("gestao.") ||
    hostname.startsWith("app.")
  ) {
    return "painel";
  }
  if (
    hostname.startsWith("site.") ||
    hostname === "zapia.app" ||
    hostname === "www.zapia.app"
  ) {
    return "marketing";
  }

  // Route-based detection when running on localhost or fallback
  if (pathname.startsWith("/admin")) {
    return "admin";
  }
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/nova-loja") ||
    pathname.startsWith("/entrar") ||
    pathname.startsWith("/cadastrar") ||
    pathname.startsWith("/recuperar-senha") ||
    pathname.startsWith("/onboard")
  ) {
    return "painel";
  }

  if (
    pathname === "/" ||
    pathname.startsWith("/termos") ||
    pathname.startsWith("/privacidade")
  ) {
    return "marketing";
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
        page_location: window.location.href,
        page_path: location.pathname + location.search,
        page_title: document.title,
        page_subdomain: subdomain,
        page_hostname: window.location.hostname,
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
